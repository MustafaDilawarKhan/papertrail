"""Subscription schemas."""

from pydantic import BaseModel
from datetime import datetime
from uuid import UUID


class PlanResponse(BaseModel):
    plan_id: UUID
    plan_type: str
    storage_limit_mb: int
    document_limit: int
    ai_words_per_day: int
    imports_per_day: int
    price: float
    billing_cycle: str
    features: dict

    model_config = {"from_attributes": True}


class SubscribeRequest(BaseModel):
    plan_id: UUID


class SubscriptionResponse(BaseModel):
    subscription_id: UUID
    user_id: UUID
    plan_id: UUID
    status: str
    current_period_start: datetime | None
    current_period_end: datetime | None
    created_at: datetime
    plan: PlanResponse | None = None

    model_config = {"from_attributes": True}
