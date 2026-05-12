"""
Notifications Router — User notifications for invites, mentions, etc.
"""

import json
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.database import get_db
from app.models.user import User
from app.models.notification import Notification
from app.models.workspace import WorkspaceMember, Workspace
from app.schemas.notification import (
    NotificationResponse, NotificationCreateRequest, NotificationMarkReadRequest,
)
from app.middleware.auth import get_current_user
from app.services.session_cache import clear_user_bootstrap_cache

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("", response_model=list[NotificationResponse])
async def list_notifications(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    unread_only: bool = False,
):
    """List user's notifications."""
    query = select(Notification).where(
        Notification.user_id == current_user.user_id
    )
    
    if unread_only:
        query = query.where(Notification.read == False)
    
    query = query.order_by(desc(Notification.created_at))
    
    result = await db.execute(query)
    notifications = result.scalars().all()
    return notifications


@router.get("/unread-count")
async def get_unread_count(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get count of unread notifications."""
    result = await db.execute(
        select(Notification).where(
            Notification.user_id == current_user.user_id,
            Notification.read == False,
        )
    )
    unread = result.scalars().all()
    return {"unread_count": len(unread)}


@router.patch("/{notification_id}", response_model=NotificationResponse)
async def mark_notification_read(
    notification_id: UUID,
    request: NotificationMarkReadRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Mark a notification as read/unread."""
    result = await db.execute(
        select(Notification).where(
            Notification.notification_id == notification_id,
            Notification.user_id == current_user.user_id,
        )
    )
    notification = result.scalar_one_or_none()

    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found",
        )

    notification.read = request.read
    await db.flush()
    await db.refresh(notification)
    return notification


@router.delete("/{notification_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_notification(
    notification_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a notification."""
    result = await db.execute(
        select(Notification).where(
            Notification.notification_id == notification_id,
            Notification.user_id == current_user.user_id,
        )
    )
    notification = result.scalar_one_or_none()

    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found",
        )

    await db.delete(notification)


@router.post("", response_model=NotificationResponse, status_code=status.HTTP_201_CREATED)
async def create_notification(
    user_id: UUID,
    request: NotificationCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a notification (internal use)."""
    # Verify the user exists
    user_result = await db.execute(
        select(User).where(User.user_id == user_id)
    )
    if not user_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    notification = Notification(
        user_id=user_id,
        type=request.type,
        title=request.title,
        message=request.message,
        related_id=request.related_id,
    )
    db.add(notification)
    await db.flush()
    await db.refresh(notification)
    return notification


@router.post("/{notification_id}/accept", response_model=NotificationResponse)
async def accept_workspace_invite(
    notification_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Accept a workspace invite notification."""
    # Get the notification
    result = await db.execute(
        select(Notification).where(
            Notification.notification_id == notification_id,
            Notification.user_id == current_user.user_id,
        )
    )
    notification = result.scalar_one_or_none()

    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found",
        )

    if notification.type != "workspace_invite":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This notification is not a workspace invite",
        )

    # Extract role from data field
    role = "Viewer"
    if notification.data:
        try:
            data = json.loads(notification.data)
            role = data.get("role", "Viewer")
        except (json.JSONDecodeError, TypeError):
            pass

    workspace_id = notification.related_id
    if not workspace_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid invitation data",
        )

    # Check if workspace exists
    ws_result = await db.execute(
        select(Workspace).where(Workspace.workspace_id == workspace_id)
    )
    if not ws_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found",
        )

    # Check if user is already a member
    existing = await db.execute(
        select(WorkspaceMember).where(
            WorkspaceMember.workspace_id == workspace_id,
            WorkspaceMember.user_id == current_user.user_id,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You are already a member of this workspace",
        )

    # Create workspace membership
    member = WorkspaceMember(
        workspace_id=workspace_id,
        user_id=current_user.user_id,
        role=role,
    )
    db.add(member)

    # Mark notification as read
    notification.read = True
    await db.flush()
    await db.refresh(notification)

    # Clear caches
    clear_user_bootstrap_cache(str(current_user.user_id))

    return notification
