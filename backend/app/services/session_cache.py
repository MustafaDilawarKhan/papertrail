"""Simple in-memory cache helpers for per-user API warmup payloads."""

from __future__ import annotations

import time
from typing import Any

_cache_store: dict[str, tuple[float, Any]] = {}


def get_cache(key: str, ttl_seconds: int) -> Any | None:
    cached = _cache_store.get(key)
    if not cached:
        return None

    created_at, value = cached
    if (time.time() - created_at) > ttl_seconds:
        _cache_store.pop(key, None)
        return None

    return value


def set_cache(key: str, value: Any) -> None:
    _cache_store[key] = (time.time(), value)


def delete_cache(key: str) -> None:
    _cache_store.pop(key, None)


def clear_user_bootstrap_cache(user_id: str) -> None:
    delete_cache(f"bootstrap:{user_id}")
