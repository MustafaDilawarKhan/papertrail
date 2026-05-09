"""Workspace schemas."""

from pydantic import BaseModel
from datetime import datetime
from uuid import UUID


class WorkspaceCreateRequest(BaseModel):
    name: str


class WorkspaceUpdateRequest(BaseModel):
    name: str | None = None


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
    created_at: datetime
    updated_at: datetime
    members: list[WorkspaceMemberResponse] = []

    model_config = {"from_attributes": True}


class AddMemberRequest(BaseModel):
    user_id: UUID
    role: str = "Viewer"  # Owner | Editor | Viewer
