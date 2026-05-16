"""
Chat router — document-grounded AI conversation.

Endpoints:
- POST   /chat/sessions                          create a session
- GET    /chat/sessions                          list user sessions
- GET    /chat/sessions/{id}                     session + messages
- DELETE /chat/sessions/{id}                     delete a session
- POST   /chat/sessions/{id}/messages            (non-streaming) send a message, get full reply
- POST   /chat/sessions/{id}/messages/stream     (SSE) stream the assistant reply token-by-token

The streaming endpoint is what the frontend chat panel uses. It returns
Server-Sent Events:

  data: {"type": "delta",   "content": "…token…"}
  data: {"type": "done",    "message_id": "…", "sources": [...]}
  data: {"type": "error",   "error": "…"}

The non-streaming endpoint keeps the original JSON contract for older
clients / curl-based debugging.

Both endpoints persist the assistant reply and any parsed
`source_highlights` to the database, so the session detail endpoint
keeps showing them on reload.
"""

from __future__ import annotations

import asyncio
import json
import logging
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.chat import ChatMessage, ChatSession
from app.models.document import Document
from app.models.source_highlight import SourceHighlight
from app.models.user import User
from app.schemas.chat import (
    MessageCreateRequest,
    MessageResponse,
    SessionCreateRequest,
    SessionDetailResponse,
    SessionResponse,
)
from app.services.document_prompt import build_system_prompt
from app.services.llm_service import (
    parse_source_metadata,
    strip_source_block,
    stream_chat_completion,
)
from app.services.text_extraction import extract_for_document

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/chat", tags=["Chat"])
settings = get_settings()


# ─────────────────────────── Sessions ───────────────────────────


@router.post("/sessions", response_model=SessionResponse, status_code=status.HTTP_201_CREATED)
async def create_session(
    request: SessionCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    session = ChatSession(
        user_id=current_user.user_id,
        context_type=request.context_type,
        context_id=request.context_id,
        title=request.title,
    )
    db.add(session)
    await db.flush()
    await db.refresh(session)
    return session


@router.get("/sessions", response_model=list[SessionResponse])
async def list_sessions(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ChatSession)
        .where(ChatSession.user_id == current_user.user_id)
        .order_by(ChatSession.updated_at.desc())
    )
    return result.scalars().all()


