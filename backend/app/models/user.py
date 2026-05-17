"""
User model — Core account entity.
Maps to FR-D-01 (User Account Data) from the SRS.
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Boolean, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class User(Base):
    __tablename__ = "users"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False, unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    ui_theme: Mapped[str] = mapped_column(String(10), default="light")
    default_citation_style: Mapped[str] = mapped_column(String(20), default="APA")
    preferred_llm: Mapped[str | None] = mapped_column(String(50), nullable=True)
    response_length: Mapped[str] = mapped_column(String(20), default="Medium")
    affiliation: Mapped[str | None] = mapped_column(String(255), nullable=True)
    bio: Mapped[str | None] = mapped_column(String, nullable=True)
    email_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    # Platform administrator flag — controls access to /api/admin/* and the
    # /admin/* frontend routes. Bootstrapped via alter_db.py (your account is
    # promoted automatically on first migration). To promote others, run
    # `python make_admin.py <email>` from the backend container.
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    subscriptions = relationship("UserSubscription", back_populates="user", lazy="selectin")
    workspaces = relationship("Workspace", back_populates="owner", lazy="selectin")
    workspace_memberships = relationship("WorkspaceMember", back_populates="user", lazy="selectin")
    collections = relationship("Collection", back_populates="user", lazy="selectin")
    documents = relationship("Document", back_populates="user", lazy="selectin")
    chat_sessions = relationship("ChatSession", back_populates="user", lazy="selectin")
    annotations = relationship("Annotation", back_populates="user", lazy="selectin")
    citations = relationship("Citation", back_populates="user", lazy="selectin")
    notifications = relationship("Notification", back_populates="user", lazy="selectin")

    def __repr__(self) -> str:
        return f"<User {self.email}>"
