"""Annotations Router — CRUD for document annotations."""

from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.user import User
from app.models.annotation import Annotation
from app.schemas.annotation import AnnotationCreateRequest, AnnotationUpdateRequest, AnnotationResponse
from app.middleware.auth import get_current_user

router = APIRouter(prefix="/annotations", tags=["Annotations"])


@router.post("", response_model=AnnotationResponse, status_code=status.HTTP_201_CREATED)
async def create_annotation(
    request: AnnotationCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    annotation = Annotation(user_id=current_user.user_id, **request.model_dump())
    db.add(annotation)
    await db.flush()
    await db.refresh(annotation)
    return annotation


@router.get("", response_model=list[AnnotationResponse])
async def list_annotations(
    document_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Annotation).where(
            Annotation.user_id == current_user.user_id,
            Annotation.document_id == document_id,
        ).order_by(Annotation.page_number)
    )
    return result.scalars().all()


@router.patch("/{annotation_id}", response_model=AnnotationResponse)
async def update_annotation(
    annotation_id: UUID, request: AnnotationUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Annotation).where(
            Annotation.annotation_id == annotation_id,
            Annotation.user_id == current_user.user_id,
        )
    )
    annotation = result.scalar_one_or_none()
    if not annotation:
        raise HTTPException(status_code=404, detail="Annotation not found")
    for k, v in request.model_dump(exclude_unset=True).items():
        setattr(annotation, k, v)
    await db.flush()
    await db.refresh(annotation)
    return annotation


@router.delete("/{annotation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_annotation(
    annotation_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Annotation).where(
            Annotation.annotation_id == annotation_id,
            Annotation.user_id == current_user.user_id,
        )
    )
    annotation = result.scalar_one_or_none()
    if not annotation:
        raise HTTPException(status_code=404, detail="Annotation not found")
    await db.delete(annotation)