@router.get("/sessions/{session_id}", response_model=SessionDetailResponse)
async def get_session(
    session_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    session = await _load_session(db, session_id, current_user.user_id)
    return session


@router.delete("/sessions/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_session(
    session_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    session = await _load_session(db, session_id, current_user.user_id)
    await db.delete(session)


# ─────────────────────────── Messages (non-streaming) ───────────────────────────


@router.post(
    "/sessions/{session_id}/messages",
    response_model=MessageResponse,
    status_code=status.HTTP_201_CREATED,
)
async def send_message(
    session_id: UUID,
    request: MessageCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Synchronously send a message and wait for the full assistant reply."""
    session = await _load_session(db, session_id, current_user.user_id)
    user_msg = await _persist_user_message(db, session, request.content)

    document = await _load_session_document(db, session)
    document_text = await _resolve_document_text(db, document)

    if not document_text:
        ai_text = "I could not access the document text yet. Please try again in a moment."
        ai_msg = await _persist_assistant_message(db, session, ai_text, sources=[], document=document)
        return ai_msg

    api_messages = await _build_api_messages(db, session, document, document_text, user_msg)

    full_response = ""
    try:
        async for delta in stream_chat_completion(api_messages):
            full_response += delta
    except Exception as exc:  # noqa: BLE001
        logger.exception("OpenRouter error: %s", exc)
        raise HTTPException(status_code=502, detail="AI provider error. Try again.") from exc

    display = strip_source_block(full_response)
    sources = parse_source_metadata(full_response)
    ai_msg = await _persist_assistant_message(db, session, display, sources=sources, document=document)
    return ai_msg


# ─────────────────────────── Messages (streaming SSE) ───────────────────────────


@router.post("/sessions/{session_id}/messages/stream")
async def send_message_stream(
    session_id: UUID,
    request: MessageCreateRequest,
    http_request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    SSE endpoint. Streams the assistant reply token-by-token and emits a
    final `done` event with the persisted message_id + parsed sources.
    """
    session = await _load_session(db, session_id, current_user.user_id)
    user_msg = await _persist_user_message(db, session, request.content)

    document = await _load_session_document(db, session)
    document_text = await _resolve_document_text(db, document)

    if not document_text:
        # Persist a fallback message and exit cleanly.
        async def no_doc_stream():
            msg_text = "I could not access the document text yet. Please try again in a moment."
            ai_msg = await _persist_assistant_message(db, session, msg_text, sources=[], document=document)
            yield _sse({"type": "delta", "content": msg_text})
            yield _sse({"type": "done", "message_id": str(ai_msg.message_id), "sources": []})

        return StreamingResponse(no_doc_stream(), media_type="text/event-stream")

    api_messages = await _build_api_messages(db, session, document, document_text, user_msg)

    # Commit user_msg + session before we let go of the request — the streaming
    # generator below has its own implicit transaction lifetime via FastAPI.
    await db.flush()

    async def event_generator():
        full_response = ""
        # Streaming-safe stripper for the trailing ```source ... ``` block.
        # The naive "drop deltas containing ```source" check fails because the
        # model writes that marker token-by-token, e.g. "`", "``", "source".
        # Instead we hold back the last N=len("```source") chars of the visible
        # prefix and only forward what's *definitely* not the marker start.
        SOURCE_MARKER = "```source"
        pending = ""           # bytes we haven't decided to forward yet
        in_source_block = False
        try:
            async for delta in stream_chat_completion(api_messages):
                if await http_request.is_disconnected():
                    logger.info("Client disconnected mid-stream; aborting")
                    return
                full_response += delta

                if in_source_block:
                    # Already past the marker → swallow everything else.
                    continue

                pending += delta

                marker_at = pending.find(SOURCE_MARKER)
                if marker_at != -1:
                    # Forward only the prose that came before the marker.
                    safe = pending[:marker_at]
                    if safe:
                        yield _sse({"type": "delta", "content": safe})
                    pending = ""
                    in_source_block = True
                    continue

                # Hold back the last len(SOURCE_MARKER) chars in case they are
                # the start of the marker (e.g. pending ends with "``" or "```sour").
                if len(pending) > len(SOURCE_MARKER):
                    safe_len = len(pending) - len(SOURCE_MARKER)
                    yield _sse({"type": "delta", "content": pending[:safe_len]})
                    pending = pending[safe_len:]

            # Stream ended. If we never saw the marker, the tail in `pending`
            # is real content and must be forwarded.
            if not in_source_block and pending:
                yield _sse({"type": "delta", "content": pending})
        except Exception as exc:  # noqa: BLE001
            logger.exception("OpenRouter stream error: %s", exc)
            yield _sse({"type": "error", "error": "AI provider error. Try again."})
            return

        # Final persistence.
        display = strip_source_block(full_response)
        sources = parse_source_metadata(full_response)
        try:
            ai_msg = await _persist_assistant_message(
                db, session, display, sources=sources, document=document
            )
        except Exception as exc:  # noqa: BLE001
            logger.exception("Failed to persist assistant message: %s", exc)
            yield _sse({"type": "error", "error": "Could not save reply."})
            return

        yield _sse({
            "type": "done",
            "message_id": str(ai_msg.message_id),
            "sources": sources,
        })

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache, no-transform",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # disable proxy buffering (nginx)
        },
    )


# ─────────────────────────── Internals ───────────────────────────


async def _load_session(db: AsyncSession, session_id: UUID, user_id: UUID) -> ChatSession:
    result = await db.execute(
        select(ChatSession).where(
            ChatSession.session_id == session_id,
            ChatSession.user_id == user_id,
        )
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


async def _load_session_document(
    db: AsyncSession, session: ChatSession
) -> Document | None:
    """Resolve the document this session is scoped to, if any."""
    if session.context_type != "document" or not session.context_id:
        return None
    result = await db.execute(
        select(Document).where(Document.document_id == session.context_id)
    )
    return result.scalar_one_or_none()


async def _resolve_document_text(
    db: AsyncSession, document: Document | None
) -> str | None:
    """
    Get plain-text content for a document, extracting on the fly if the
    `extracted_text` column is empty (legacy uploads).
    """
    if document is None:
        return None
    if document.extracted_text:
        return document.extracted_text

    extracted = await extract_for_document(document)
    if extracted:
        document.extracted_text = extracted
        await db.flush()
    return extracted


async def _persist_user_message(
    db: AsyncSession, session: ChatSession, content: str
) -> ChatMessage:
    msg = ChatMessage(session_id=session.session_id, role="user", content=content)
    db.add(msg)
    if not session.title:
        session.title = content[:100]
    await db.flush()
    await db.refresh(msg)
    return msg


async def _persist_assistant_message(
    db: AsyncSession,
    session: ChatSession,
    content: str,
    *,
    sources: list[dict],
    document: Document | None,
) -> ChatMessage:
    msg = ChatMessage(
        session_id=session.session_id,
        role="assistant",
        content=content,
        token_count=len(content.split()),
    )
    db.add(msg)
    await db.flush()
    await db.refresh(msg)

    if document is not None:
        for src in sources:
            highlight = SourceHighlight(
                message_id=msg.message_id,
                document_id=document.document_id,
                page_number=src.get("page", 1),
                bounding_box=None,
                chunk_text=src.get("excerpt", ""),
                similarity_score=1.0 if src.get("relevance") == "primary" else 0.7,
            )
            db.add(highlight)
        await db.flush()
        await db.refresh(msg)
    return msg


async def _build_api_messages(
    db: AsyncSession,
    session: ChatSession,
    document: Document | None,
    document_text: str,
    new_user_msg: ChatMessage,
) -> list[dict]:
    """
    Assemble the message array passed to OpenRouter:

        [ system, doc-priming (user), doc-ack (assistant),
          ...recent history..., new user turn ]
    """
    document_title = document.filename if document else "the supplied document"

    # Truncate massive documents to stay within model context.
    truncated_doc = document_text
    if len(document_text) > settings.AI_MAX_DOC_CHARS:
        truncated_doc = (
            document_text[: settings.AI_MAX_DOC_CHARS]
            + "\n\n[Document truncated due to length]"
        )

    # Recent conversation history (oldest → newest), capped.
    history_result = await db.execute(
        select(ChatMessage)
        .where(
            ChatMessage.session_id == session.session_id,
            ChatMessage.message_id != new_user_msg.message_id,
        )
        .order_by(ChatMessage.created_at.desc())
        .limit(settings.AI_MAX_HISTORY_MESSAGES)
    )
    history = list(history_result.scalars().all())[::-1]

    api_messages: list[dict] = [
        {"role": "system", "content": build_system_prompt(document_title)},
        {
            "role": "user",
            "content": (
                "Here is the document you will use to answer my questions. "
                "Use the [Page N] markers to cite page numbers accurately.\n\n"
                f"---\n{truncated_doc}\n---"
            ),
        },
        {
            "role": "assistant",
            "content": (
                f'Understood. I have read the document "{document_title}". '
                "I will only answer questions based on its content. What would you like to know?"
            ),
        },
    ]

    for m in history:
        api_messages.append({"role": m.role, "content": m.content})

    api_messages.append({"role": "user", "content": new_user_msg.content})
    return api_messages


def _sse(payload: dict) -> str:
    """Encode a single Server-Sent Event."""
    return f"data: {json.dumps(payload, ensure_ascii=False)}\n\n"
