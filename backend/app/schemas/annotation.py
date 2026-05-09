"""Annotation schemas."""

from pydantic import BaseModel
from datetime import datetime
from uuid import UUID


class AnnotationCreateRequest(BaseModel):
    document_id: UUID
    highlighted_text: str
    page_number: int
    coordinates: dict
    note: str | None = None
    color: str | None = None


class AnnotationUpdateRequest(BaseModel):
    note: str | None = None
    color: str | None = None


class AnnotationResponse(BaseModel):
    annotation_id: UUID
    user_id: UUID
    document_id: UUID
    highlighted_text: str
    page_number: int
    coordinates: dict
    note: str | None
    color: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
