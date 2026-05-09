"""
Documents Router — File upload, listing, and management.
"""

from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from app.database import get_db
from app.models.user import User
from app.models.document import Document
from app.models.workspace import Workspace, WorkspaceMember
from app.models.collection import Collection
from app.schemas.document import DocumentResponse
from app.services.document_service import save_upload, get_file_type, validate_file, delete_file
from app.middleware.auth import get_current_user

router = APIRouter(prefix="/documents", tags=["Documents"])


async def get_accessible_workspace_ids(db: AsyncSession, user_id: UUID) -> set[UUID]:
    owned_result = await db.execute(select(Workspace.workspace_id).where(Workspace.owner_id == user_id))
    membership_result = await db.execute(select(WorkspaceMember.workspace_id).where(WorkspaceMember.user_id == user_id))
    return {row[0] for row in owned_result.all()} | {row[0] for row in membership_result.all()}


async def ensure_document_access(db: AsyncSession, current_user: User, document: Document) -> None:
    if document.user_id == current_user.user_id:
        return

    if document.workspace_id is None:
        raise HTTPException(status_code=404, detail="Document not found")

    accessible_workspace_ids = await get_accessible_workspace_ids(db, current_user.user_id)
    if document.workspace_id not in accessible_workspace_ids:
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
        accessible_workspace_ids = await get_accessible_workspace_ids(db, current_user.user_id)
        if resolved_workspace_id not in accessible_workspace_ids:
            raise HTTPException(status_code=403, detail="You do not have access to this workspace")

    storage_path, file_size = await save_upload(file, str(current_user.user_id), str(resolved_workspace_id) if resolved_workspace_id else None)
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
    return document


@router.get("", response_model=list[DocumentResponse])
async def list_documents(
    collection_id: UUID | None = None,
    workspace_id: UUID | None = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List documents, optionally filtered by collection."""
    query = select(Document)
    accessible_workspace_ids = await get_accessible_workspace_ids(db, current_user.user_id)
    if accessible_workspace_ids:
        query = query.where(
            or_(
                Document.user_id == current_user.user_id,
                Document.workspace_id.in_(accessible_workspace_ids),
            )
        )
    else:
        query = query.where(Document.user_id == current_user.user_id)
    if collection_id:
        query = query.where(Document.collection_id == collection_id)
    if workspace_id:
        if workspace_id not in accessible_workspace_ids:
            raise HTTPException(status_code=403, detail="You do not have access to this workspace")
        query = query.where(Document.workspace_id == workspace_id)
    result = await db.execute(query.order_by(Document.upload_date.desc()))
    return result.scalars().all()


@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get document details."""
    result = await db.execute(
        select(Document).where(Document.document_id == document_id)
    )
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    await ensure_document_access(db, current_user, doc)
    return doc


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(
    document_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a document and its file."""
    result = await db.execute(
        select(Document).where(Document.document_id == document_id)
    )
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    await ensure_document_access(db, current_user, doc)
    delete_file(doc.storage_path)
    await db.delete(doc)
