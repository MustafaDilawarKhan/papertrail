"""
Documents Router — File upload, listing, and management.
"""

from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.user import User
from app.models.document import Document
from app.schemas.document import DocumentResponse
from app.services.document_service import save_upload, get_file_type, validate_file, delete_file
from app.middleware.auth import get_current_user

router = APIRouter(prefix="/documents", tags=["Documents"])


@router.post("/upload", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    collection_id: UUID | None = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Upload a document (PDF, DOCX, TXT)."""
    filename = file.filename or "upload.pdf"
    if not validate_file(filename):
        raise HTTPException(status_code=400, detail="File type not supported. Allowed: PDF, DOCX, TXT")

    storage_path, file_size = await save_upload(file, str(current_user.user_id))
    document = Document(
        user_id=current_user.user_id, collection_id=collection_id,
        filename=filename, file_type=get_file_type(filename),
        file_size=file_size, storage_path=storage_path, processing_status="ready",
    )
    db.add(document)
    await db.flush()
    await db.refresh(document)
    return document


@router.get("", response_model=list[DocumentResponse])
async def list_documents(
    collection_id: UUID | None = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List documents, optionally filtered by collection."""
    query = select(Document).where(Document.user_id == current_user.user_id)
    if collection_id:
        query = query.where(Document.collection_id == collection_id)
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
        select(Document).where(Document.document_id == document_id, Document.user_id == current_user.user_id)
    )
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(
    document_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a document and its file."""
    result = await db.execute(
        select(Document).where(Document.document_id == document_id, Document.user_id == current_user.user_id)
    )
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    delete_file(doc.storage_path)
    await db.delete(doc)
