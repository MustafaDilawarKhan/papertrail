"""
Collections Router — CRUD for nested document folders.
"""

from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.user import User
from app.models.collection import Collection
from app.schemas.collection import CollectionCreateRequest, CollectionUpdateRequest, CollectionResponse
from app.middleware.auth import get_current_user

router = APIRouter(prefix="/collections", tags=["Collections"])


@router.get("", response_model=list[CollectionResponse])
async def list_collections(
    workspace_id: UUID | None = None,
    parent_id: UUID | None = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List collections. Optionally filter by workspace or parent collection."""
    query = select(Collection).where(Collection.user_id == current_user.user_id)

    if workspace_id:
        query = query.where(Collection.workspace_id == workspace_id)
    if parent_id:
        query = query.where(Collection.parent_collection_id == parent_id)
    else:
        # Top-level collections only (no parent)
        query = query.where(Collection.parent_collection_id.is_(None))

    result = await db.execute(query.order_by(Collection.name))
    return result.scalars().all()


@router.post("", response_model=CollectionResponse, status_code=status.HTTP_201_CREATED)
async def create_collection(
    request: CollectionCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new collection (folder)."""
    collection = Collection(
        user_id=current_user.user_id,
        name=request.name,
        description=request.description,
        workspace_id=request.workspace_id,
        parent_collection_id=request.parent_collection_id,
    )
    db.add(collection)
    await db.flush()
    await db.refresh(collection)
    return collection


@router.get("/{collection_id}", response_model=CollectionResponse)
async def get_collection(
    collection_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get collection details."""
    result = await db.execute(
        select(Collection).where(
            Collection.collection_id == collection_id,
            Collection.user_id == current_user.user_id,
        )
    )
    collection = result.scalar_one_or_none()
    if not collection:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Collection not found")
    return collection


@router.patch("/{collection_id}", response_model=CollectionResponse)
async def update_collection(
    collection_id: UUID,
    request: CollectionUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a collection."""
    result = await db.execute(
        select(Collection).where(
            Collection.collection_id == collection_id,
            Collection.user_id == current_user.user_id,
        )
    )
    collection = result.scalar_one_or_none()
    if not collection:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Collection not found")

    update_data = request.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(collection, field, value)

    await db.flush()
    await db.refresh(collection)
    return collection


@router.delete("/{collection_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_collection(
    collection_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a collection and all its contents."""
    result = await db.execute(
        select(Collection).where(
            Collection.collection_id == collection_id,
            Collection.user_id == current_user.user_id,
        )
    )
    collection = result.scalar_one_or_none()
    if not collection:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Collection not found")

    await db.delete(collection)
