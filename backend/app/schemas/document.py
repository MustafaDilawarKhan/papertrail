"""Document schemas."""

from pydantic import BaseModel
from datetime import datetime
from uuid import UUID


class DocumentResponse(BaseModel):
    document_id: UUID
    user_id: UUID
    workspace_id: UUID | None
    collection_id: UUID | None
    filename: str
    file_type: str
    file_size: int
    processing_status: str
    ocr_applied: bool
    vectorized: bool
    upload_date: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class DocumentUpdateRequest(BaseModel):
    workspace_id: UUID | None = None
    collection_id: UUID | None = None
    processing_status: str | None = None
