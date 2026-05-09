"""Citations Router — Generate and manage formatted citations."""

from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.user import User
from app.models.citation import Citation
from app.schemas.citation import CitationCreateRequest, CitationResponse
from app.middleware.auth import get_current_user

router = APIRouter(prefix="/citations", tags=["Citations"])


@router.post("", response_model=CitationResponse, status_code=status.HTTP_201_CREATED)
async def create_citation(
    request: CitationCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    citation = Citation(user_id=current_user.user_id, **request.model_dump())
    db.add(citation)
    await db.flush()
    await db.refresh(citation)
    return citation


@router.get("", response_model=list[CitationResponse])
async def list_citations(
    document_id: UUID | None = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Citation).where(Citation.user_id == current_user.user_id)
    if document_id:
        query = query.where(Citation.document_id == document_id)
    result = await db.execute(query.order_by(Citation.created_at.desc()))
    return result.scalars().all()


@router.delete("/{citation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_citation(
    citation_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Citation).where(
            Citation.citation_id == citation_id,
            Citation.user_id == current_user.user_id,
        )
    )
    citation = result.scalar_one_or_none()
    if not citation:
        raise HTTPException(status_code=404, detail="Citation not found")
    await db.delete(citation)
