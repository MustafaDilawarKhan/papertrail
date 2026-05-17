"""
Paper Trail Backend — SQLAlchemy Models
Imports all models so Alembic and Base.metadata can discover them.
"""

from app.models.user import User
from app.models.subscription import SubscriptionPlan, UserSubscription
from app.models.workspace import Workspace, WorkspaceMember
from app.models.collection import Collection
from app.models.document import Document
from app.models.chat import ChatSession, ChatMessage
from app.models.source_highlight import SourceHighlight
from app.models.annotation import Annotation
from app.models.citation import Citation
from app.models.notification import Notification
from app.models.paper import Paper

__all__ = [
    "User",
    "SubscriptionPlan",
    "UserSubscription",
    "Workspace",
    "WorkspaceMember",
    "Collection",
    "Document",
    "ChatSession",
    "ChatMessage",
    "SourceHighlight",
    "Annotation",
    "Citation",
    "Notification",
    "Paper",
]
