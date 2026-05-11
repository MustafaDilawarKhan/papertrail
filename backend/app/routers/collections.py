"""
Collections Router — CRUD for nested document folders.
"""

import time
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import noload
from app.database import get_db
from app.models.user import User
from app.models.collection import Collection
from app.schemas.collection import CollectionCreateRequest, CollectionUpdateRequest, CollectionResponse
from app.middleware.auth import get_current_user
from app.services.session_cache import clear_user_bootstrap_cache

router = APIRouter(prefix="/collections", tags=["Collections"])
COLLECTIONS_CACHE_TTL_SECONDS = 30
collections_cache: dict[tuple[str, str | None, str | None], tuple[float, list[dict]]] = {}


def clear_collection_caches(user_id: UUID) -> None:
    user_key = str(user_id)
    keys = [key for key in collections_cache if key[0] == user_key]
    for key in keys:
        collections_cache.pop(key, None)
    clear_user_bootstrap_cache(user_key)


@router.get("", response_model=list[CollectionResponse])
async def list_collections(
    workspace_id: UUID | None = None,
    parent_id: UUID | None = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List collections. Optionally filter by workspace or parent collection."""
    cache_key = (
        str(current_user.user_id),
        str(workspace_id) if workspace_id else None,
        str(parent_id) if parent_id else None,
    )
    cached = collections_cache.get(cache_key)
    if cached and (time.time() - cached[0]) < COLLECTIONS_CACHE_TTL_SECONDS:
        return cached[1]

    query = (
        select(Collection)
        .options(noload("*"))
        .where(Collection.user_id == current_user.user_id)
    )

    if workspace_id:
        query = query.where(Collection.workspace_id == workspace_id)
    if parent_id:
        query = query.where(Collection.parent_collection_id == parent_id)
    else:
        # Top-level collections only (no parent)
        query = query.where(Collection.parent_collection_id.is_(None))

    result = await db.execute(query.order_by(Collection.name))
    items = result.scalars().all()
    payload = [CollectionResponse.model_validate(item).model_dump() for item in items]
    collections_cache[cache_key] = (time.time(), payload)
    return payload


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
    clear_collection_caches(current_user.user_id)
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
    clear_collection_caches(current_user.user_id)
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
    clear_collection_caches(current_user.user_id)
