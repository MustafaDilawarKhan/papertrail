"""
Top-level RAG API.

Two entry points:

    ingest_document(path, doc_id=None) → str
        Extract, chunk, embed, persist. Returns the doc_id used.

    ask(question, doc_id=None, top_k=5) → AnswerResponse
        Retrieve top-k chunks. If an LLM key is configured, synthesise
        a cited answer; otherwise return the chunks raw so the caller
        can render them however it wants.
"""

from __future__ import annotations

import json
import re
import uuid
from dataclasses import dataclass, field
from pathlib import Path

from rag import config, embeddings, prompt, vector_store
from rag.chunking import chunk_text
from rag.extraction import extract_text


@dataclass(slots=True)
class Source:
    page: int
    section: str
    excerpt: str
    relevance: str
    score: float = 0.0


@dataclass(slots=True)
class AnswerResponse:
    answer: str
    sources: list[Source] = field(default_factory=list)
    retrieved_passages: list[dict] = field(default_factory=list)
    used_llm: bool = False


# ─── Ingestion ────────────────────────────────────────────────────────────


def ingest_document(path: str | Path, doc_id: str | None = None) -> str:
    """
    Run the full ingestion pipeline for one document and return its
    `doc_id` (auto-generated if not supplied).
    """
    doc_id = doc_id or f"doc-{uuid.uuid4().hex[:12]}"
    text = extract_text(path)
    chunks = chunk_text(text)
    if not chunks:
        return doc_id

    vectors = embeddings.embed_documents([c.text for c in chunks])
    vector_store.add_chunks(
        doc_id=doc_id,
        chunks=[
            {
                "text": c.text,
                "chunk_index": c.chunk_index,
                "page_number": c.page_number,
                "start_char": c.start_char,
                "end_char": c.end_char,
            }
            for c in chunks
        ],
        embeddings=vectors,
    )
    return doc_id


# ─── Retrieval-only ───────────────────────────────────────────────────────


def retrieve(question: str, *, top_k: int | None = None, doc_id: str | None = None) -> list[dict]:
    """Just retrieve — no LLM call. Useful as a building block."""
    k = top_k if top_k is not None else config.DEFAULT_TOP_K
    vec = embeddings.embed_query(question)
    hits = vector_store.query(embedding=vec, top_k=k, doc_id=doc_id)
    return [h for h in hits if h["score"] >= config.MIN_SIMILARITY]


# ─── Answer generation ────────────────────────────────────────────────────


_SOURCE_BLOCK_RE = re.compile(r"```source\s*(\{.*?\})\s*```", re.DOTALL)


def _parse_sources(answer_text: str, passages: list[dict]) -> tuple[str, list[Source]]:
    """
    Pull the trailing ```source ... ``` JSON out, return the answer
    without it and a parsed list of Source dataclasses. Falls back
    gracefully if the model emitted a malformed block.
    """
    match = _SOURCE_BLOCK_RE.search(answer_text)
    if not match:
        return answer_text.strip(), []

    body_without_block = _SOURCE_BLOCK_RE.sub("", answer_text).strip()
    try:
        payload = json.loads(match.group(1))
    except json.JSONDecodeError:
        return body_without_block, []

    raw_sources = payload.get("sources", []) if isinstance(payload, dict) else []
    sources: list[Source] = []
    for i, raw in enumerate(raw_sources):
        if not isinstance(raw, dict):
            continue
        # Attach the retrieval similarity from the matching passage if
        # the model preserved order (which the prompt asks it to).
        score = passages[i]["score"] if i < len(passages) else 0.0
        sources.append(Source(
            page=int(raw.get("page", passages[i]["page_number"] if i < len(passages) else 1)),
            section=str(raw.get("section", "Unknown")),
            excerpt=str(raw.get("excerpt", "")),
            relevance=str(raw.get("relevance", "supporting")),
            score=score,
        ))
    return body_without_block, sources


def _call_llm(question: str, passages: list[dict]) -> str:
    """OpenAI-SDK-compatible call against OpenRouter."""
    from openai import OpenAI

    client = OpenAI(api_key=config.OPENROUTER_API_KEY, base_url=config.OPENROUTER_BASE_URL)
    resp = client.chat.completions.create(
        model=config.LLM_MODEL,
        temperature=config.LLM_TEMPERATURE,
        max_tokens=config.LLM_MAX_TOKENS,
        messages=[
            {"role": "system", "content": prompt.SYSTEM_PROMPT},
            {"role": "user",   "content": prompt.build_user_message(question, passages)},
        ],
    )
    return resp.choices[0].message.content or ""


def ask(question: str, *, doc_id: str | None = None, top_k: int | None = None) -> AnswerResponse:
    """
    End-to-end query. Returns an `AnswerResponse` whose shape matches
    what the main app's chat router would emit:

        { answer, sources: [{page, section, excerpt, relevance, score}], ... }

    If OPENROUTER_API_KEY is unset, `used_llm` is False and the answer
    is a stub message — the retrieved passages are still returned for
    inspection.
    """
    passages = retrieve(question, top_k=top_k, doc_id=doc_id)
    if not passages:
        return AnswerResponse(
            answer="The retrieved passages do not contain information on that.",
            sources=[],
            retrieved_passages=[],
            used_llm=False,
        )

    if not config.OPENROUTER_API_KEY:
        # Retrieval-only mode — return the chunks so the caller can do
        # whatever they like with them. Keeps the pipeline usable for
        # debugging / unit tests / demo without burning an API call.
        preview = "; ".join(p["text"][:120].replace("\n", " ") for p in passages[:3])
        return AnswerResponse(
            answer=f"(LLM disabled — set OPENROUTER_API_KEY to enable answers.)\n\nTop retrieved passages: {preview}",
            sources=[
                Source(
                    page=p["page_number"], section="Unknown",
                    excerpt=p["text"][:160], relevance="primary" if i == 0 else "supporting",
                    score=p["score"],
                )
                for i, p in enumerate(passages)
            ],
            retrieved_passages=passages,
            used_llm=False,
        )

    raw = _call_llm(question, passages)
    body, sources = _parse_sources(raw, passages)
    return AnswerResponse(
        answer=body,
        sources=sources,
        retrieved_passages=passages,
        used_llm=True,
    )
