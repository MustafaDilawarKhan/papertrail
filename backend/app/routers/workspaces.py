"""
Workspaces Router — CRUD for workspaces and member management.
"""

import time
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from sqlalchemy.orm import noload
from app.database import get_db
from app.models.user import User
from app.models.workspace import Workspace, WorkspaceMember
from app.models.notification import Notification
from app.schemas.workspace import (
    WorkspaceCreateRequest, WorkspaceUpdateRequest,
    WorkspaceResponse, AddMemberRequest, WorkspaceMemberResponse,
)
from app.schemas.notification import NotificationResponse
from app.middleware.auth import get_current_user
from app.services.session_cache import clear_user_bootstrap_cache

router = APIRouter(prefix="/workspaces", tags=["Workspaces"])
WORKSPACES_CACHE_TTL_SECONDS = 30
workspaces_cache: dict[str, tuple[float, list[dict]]] = {}


def clear_workspace_caches(user_id: UUID) -> None:
    workspaces_cache.pop(str(user_id), None)
    clear_user_bootstrap_cache(str(user_id))


def clear_workspace_caches_for_user_id(user_id: UUID) -> None:
    workspaces_cache.pop(str(user_id), None)
    clear_user_bootstrap_cache(str(user_id))


@router.get("", response_model=list[WorkspaceResponse])
async def list_workspaces(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all workspaces the user owns or is a member of."""
    cache_key = str(current_user.user_id)
    cached = workspaces_cache.get(cache_key)
    if cached and (time.time() - cached[0]) < WORKSPACES_CACHE_TTL_SECONDS:
        return cached[1]

    member_ws_ids = (
        select(WorkspaceMember.workspace_id)
        .where(WorkspaceMember.user_id == current_user.user_id)
        .subquery()
    )
    result = await db.execute(
        select(Workspace)
        .options(noload("*"))
        .where(
            or_(
                Workspace.owner_id == current_user.user_id,
                Workspace.workspace_id.in_(select(member_ws_ids.c.workspace_id)),
            )
        )
        .order_by(Workspace.updated_at.desc())
    )
    items = result.scalars().all()
    payload = [WorkspaceResponse.model_validate(item).model_dump() for item in items]
    workspaces_cache[cache_key] = (time.time(), payload)
    return payload


@router.post("", response_model=WorkspaceResponse, status_code=status.HTTP_201_CREATED)
async def create_workspace(
    request: WorkspaceCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new workspace."""
    workspace = Workspace(
        owner_id=current_user.user_id,
        name=request.name,
        description=request.description,
        privacy=request.privacy,
    )
    db.add(workspace)
    await db.flush()

    # Add owner as a member with Owner role
    member = WorkspaceMember(
        workspace_id=workspace.workspace_id,
        user_id=current_user.user_id,
        role="Owner",
    )
    db.add(member)
    await db.flush()
    await db.refresh(workspace)
    clear_workspace_caches(current_user.user_id)

    return workspace


@router.get("/{workspace_id}", response_model=WorkspaceResponse)
async def get_workspace(
    workspace_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get workspace details."""
    result = await db.execute(
        select(Workspace).where(Workspace.workspace_id == workspace_id)
    )
    workspace = result.scalar_one_or_none()

    if not workspace:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")

    return workspace


@router.patch("/{workspace_id}", response_model=WorkspaceResponse)
async def update_workspace(
    workspace_id: UUID,
    request: WorkspaceUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update workspace (owner only)."""
    result = await db.execute(
        select(Workspace).where(
            Workspace.workspace_id == workspace_id,
            Workspace.owner_id == current_user.user_id,
        )
    )
    workspace = result.scalar_one_or_none()

    if not workspace:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found or not authorized")

    update_data = request.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(workspace, field, value)

    await db.flush()
    await db.refresh(workspace)
    clear_workspace_caches(current_user.user_id)
    return workspace


@router.delete("/{workspace_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_workspace(
    workspace_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete workspace (owner only)."""
    result = await db.execute(
        select(Workspace).where(
            Workspace.workspace_id == workspace_id,
            Workspace.owner_id == current_user.user_id,
        )
    )
    workspace = result.scalar_one_or_none()

    if not workspace:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found or not authorized")

    await db.delete(workspace)
    clear_workspace_caches(current_user.user_id)


@router.post("/{workspace_id}/members", response_model=NotificationResponse, status_code=status.HTTP_201_CREATED)
async def add_member(
    workspace_id: UUID,
    request: AddMemberRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Add a member to a workspace by email (owner only)."""
    # Verify ownership
    result = await db.execute(
        select(Workspace).where(
            Workspace.workspace_id == workspace_id,
            Workspace.owner_id == current_user.user_id,
        )
    )
    workspace = result.scalar_one_or_none()
    if not workspace:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found or not authorized")

    user_result = await db.execute(select(User).where(User.email == request.email))
    invited_user = user_result.scalar_one_or_none()
    if not invited_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No user found with that email")

    # Check if user is already a member
    existing = await db.execute(
        select(WorkspaceMember).where(
            WorkspaceMember.workspace_id == workspace_id,
            WorkspaceMember.user_id == invited_user.user_id,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="User is already a member")

    # Instead of immediately adding the member, create a pending invite notification.
    # The invited user must accept the invite via the notifications UI.
    import json

    notification = Notification(
        user_id=invited_user.user_id,
        type="workspace_invite",
        title=f"Invited to {workspace.name}",
        message=f"{current_user.name} invited you to the workspace '{workspace.name}'.",
        related_id=workspace_id,
        data=json.dumps({"role": request.role, "inviter_id": str(current_user.user_id), "inviter_name": current_user.name}),
    )
    db.add(notification)
    await db.flush()
    await db.refresh(notification)

    clear_workspace_caches(current_user.user_id)
    clear_workspace_caches_for_user_id(invited_user.user_id)
    return notification


@router.delete("/{workspace_id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_member(
    workspace_id: UUID,
    user_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Remove a member from a workspace (owner only)."""
    # Verify ownership
    result = await db.execute(
        select(Workspace).where(
            Workspace.workspace_id == workspace_id,
            Workspace.owner_id == current_user.user_id,
        )
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found or not authorized")

    member_result = await db.execute(
        select(WorkspaceMember).where(
            WorkspaceMember.workspace_id == workspace_id,
            WorkspaceMember.user_id == user_id,
        )
    )
    member = member_result.scalar_one_or_none()
    if not member:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")

    removed_user_id = member.user_id
    await db.delete(member)
    clear_workspace_caches(current_user.user_id)
    clear_workspace_caches_for_user_id(removed_user_id)
