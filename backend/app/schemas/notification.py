"""Notification schemas."""

from pydantic import BaseModel
from datetime import datetime
from uuid import UUID


class NotificationCreateRequest(BaseModel):
    type: str  # workspace_invite, mention, etc.
    title: str
    message: str
    related_id: UUID | None = None
    data: dict | None = None


class NotificationResponse(BaseModel):
    notification_id: UUID
    user_id: UUID
    type: str
    title: str
    message: str
    related_id: UUID | None = None
    data: dict | None = None
    read: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class NotificationMarkReadRequest(BaseModel):
    read: bool = True
