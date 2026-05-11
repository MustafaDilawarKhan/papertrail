"""
Documents Router — File upload, listing, and management.
"""

from uuid import UUID
import time
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from sqlalchemy.orm import noload
from app.database import get_db
from app.models.user import User
from app.models.document import Document
from app.models.workspace import Workspace, WorkspaceMember
from app.models.collection import Collection
from app.schemas.document import DocumentResponse, DocumentViewUrlResponse
from app.services.document_service import save_upload, get_file_type, validate_file, delete_file, get_view_url, get_local_file_url
from app.services.session_cache import clear_user_bootstrap_cache
from app.middleware.auth import get_current_user

router = APIRouter(prefix="/documents", tags=["Documents"])

LIST_CACHE_TTL_SECONDS = 20
VIEW_URL_CACHE_TTL_SECONDS = 60
document_list_cache: dict[tuple[str, str | None, str | None], tuple[float, list[dict]]] = {}
document_view_url_cache: dict[tuple[str, str], tuple[float, dict]] = {}


def clear_user_document_caches(user_id: UUID) -> None:
    user_key = str(user_id)
    list_keys = [key for key in document_list_cache if key[0] == user_key]
    for key in list_keys:
        document_list_cache.pop(key, None)

    view_keys = [key for key in document_view_url_cache if key[0] == user_key]
    for key in view_keys:
        document_view_url_cache.pop(key, None)

    clear_user_bootstrap_cache(user_key)


def accessible_workspace_ids_subquery(user_id: UUID):
    return (
        select(Workspace.workspace_id)
        .where(Workspace.owner_id == user_id)
        .union(select(WorkspaceMember.workspace_id).where(WorkspaceMember.user_id == user_id))
        .subquery()
    )


async def has_workspace_access(db: AsyncSession, user_id: UUID, workspace_id: UUID) -> bool:
    ws_ids = accessible_workspace_ids_subquery(user_id)
    result = await db.execute(
        select(Workspace.workspace_id)
        .where(
            Workspace.workspace_id == workspace_id,
            Workspace.workspace_id.in_(select(ws_ids.c.workspace_id)),
        )
    )
    return result.scalar_one_or_none() is not None


async def ensure_document_access(db: AsyncSession, current_user: User, document: Document) -> None:
    if document.user_id == current_user.user_id:
        return

    if document.workspace_id is None:
        raise HTTPException(status_code=404, detail="Document not found")

    if not await has_workspace_access(db, current_user.user_id, document.workspace_id):
        raise HTTPException(status_code=404, detail="Document not found")


@router.post("/upload", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    collection_id: UUID | None = None,
    workspace_id: UUID | None = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Upload a document (PDF, DOCX, TXT)."""
    filename = file.filename or "upload.pdf"
    if not validate_file(filename):
        raise HTTPException(status_code=400, detail="File type not supported. Allowed: PDF, DOCX, TXT")

    resolved_workspace_id = workspace_id

    if collection_id is not None:
        collection_result = await db.execute(select(Collection).where(Collection.collection_id == collection_id))
        collection = collection_result.scalar_one_or_none()
        if not collection:
            raise HTTPException(status_code=404, detail="Collection not found")
        if collection.workspace_id is not None:
            resolved_workspace_id = collection.workspace_id

    if resolved_workspace_id is not None:
        if not await has_workspace_access(db, current_user.user_id, resolved_workspace_id):
            raise HTTPException(status_code=403, detail="You do not have access to this workspace")

    try:
        storage_path, file_size = await save_upload(
            file,
            str(current_user.user_id),
            str(resolved_workspace_id) if resolved_workspace_id else None,
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    document = Document(
        user_id=current_user.user_id,
        workspace_id=resolved_workspace_id,
        collection_id=collection_id,
        filename=filename,
        file_type=get_file_type(filename),
        file_size=file_size,
        storage_path=storage_path,
        processing_status="ready",
    )
    db.add(document)
    await db.flush()
    await db.refresh(document)
    clear_user_document_caches(current_user.user_id)
    return document


@router.get("", response_model=list[DocumentResponse])
async def list_documents(
    collection_id: UUID | None = None,
    workspace_id: UUID | None = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List documents, optionally filtered by collection."""
    cache_key = (
        str(current_user.user_id),
        str(collection_id) if collection_id else None,
        str(workspace_id) if workspace_id else None,
    )
    cached = document_list_cache.get(cache_key)
    if cached and (time.time() - cached[0]) < LIST_CACHE_TTL_SECONDS:
        return cached[1]

    ws_ids = accessible_workspace_ids_subquery(current_user.user_id)
    query = (
        select(Document)
        .options(noload("*"))
        .where(
            or_(
                Document.user_id == current_user.user_id,
                Document.workspace_id.in_(select(ws_ids.c.workspace_id)),
            )
        )
    )
    if collection_id:
        query = query.where(Document.collection_id == collection_id)
    if workspace_id:
        if not await has_workspace_access(db, current_user.user_id, workspace_id):
            raise HTTPException(status_code=403, detail="You do not have access to this workspace")
        query = query.where(Document.workspace_id == workspace_id)

    result = await db.execute(query.order_by(Document.upload_date.desc()))
    docs = result.scalars().all()
    payload = [DocumentResponse.model_validate(doc).model_dump() for doc in docs]
    document_list_cache[cache_key] = (time.time(), payload)
    return payload


@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get document details."""
    result = await db.execute(
        select(Document)
        .options(noload("*"))
        .where(Document.document_id == document_id)
    )
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    await ensure_document_access(db, current_user, doc)
    return doc


@router.get("/{document_id}/view-url", response_model=DocumentViewUrlResponse)
async def get_document_view_url(
    document_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Generate a temporary URL for viewing a document."""
    cache_key = (str(current_user.user_id), str(document_id))
    cached = document_view_url_cache.get(cache_key)
    if cached and (time.time() - cached[0]) < VIEW_URL_CACHE_TTL_SECONDS:
        return cached[1]

    result = await db.execute(
        select(Document)
        .options(noload("*"))
        .where(Document.document_id == document_id)
    )
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    await ensure_document_access(db, current_user, doc)

    view_url = get_view_url(doc.storage_path)
    if view_url is None:
        view_url = get_local_file_url(doc.storage_path)

    if view_url is None:
        raise HTTPException(status_code=404, detail="Stored file could not be resolved")

    payload = DocumentViewUrlResponse(
        document_id=doc.document_id,
        filename=doc.filename,
        file_type=doc.file_type,
        view_url=view_url,
    )
    payload_dict = payload.model_dump()
    document_view_url_cache[cache_key] = (time.time(), payload_dict)
    return payload_dict


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(
    document_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a document and its file."""
    result = await db.execute(
        select(Document)
        .options(noload("*"))
        .where(Document.document_id == document_id)
    )
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    await ensure_document_access(db, current_user, doc)
    delete_file(doc.storage_path)
    await db.delete(doc)
    clear_user_document_caches(current_user.user_id)
