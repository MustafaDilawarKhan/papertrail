"""
Papers Router — CRUD for user-authored editor drafts.

Powers the "My Papers" sidebar (list/open/delete) and the editor's autosave
(PATCH on a debounced timer from the client).
"""

from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.user import User
from app.models.paper import Paper
from app.schemas.paper import (
    PaperCreateRequest,
    PaperUpdateRequest,
    PaperSummary,
    PaperResponse,
)
from app.middleware.auth import get_current_user

router = APIRouter(prefix="/papers", tags=["Papers"])


@router.get("", response_model=list[PaperSummary])
async def list_papers(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Paper)
        .where(Paper.user_id == current_user.user_id)
        .order_by(Paper.updated_at.desc())
    )
    return result.scalars().all()


@router.post("", response_model=PaperResponse, status_code=status.HTTP_201_CREATED)
async def create_paper(
    request: PaperCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    paper = Paper(
        user_id=current_user.user_id,
        title=request.title or "Untitled paper",
        format=request.format or "ieee_two_column",
        blocks=request.blocks or [],
    )
    db.add(paper)
    await db.flush()
    await db.refresh(paper)
    return paper


@router.get("/{paper_id}", response_model=PaperResponse)
async def get_paper(
    paper_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Paper).where(
            Paper.paper_id == paper_id,
            Paper.user_id == current_user.user_id,
        )
    )
    paper = result.scalar_one_or_none()
    if not paper:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Paper not found")
    return paper


@router.patch("/{paper_id}", response_model=PaperResponse)
async def update_paper(
    paper_id: UUID,
    request: PaperUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Paper).where(
            Paper.paper_id == paper_id,
            Paper.user_id == current_user.user_id,
        )
    )
    paper = result.scalar_one_or_none()
    if not paper:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Paper not found")

    update_data = request.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(paper, field, value)

    await db.flush()
    await db.refresh(paper)
    return paper


@router.delete("/{paper_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_paper(
    paper_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Paper).where(
            Paper.paper_id == paper_id,
            Paper.user_id == current_user.user_id,
        )
    )
    paper = result.scalar_one_or_none()
    if not paper:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Paper not found")
    await db.delete(paper)
