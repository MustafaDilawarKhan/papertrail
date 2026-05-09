"""
Document model — Uploaded research files with processing state machine.
Maps to FR-D-02 from the SRS.
Processing states (from state diagram): uploading → processing → ready | failed
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Integer, Boolean, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class Document(Base):
    __tablename__ = "documents"

    document_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False, index=True
    )
    collection_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("collections.collection_id", ondelete="SET NULL"),
        nullable=True, index=True
    )
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    file_type: Mapped[str] = mapped_column(String(10), nullable=False)  # PDF, DOCX, TXT, URL
    file_size: Mapped[int] = mapped_column(Integer, nullable=False)  # bytes
    storage_path: Mapped[str] = mapped_column(String(512), nullable=False)
    processing_status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="uploading", index=True
    )
    ocr_applied: Mapped[bool] = mapped_column(Boolean, default=False)
    vectorized: Mapped[bool] = mapped_column(Boolean, default=False)
    upload_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    user = relationship("User", back_populates="documents")
    collection = relationship("Collection", back_populates="documents")
    source_highlights = relationship("SourceHighlight", back_populates="document", lazy="selectin")
    annotations = relationship("Annotation", back_populates="document", lazy="selectin")
    citations = relationship("Citation", back_populates="document", lazy="selectin")

    def __repr__(self) -> str:
        return f"<Document {self.filename} [{self.processing_status}]>"
