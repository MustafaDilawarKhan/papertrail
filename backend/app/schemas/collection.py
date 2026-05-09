"""Collection schemas."""

from pydantic import BaseModel
from datetime import datetime
from uuid import UUID


class CollectionCreateRequest(BaseModel):
    name: str
    description: str | None = None
    workspace_id: UUID | None = None
    parent_collection_id: UUID | None = None


class CollectionUpdateRequest(BaseModel):
    name: str | None = None
    description: str | None = None


class CollectionResponse(BaseModel):
    collection_id: UUID
    user_id: UUID
    workspace_id: UUID | None
    parent_collection_id: UUID | None
    name: str
    description: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
