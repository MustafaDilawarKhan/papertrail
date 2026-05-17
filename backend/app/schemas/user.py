"""User schemas — Profile responses and update requests."""

from pydantic import BaseModel, EmailStr
from datetime import datetime
from uuid import UUID


class UserResponse(BaseModel):
    user_id: UUID
    name: str
    email: EmailStr
    ui_theme: str
    default_citation_style: str
    preferred_llm: str | None
    response_length: str
    affiliation: str | None = None
    bio: str | None = None
    email_verified: bool
    is_admin: bool = False
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class UserUpdateRequest(BaseModel):
    name: str | None = None
    ui_theme: str | None = None
    default_citation_style: str | None = None
    preferred_llm: str | None = None
    response_length: str | None = None
    affiliation: str | None = None
    bio: str | None = None
