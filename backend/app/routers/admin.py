"""
Admin router — platform administration endpoints.

All endpoints require an authenticated user whose `is_admin` flag is True.
Promote a user with:
    docker compose -f docker-compose.dev.yml exec backend python make_admin.py <email>
"""

from __future__ import annotations

import time
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import noload

from app.database import get_db
from app.middleware.auth import get_current_admin
from app.models.chat import ChatMessage, ChatSession
from app.models.document import Document
from app.models.subscription import SubscriptionPlan, UserSubscription
from app.models.user import User
from app.models.workspace import Workspace

router = APIRouter(prefix="/admin", tags=["Admin"])


# ─────────────────────────── Stats ───────────────────────────


@router.get("/stats")
async def stats(
    _: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
    days: int = 14,
):
    """
    Top-line numbers + timeseries for the admin overview.

    Returns:
      - users / documents / workspaces / chats counters
      - plan_distribution: how many users on each subscription plan
      - timeseries: signups/uploads/messages per day for the last `days` days
    """
    total_users = (await db.execute(select(func.count(User.user_id)))).scalar() or 0
    verified_users = (await db.execute(select(func.count(User.user_id)).where(User.email_verified == True))).scalar() or 0
    admin_users = (await db.execute(select(func.count(User.user_id)).where(User.is_admin == True))).scalar() or 0
    total_docs = (await db.execute(select(func.count(Document.document_id)))).scalar() or 0
    total_workspaces = (await db.execute(select(func.count(Workspace.workspace_id)))).scalar() or 0
    total_sessions = (await db.execute(select(func.count(ChatSession.session_id)))).scalar() or 0
    total_messages = (await db.execute(select(func.count(ChatMessage.message_id)))).scalar() or 0

    since_24h = datetime.now(timezone.utc) - timedelta(hours=24)
    new_users_24h = (await db.execute(select(func.count(User.user_id)).where(User.created_at >= since_24h))).scalar() or 0
    new_docs_24h = (await db.execute(select(func.count(Document.document_id)).where(Document.upload_date >= since_24h))).scalar() or 0
    new_msgs_24h = (await db.execute(select(func.count(ChatMessage.message_id)).where(ChatMessage.created_at >= since_24h))).scalar() or 0

    # Doc-grounded chat health: how many docs have extracted text?
    docs_with_text = (await db.execute(
        select(func.count(Document.document_id)).where(Document.extracted_text.isnot(None))
    )).scalar() or 0

    # Plan distribution. Free = every user MINUS those on a paid plan, no
    # matter whether they happen to also have a "Free" subscription row
    # (some test users do — that row is ignored for counting purposes).
    plan_rows = (await db.execute(
        select(SubscriptionPlan.plan_type, func.count(UserSubscription.user_id).label("n"))
        .join(UserSubscription, UserSubscription.plan_id == SubscriptionPlan.plan_id)
        .where(UserSubscription.status == "active")
        .group_by(SubscriptionPlan.plan_type)
    )).all()
    by_plan = {row.plan_type: row.n for row in plan_rows}
    plus_n = by_plan.get("Plus", 0)
    pro_n  = by_plan.get("Pro", 0)
    plan_distribution = {
        "Free": max(0, total_users - plus_n - pro_n),
        "Plus": plus_n,
        "Pro":  pro_n,
    }

    # Timeseries — daily counts for the last `days` days. We bucket via
    # PostgreSQL date_trunc('day', ...) so timezone handling is centralised.
    days = max(1, min(days, 90))
    since_window = datetime.now(timezone.utc) - timedelta(days=days - 1)
    since_window = since_window.replace(hour=0, minute=0, second=0, microsecond=0)

    def empty_series():
        out = []
        for i in range(days):
            d = (since_window + timedelta(days=i)).date()
            out.append({"date": d.isoformat(), "count": 0})
        return out

    async def daily_count(model, time_col):
        rows = (await db.execute(
            select(
                func.date_trunc('day', time_col).label("d"),
                func.count().label("n"),
            )
            .where(time_col >= since_window)
            .group_by("d")
            .order_by("d")
        )).all()
        by_day = {r.d.date().isoformat(): r.n for r in rows}
        series = empty_series()
        for point in series:
            point["count"] = by_day.get(point["date"], 0)
        return series

    timeseries = {
        "signups": await daily_count(User, User.created_at),
        "uploads": await daily_count(Document, Document.upload_date),
        "messages": await daily_count(ChatMessage, ChatMessage.created_at),
    }

    return {
        "users": {
            "total": total_users,
            "verified": verified_users,
            "admins": admin_users,
            "new_24h": new_users_24h,
        },
        "documents": {
            "total": total_docs,
            "with_extracted_text": docs_with_text,
            "new_24h": new_docs_24h,
        },
        "workspaces": {"total": total_workspaces},
        "chats": {
            "sessions": total_sessions,
            "messages": total_messages,
            "messages_24h": new_msgs_24h,
        },
        "plan_distribution": plan_distribution,
        "timeseries": timeseries,
        "window_days": days,
    }


