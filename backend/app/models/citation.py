"""
Citation model — Formatted reference strings.
Maps to FR-D-04.3 from the SRS.
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class Citation(Base):
    __tablename__ = "citations"

    citation_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False
    )
    document_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("documents.document_id", ondelete="CASCADE"), nullable=False
    )
    style: Mapped[str] = mapped_column(String(20), nullable=False)  # APA | MLA | Chicago | BibTeX
    formatted_string: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    user = relationship("User", back_populates="citations")
    document = relationship("Document", back_populates="citations")

    def __repr__(self) -> str:
        return f"<Citation [{self.style}] {self.formatted_string[:50]}...>"
