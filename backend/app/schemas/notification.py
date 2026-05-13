"""Notification schemas."""

import json
from pydantic import BaseModel, field_validator
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

    @field_validator("data", mode="before")
    @classmethod
    def parse_data_json(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except (json.JSONDecodeError, TypeError):
                return None
        return v


class NotificationMarkReadRequest(BaseModel):
    read: bool = True
