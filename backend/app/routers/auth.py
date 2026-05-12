"""
Auth Router — Registration, login, and current user.
"""

import logging
import time
import traceback
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from sqlalchemy.orm import noload
from app.database import get_db
from app.models.user import User
from app.models.document import Document
from app.models.collection import Collection
from app.models.workspace import Workspace, WorkspaceMember
from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse, ChangePasswordRequest
from app.schemas.user import UserResponse
from app.schemas.document import DocumentResponse
from app.schemas.collection import CollectionResponse
from app.schemas.workspace import WorkspaceResponse
from app.services.auth_service import hash_password, verify_password, create_access_token
from app.middleware.auth import get_current_user
from app.services.session_cache import get_cache, set_cache

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["Authentication"])
BOOTSTRAP_CACHE_TTL_SECONDS = 45


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(request: RegisterRequest, db: AsyncSession = Depends(get_db)):
    """Register a new user account."""
    try:
        logger.info(f"Registration attempt for email: {request.email}")

        # Check if email already exists
        result = await db.execute(select(User).where(User.email == request.email))
        existing_user = result.scalar_one_or_none()

        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account with this email already exists",
            )

        # Create new user
        user = User(
            name=request.name,
            email=request.email,
            password_hash=hash_password(request.password),
        )
        db.add(user)
        await db.flush()  # Get the generated user_id

        logger.info(f"User created successfully: {user.user_id}")

        # Generate JWT token
        access_token = create_access_token(data={"sub": str(user.user_id)})

        return TokenResponse(
            access_token=access_token,
            user_id=str(user.user_id),
            name=user.name,
            email=user.email,
        )
    except HTTPException:
        raise  # Re-raise HTTP exceptions (like 409)
    except Exception as exc:
        logger.error(f"Registration failed: {exc}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(exc)}",
        )


@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Login with email and password."""
    try:
        logger.info(f"Login attempt for email: {request.email}")
        result = await db.execute(select(User).where(User.email == request.email))
        user = result.scalar_one_or_none()

        if not user or not verify_password(request.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
            )

        access_token = create_access_token(data={"sub": str(user.user_id)})
        logger.info(f"Login successful for user: {user.user_id}")

        return TokenResponse(
            access_token=access_token,
            user_id=str(user.user_id),
            name=user.name,
            email=user.email,
        )
    except HTTPException:
        raise  # Re-raise HTTP exceptions (401, etc.)
    except Exception as exc:
        logger.error(f"Login failed unexpectedly: {exc}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Login failed: {str(exc)}",
        )


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """Get the currently authenticated user's profile."""
    return current_user


@router.get("/bootstrap")
async def bootstrap(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Warm and return the core dashboard payload after login."""
    cache_key = f"bootstrap:{current_user.user_id}"
    cached = get_cache(cache_key, BOOTSTRAP_CACHE_TTL_SECONDS)
    if cached is not None:
        return cached

    ws_ids = (
        select(Workspace.workspace_id)
        .where(Workspace.owner_id == current_user.user_id)
        .union(select(WorkspaceMember.workspace_id).where(WorkspaceMember.user_id == current_user.user_id))
        .subquery()
    )

    docs_result = await db.execute(
        select(Document)
        .options(noload("*"))
        .where(
            or_(
                Document.user_id == current_user.user_id,
                Document.workspace_id.in_(select(ws_ids.c.workspace_id)),
            )
        )
        .order_by(Document.upload_date.desc())
    )
    collections_result = await db.execute(
        select(Collection)
        .options(noload("*"))
        .where(
            Collection.user_id == current_user.user_id,
            Collection.parent_collection_id.is_(None),
        )
        .order_by(Collection.name)
    )
    workspaces_result = await db.execute(
        select(Workspace)
        .options(noload("*"))
        .where(
            or_(
                Workspace.owner_id == current_user.user_id,
                Workspace.workspace_id.in_(select(ws_ids.c.workspace_id)),
            )
        )
        .order_by(Workspace.updated_at.desc())
    )

    payload = {
        "documents": [DocumentResponse.model_validate(doc).model_dump() for doc in docs_result.scalars().all()],
        "collections": [CollectionResponse.model_validate(collection).model_dump() for collection in collections_result.scalars().all()],
        "workspaces": [WorkspaceResponse.model_validate(workspace).model_dump() for workspace in workspaces_result.scalars().all()],
        "fetched_at": int(time.time()),
    }
    set_cache(cache_key, payload)
    return payload


@router.api_route("/password", methods=["POST", "PATCH"], status_code=status.HTTP_200_OK)
async def change_password(
    request: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Change the current user's password."""
    if not verify_password(request.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect current password",
        )

    current_user.password_hash = hash_password(request.new_password)
    db.add(current_user)
    await db.commit()

    return {"detail": "Password changed successfully"}