# ─────────────────────────── Users ───────────────────────────


@router.get("/users")
async def list_users(
    _: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
    limit: int = 200,
    offset: int = 0,
):
    """List all users with per-user counts. Newest first."""
    # Subqueries for per-user document and chat counts so we can sort + paginate
    # without N+1 queries.
    docs_count = (
        select(Document.user_id, func.count(Document.document_id).label("doc_count"))
        .group_by(Document.user_id)
        .subquery()
    )
    chats_count = (
        select(ChatSession.user_id, func.count(ChatSession.session_id).label("chat_count"))
        .group_by(ChatSession.user_id)
        .subquery()
    )
    # "Last active" — most recent activity across messages, uploads, and the
    # row's own updated_at. We don't have proper session-tracking yet, so this
    # is the best proxy. Per-user MAX across three sources, computed via two
    # subqueries (messages, uploads) plus User.updated_at.
    last_msg = (
        select(ChatSession.user_id.label("user_id"), func.max(ChatMessage.created_at).label("last_msg"))
        .join(ChatMessage, ChatMessage.session_id == ChatSession.session_id)
        .group_by(ChatSession.user_id)
        .subquery()
    )
    last_doc = (
        select(Document.user_id, func.max(Document.upload_date).label("last_doc"))
        .group_by(Document.user_id)
        .subquery()
    )
    # Each user's most recent ACTIVE subscription (a user may have historical
    # cancelled rows). We pick the latest by created_at; if none, they're Free.
    active_sub = (
        select(
            UserSubscription.user_id,
            SubscriptionPlan.plan_type.label("plan"),
        )
        .join(SubscriptionPlan, SubscriptionPlan.plan_id == UserSubscription.plan_id)
        .where(UserSubscription.status == "active")
        .order_by(UserSubscription.user_id, UserSubscription.created_at.desc())
        .distinct(UserSubscription.user_id)
        .subquery()
    )

    q = (
        select(
            User.user_id,
            User.name,
            User.email,
            User.email_verified,
            User.is_admin,
            User.created_at,
            User.updated_at,
            User.affiliation,
            func.coalesce(docs_count.c.doc_count, 0).label("doc_count"),
            func.coalesce(chats_count.c.chat_count, 0).label("chat_count"),
            func.coalesce(active_sub.c.plan, "Free").label("plan"),
            last_msg.c.last_msg,
            last_doc.c.last_doc,
        )
        .outerjoin(docs_count, docs_count.c.user_id == User.user_id)
        .outerjoin(chats_count, chats_count.c.user_id == User.user_id)
        .outerjoin(active_sub, active_sub.c.user_id == User.user_id)
        .outerjoin(last_msg, last_msg.c.user_id == User.user_id)
        .outerjoin(last_doc, last_doc.c.user_id == User.user_id)
        .order_by(User.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    result = await db.execute(q)
    rows = result.mappings().all()
    out = []
    for r in rows:
        # last_active = MAX(last_message, last_upload, user.updated_at)
        candidates = [t for t in (r["last_msg"], r["last_doc"], r["updated_at"]) if t is not None]
        last_active = max(candidates) if candidates else None
        out.append({
            "user_id": str(r["user_id"]),
            "name": r["name"],
            "email": r["email"],
            "email_verified": r["email_verified"],
            "is_admin": r["is_admin"],
            "created_at": r["created_at"].isoformat() if r["created_at"] else None,
            "last_active": last_active.isoformat() if last_active else None,
            "affiliation": r["affiliation"],
            "doc_count": r["doc_count"],
            "chat_count": r["chat_count"],
            "plan": r["plan"],
        })
    return out


@router.patch("/users/{user_id}/plan")
async def set_user_plan(
    user_id: str,
    payload: dict,
    _: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """
    Change a user's subscription plan from the admin dashboard.
    Body: { "plan": "Free" | "Plus" | "Pro" }

    Existing active subscriptions are cancelled, then a new active subscription
    is inserted pointing at the chosen plan. We always keep one active row per
    user so the bootstrap query (above) returns a single plan name.
    """
    if not isinstance(payload, dict) or "plan" not in payload:
        raise HTTPException(400, "Body must include `plan`")
    plan_type = (payload.get("plan") or "").strip()
    if not plan_type:
        raise HTTPException(400, "Plan name is empty")

    # Resolve plan_id
    plan_row = (await db.execute(
        select(SubscriptionPlan).where(SubscriptionPlan.plan_type == plan_type)
    )).scalar_one_or_none()
    if not plan_row:
        raise HTTPException(404, f"Plan '{plan_type}' does not exist")

    # Target user
    user_row = (await db.execute(
        select(User).options(noload("*")).where(User.user_id == user_id)
    )).scalar_one_or_none()
    if not user_row:
        raise HTTPException(404, "User not found")

    # Cancel any current active subs
    existing = (await db.execute(
        select(UserSubscription).where(
            UserSubscription.user_id == user_row.user_id,
            UserSubscription.status == "active",
        )
    )).scalars().all()
    for sub in existing:
        sub.status = "cancelled"
        db.add(sub)

    # Insert the new active subscription
    new_sub = UserSubscription(
        user_id=user_row.user_id,
        plan_id=plan_row.plan_id,
        status="active",
    )
    db.add(new_sub)
    await db.flush()

    return {"user_id": str(user_row.user_id), "plan": plan_row.plan_type}


@router.patch("/users/{user_id}/admin")
async def set_user_admin(
    user_id: str,
    payload: dict,
    me: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Promote or demote a user. Body: { "is_admin": true|false }"""
    if not isinstance(payload, dict) or "is_admin" not in payload:
        raise HTTPException(400, "Body must include `is_admin` boolean")
    target = await db.execute(select(User).options(noload("*")).where(User.user_id == user_id))
    user = target.scalar_one_or_none()
    if not user:
        raise HTTPException(404, "User not found")
    # Prevent the last admin from demoting themselves.
    if user.user_id == me.user_id and payload["is_admin"] is False:
        admin_count = (await db.execute(select(func.count(User.user_id)).where(User.is_admin == True))).scalar() or 0
        if admin_count <= 1:
            raise HTTPException(400, "Cannot demote the last admin")
    user.is_admin = bool(payload["is_admin"])
    await db.flush()
    return {"user_id": str(user.user_id), "is_admin": user.is_admin}


# ─────────────────────────── Activity feed ───────────────────────────


@router.get("/activity")
async def recent_activity(
    _: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
    limit: int = 50,
):
    """
    Recent platform events: signups, uploads, and chats. Returned as a single
    chronologically-sorted list for the admin "Logs" screen.
    """
    events: list[dict] = []

    # Recent signups
    recent_users = (await db.execute(
        select(User.user_id, User.name, User.email, User.created_at)
        .order_by(User.created_at.desc())
        .limit(limit)
    )).all()
    for u in recent_users:
        events.append({
            "kind": "signup",
            "timestamp": u.created_at.isoformat() if u.created_at else None,
            "actor": u.email,
            "summary": f"{u.name} signed up",
        })

    # Recent uploads
    recent_docs = (await db.execute(
        select(Document.document_id, Document.filename, Document.file_type, Document.upload_date, User.email)
        .join(User, User.user_id == Document.user_id)
        .order_by(Document.upload_date.desc())
        .limit(limit)
    )).all()
    for d in recent_docs:
        events.append({
            "kind": "upload",
            "timestamp": d.upload_date.isoformat() if d.upload_date else None,
            "actor": d.email,
            "summary": f"uploaded {d.filename} ({d.file_type})",
        })

    # Recent chat sessions (model interactions are heavy — we use sessions as a proxy)
    recent_chats = (await db.execute(
        select(ChatSession.session_id, ChatSession.title, ChatSession.created_at, User.email)
        .join(User, User.user_id == ChatSession.user_id)
        .order_by(ChatSession.created_at.desc())
        .limit(limit)
    )).all()
    for c in recent_chats:
        events.append({
            "kind": "chat",
            "timestamp": c.created_at.isoformat() if c.created_at else None,
            "actor": c.email,
            "summary": f'opened chat "{(c.title or "Untitled")[:60]}"',
        })

    # Newest first, cap.
    events.sort(key=lambda e: e["timestamp"] or "", reverse=True)
    return events[:limit]


# ─────────────────────────── Health ───────────────────────────


@router.get("/health")
async def system_health(
    _: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """
    Quick health snapshot: DB ping latency + AI gateway config presence.
    Used by the admin "System Health" screen.
    """
    health = {"checks": []}

    # 1. DB ping
    start = time.perf_counter()
    try:
        await db.execute(text("SELECT 1"))
        ms = round((time.perf_counter() - start) * 1000, 1)
        health["checks"].append({"name": "PostgreSQL", "status": "ok", "detail": f"{ms} ms"})
    except Exception as exc:  # noqa: BLE001
        health["checks"].append({"name": "PostgreSQL", "status": "down", "detail": str(exc)[:200]})

    # 2. Supabase storage
    from app.services.document_service import get_supabase_client
    sb = get_supabase_client()
    health["checks"].append({
        "name": "Supabase Storage",
        "status": "ok" if sb else "not configured",
        "detail": "SUPABASE_SERVICE_ROLE_KEY missing" if not sb else "client OK",
    })

    # 3. OpenRouter (only check the key is set — don't waste tokens on a real call)
    from app.config import get_settings
    settings = get_settings()
    health["checks"].append({
        "name": "OpenRouter (AI)",
        "status": "ok" if settings.OPENROUTER_API_KEY else "not configured",
        "detail": settings.OPENROUTER_MODEL,
    })

    # 4. Total recent error count (best-effort — we don't have a logs table,
    #    so we use docs in 'failed' state as a proxy).
    failed_docs = (await db.execute(
        select(func.count(Document.document_id)).where(Document.processing_status == "failed")
    )).scalar() or 0
    health["checks"].append({
        "name": "Document Processing",
        "status": "ok" if failed_docs == 0 else "degraded",
        "detail": f"{failed_docs} failed documents",
    })

    return health
