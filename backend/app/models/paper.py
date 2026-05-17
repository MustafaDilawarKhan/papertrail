"""
Paper model — User-authored papers from the in-app editor.

Distinct from `Document` (which stores uploaded source files). A Paper is a
draft the user is composing inside the editor; `blocks` is the full ordered
block list (frontmatter, abstract, sections, tables, figures, references, …)
serialized as JSON so the editor can round-trip without a schema migration
every time a new block type is added.
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class Paper(Base):
    __tablename__ = "papers"

    paper_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.user_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(512), nullable=False, default="Untitled paper")
    format: Mapped[str] = mapped_column(String(50), nullable=False, default="ieee_two_column")
    blocks: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    user = relationship("User", back_populates="papers")

    def __repr__(self) -> str:
        return f"<Paper {self.title!r}>"
