"""
Workspaces Router — CRUD for workspaces and member management.
"""

from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.user import User
from app.models.workspace import Workspace, WorkspaceMember
from app.schemas.workspace import (
    WorkspaceCreateRequest, WorkspaceUpdateRequest,
    WorkspaceResponse, AddMemberRequest, WorkspaceMemberResponse,
)
from app.middleware.auth import get_current_user

router = APIRouter(prefix="/workspaces", tags=["Workspaces"])


@router.get("", response_model=list[WorkspaceResponse])
async def list_workspaces(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all workspaces the user owns or is a member of."""
    # Workspaces the user owns
    owned = await db.execute(
        select(Workspace).where(Workspace.owner_id == current_user.user_id)
    )
    owned_workspaces = list(owned.scalars().all())

    # Workspaces the user is a member of
    memberships = await db.execute(
        select(WorkspaceMember.workspace_id).where(WorkspaceMember.user_id == current_user.user_id)
    )
    member_ws_ids = [m[0] for m in memberships.all()]

    if member_ws_ids:
        member_ws = await db.execute(
            select(Workspace).where(
                Workspace.workspace_id.in_(member_ws_ids),
                Workspace.owner_id != current_user.user_id,
            )
        )
        owned_workspaces.extend(member_ws.scalars().all())

    return owned_workspaces


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


@router.post("/{workspace_id}/members", response_model=WorkspaceMemberResponse, status_code=status.HTTP_201_CREATED)
async def add_member(
    workspace_id: UUID,
    request: AddMemberRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Add a member to a workspace (owner only)."""
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

    # Check if user is already a member
    existing = await db.execute(
        select(WorkspaceMember).where(
            WorkspaceMember.workspace_id == workspace_id,
            WorkspaceMember.user_id == request.user_id,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="User is already a member")

    member = WorkspaceMember(
        workspace_id=workspace_id,
        user_id=request.user_id,
        role=request.role,
    )
    db.add(member)
    await db.flush()
    await db.refresh(member)
    return member


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

    await db.delete(member)
