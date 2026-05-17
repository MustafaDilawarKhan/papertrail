"""Paper schemas — user-authored editor drafts."""

from typing import Any
from pydantic import BaseModel
from datetime import datetime
from uuid import UUID


class PaperCreateRequest(BaseModel):
    title: str | None = None
    format: str | None = None
    blocks: list[dict[str, Any]] | None = None


class PaperUpdateRequest(BaseModel):
    title: str | None = None
    format: str | None = None
    blocks: list[dict[str, Any]] | None = None


class PaperSummary(BaseModel):
    """List-view payload — omits the heavy `blocks` column."""
    paper_id: UUID
    title: str
    format: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PaperResponse(BaseModel):
    paper_id: UUID
    user_id: UUID
    title: str
    format: str
    blocks: list[dict[str, Any]]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
