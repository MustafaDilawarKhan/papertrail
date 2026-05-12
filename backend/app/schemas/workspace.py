"""Workspace schemas."""

from pydantic import BaseModel
from pydantic import EmailStr
from datetime import datetime
from uuid import UUID


class WorkspaceCreateRequest(BaseModel):
    name: str
    description: str | None = None
    privacy: str = "private"  # private | team | public


class WorkspaceUpdateRequest(BaseModel):
    name: str | None = None
    description: str | None = None
    privacy: str | None = None


class WorkspaceMemberResponse(BaseModel):
    member_id: UUID
    user_id: UUID
    role: str
    joined_at: datetime

    model_config = {"from_attributes": True}


class WorkspaceResponse(BaseModel):
    workspace_id: UUID
    owner_id: UUID
    name: str
    description: str | None = None
    privacy: str
    created_at: datetime
    updated_at: datetime
    members: list[WorkspaceMemberResponse] = []

    model_config = {"from_attributes": True}


class AddMemberRequest(BaseModel):
    email: EmailStr
    role: str = "Viewer"  # Owner | Editor | Viewer
