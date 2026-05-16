"""
SourceHighlight model — Links AI responses to exact document passages.
Maps to FR-I-03.2 from the SRS. Core "verifiable" feature of Paper Trail.
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import Integer, Text, Float, DateTime, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class SourceHighlight(Base):
    __tablename__ = "source_highlights"

    highlight_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    message_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("chat_messages.message_id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    document_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("documents.document_id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    page_number: Mapped[int] = mapped_column(Integer, nullable=False)
    bounding_box: Mapped[dict | None] = mapped_column(JSON, nullable=True)  # {x, y, width, height}
    chunk_text: Mapped[str] = mapped_column(Text, nullable=False)
    similarity_score: Mapped[float] = mapped_column(Float, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    message = relationship("ChatMessage", back_populates="source_highlights")
    document = relationship("Document", back_populates="source_highlights")

    def __repr__(self) -> str:
        return f"<SourceHighlight doc={self.document_id} page={self.page_number} score={self.similarity_score:.2f}>"
