"""
OpenRouter LLM client.

Uses the OpenAI Python SDK pointed at OpenRouter — OpenRouter is fully
OpenAI-API-compatible for `/chat/completions`. The chosen model
(`google/gemini-2.0-flash-exp:free`) supports a 1M-token context window
which is plenty for any single document we will send.

This module exposes two helpers:
 - `stream_chat_completion(...)` — async generator yielding text deltas
 - `parse_source_metadata(...)`  — strips and parses the ```source``` block

Both helpers are intentionally framework-agnostic (no FastAPI imports)
so they're easy to unit-test.
"""

from __future__ import annotations

import json
import logging
import re
from typing import AsyncIterator

from openai import (
    APIConnectionError,
    APIStatusError,
    APITimeoutError,
    AsyncOpenAI,
    RateLimitError,
)

from app.config import get_settings

logger = logging.getLogger(__name__)

_client: AsyncOpenAI | None = None

# Errors that mean "the model is unavailable right now — try the next one".
# We intentionally exclude BadRequestError / AuthenticationError because those
# are bugs that will affect every model and shouldn't be retried.
_RETRYABLE_ERRORS = (RateLimitError, APITimeoutError, APIConnectionError)
_RETRYABLE_STATUS_CODES = {408, 429, 500, 502, 503, 504}


def _get_client() -> AsyncOpenAI:
    """Lazily build a singleton AsyncOpenAI client pointed at OpenRouter."""
    global _client
    if _client is not None:
        return _client

    settings = get_settings()
    if not settings.OPENROUTER_API_KEY:
        raise RuntimeError(
            "OPENROUTER_API_KEY is not set. Add it to backend/.env to enable AI chat."
        )

    _client = AsyncOpenAI(
        api_key=settings.OPENROUTER_API_KEY,
        base_url=settings.OPENROUTER_BASE_URL,
        default_headers={
            "HTTP-Referer": settings.OPENROUTER_REFERRER,
            "X-Title": settings.OPENROUTER_APP_TITLE,
        },
    )
    return _client


async def stream_chat_completion(
    messages: list[dict],
    *,
    model: str | None = None,
    models: list[str] | None = None,
    max_tokens: int | None = None,
    temperature: float | None = None,
) -> AsyncIterator[str]:
    """
    Stream a chat completion from OpenRouter, yielding incremental text deltas.

    Falls back across the configured model chain if a model is rate-limited or
    unavailable. Crucially, the fallback only triggers when the failure happens
    BEFORE the first token streams — once content has started flowing to the
    caller, a mid-stream error is re-raised (otherwise we'd re-stream a fresh
    response from the next model and double the user's output).

    Args:
        messages: OpenAI-format message list.
        model: Override the primary model only. Fallbacks from settings still apply.
        models: Provide the full chain explicitly (skips settings.model_chain()).
        max_tokens, temperature: Standard knobs.

    Yields:
        str — incremental assistant tokens.
    """
    settings = get_settings()
    client = _get_client()

    # Build the chain to try.
    if models is not None:
        chain = list(models)
    elif model is not None:
        chain = [model] + [m for m in settings.model_chain() if m != model]
    else:
        chain = settings.model_chain()

    last_error: Exception | None = None

    for attempt, model_id in enumerate(chain):
        yielded_any = False
        try:
            stream = await client.chat.completions.create(
                model=model_id,
                messages=messages,
                max_tokens=max_tokens or settings.AI_MAX_OUTPUT_TOKENS,
                temperature=temperature if temperature is not None else settings.AI_TEMPERATURE,
                stream=True,
            )

            async for chunk in stream:
                try:
                    delta = chunk.choices[0].delta.content if chunk.choices else None
                except (IndexError, AttributeError):
                    delta = None
                if delta:
                    if not yielded_any and attempt > 0:
                        logger.info("Fallback model %s succeeded after %d previous failure(s)",
                                    model_id, attempt)
                    yielded_any = True
                    yield delta

            return  # Stream finished cleanly.

        except Exception as exc:  # noqa: BLE001 — we re-classify below
            if yielded_any:
                # Already streamed partial content to the caller — falling back
                # would duplicate output. Surface the error to the caller as-is.
                logger.warning("Mid-stream failure on %s: %s — re-raising", model_id, exc)
                raise

            if _is_retryable(exc):
                last_error = exc
                logger.warning(
                    "Model %s unavailable (%s: %s); trying next fallback",
                    model_id, type(exc).__name__, exc,
                )
                continue

            # Non-retryable error (auth, bad request, etc.) — stop immediately.
            logger.error("Non-retryable error on %s: %s", model_id, exc)
            raise

    # Exhausted the chain.
    if last_error is not None:
        raise last_error
    raise RuntimeError("No AI models configured in OPENROUTER_FALLBACK_MODELS chain.")


def _is_retryable(exc: Exception) -> bool:
    """Decide whether to walk to the next model on this error."""
    if isinstance(exc, _RETRYABLE_ERRORS):
        return True
    if isinstance(exc, APIStatusError):
        status = getattr(exc, "status_code", None)
        if status in _RETRYABLE_STATUS_CODES:
            return True
    return False


# ─────────────────────────── Source-metadata parser ───────────────────────────


_SOURCE_BLOCK_RE = re.compile(r"```source\s*([\s\S]*?)```", re.IGNORECASE)


def parse_source_metadata(response_text: str) -> list[dict]:
    """
    Extract the ```source { ... } ``` block emitted by the model.

    Returns a list of dicts shaped like:
        { "page": int, "section": str, "excerpt": str, "relevance": str }
    Always returns a list — never raises. If the block is missing or invalid
    JSON, returns []. Out-of-scope answers (per the system prompt) won't
    include a source block, which is the correct behaviour.
    """
    match = _SOURCE_BLOCK_RE.search(response_text or "")
    if not match:
        return []

    raw = match.group(1).strip()
    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError as exc:
        logger.warning("Source block JSON invalid: %s — raw=%r", exc, raw[:300])
        return []

    sources = parsed.get("sources") if isinstance(parsed, dict) else None
    if not isinstance(sources, list):
        return []

    cleaned: list[dict] = []
    for s in sources[:5]:  # hard-cap defensively
        if not isinstance(s, dict):
            continue
        try:
            page = int(s.get("page") or 1)
        except (TypeError, ValueError):
            page = 1
        cleaned.append({
            "page": max(1, page),
            "section": str(s.get("section") or "Unknown")[:200],
            "excerpt": str(s.get("excerpt") or "")[:500],
            "relevance": str(s.get("relevance") or "primary"),
        })
    return cleaned


def strip_source_block(response_text: str) -> str:
    """Remove the trailing ```source``` block so we never display raw JSON to users."""
    return _SOURCE_BLOCK_RE.sub("", response_text or "").rstrip()
