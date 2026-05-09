"""Chat schemas."""

from pydantic import BaseModel
from datetime import datetime
from uuid import UUID


class SessionCreateRequest(BaseModel):
    context_type: str = "general"  # document | collection | workspace | general
    context_id: UUID | None = None
    title: str | None = None


class MessageCreateRequest(BaseModel):
    content: str


class SourceHighlightResponse(BaseModel):
    highlight_id: UUID
    document_id: UUID
    page_number: int
    bounding_box: dict | None
    chunk_text: str
    similarity_score: float

    model_config = {"from_attributes": True}


class MessageResponse(BaseModel):
    message_id: UUID
    session_id: UUID
    role: str
    content: str
    token_count: int | None
    created_at: datetime
    source_highlights: list[SourceHighlightResponse] = []

    model_config = {"from_attributes": True}


class SessionResponse(BaseModel):
    session_id: UUID
    user_id: UUID
    context_type: str
    context_id: UUID | None
    title: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class SessionDetailResponse(SessionResponse):
    messages: list[MessageResponse] = []
