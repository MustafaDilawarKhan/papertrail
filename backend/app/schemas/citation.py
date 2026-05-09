"""Citation schemas."""

from pydantic import BaseModel
from datetime import datetime
from uuid import UUID


class CitationCreateRequest(BaseModel):
    document_id: UUID
    style: str  # APA | MLA | Chicago | BibTeX
    formatted_string: str


class CitationResponse(BaseModel):
    citation_id: UUID
    user_id: UUID
    document_id: UUID
    style: str
    formatted_string: str
    created_at: datetime

    model_config = {"from_attributes": True}
