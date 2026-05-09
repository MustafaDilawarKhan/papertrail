"""
Subscriptions Router — Plan listing and subscription management.
"""

from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.user import User
from app.models.subscription import SubscriptionPlan, UserSubscription
from app.schemas.subscription import PlanResponse, SubscribeRequest, SubscriptionResponse
from app.middleware.auth import get_current_user

router = APIRouter(prefix="/subscriptions", tags=["Subscriptions"])


@router.get("/plans", response_model=list[PlanResponse])
async def list_plans(db: AsyncSession = Depends(get_db)):
    """List all available subscription plans."""
    result = await db.execute(
        select(SubscriptionPlan).order_by(SubscriptionPlan.price)
    )
    plans = result.scalars().all()
    return plans


@router.post("/subscribe", response_model=SubscriptionResponse, status_code=status.HTTP_201_CREATED)
async def subscribe(
    request: SubscribeRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Subscribe the current user to a plan."""
    # Verify plan exists
    result = await db.execute(
        select(SubscriptionPlan).where(SubscriptionPlan.plan_id == request.plan_id)
    )
    plan = result.scalar_one_or_none()

    if not plan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plan not found")

    # Create subscription
    now = datetime.now(timezone.utc)
    subscription = UserSubscription(
        user_id=current_user.user_id,
        plan_id=request.plan_id,
        status="active",
        current_period_start=now,
        current_period_end=now + timedelta(days=30),
    )
    db.add(subscription)
    await db.flush()
    await db.refresh(subscription)

    return subscription


@router.get("/current", response_model=SubscriptionResponse | None)
async def get_current_subscription(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get the current user's active subscription."""
    result = await db.execute(
        select(UserSubscription)
        .where(
            UserSubscription.user_id == current_user.user_id,
            UserSubscription.status == "active",
        )
        .order_by(UserSubscription.created_at.desc())
        .limit(1)
    )
    subscription = result.scalar_one_or_none()
    return subscription
