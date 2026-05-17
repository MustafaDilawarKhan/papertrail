"""
Auth Middleware — JWT dependency for protecting API routes.
Extracts the Bearer token from the Authorization header,
validates it, and returns the current user.
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import noload
from app.database import get_db
from app.services.auth_service import decode_access_token
from app.models.user import User

# HTTPBearer scheme — expects "Authorization: Bearer <token>"
security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> User:
    """
    FastAPI dependency — extracts JWT from Authorization header,
    validates it, and returns the authenticated User object.

    Usage in routers:
        @router.get("/protected")
        async def protected_route(user: User = Depends(get_current_user)):
            ...
    """
    token = credentials.credentials
    payload = decode_access_token(token)

    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id: str = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing user identifier",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Fetch user from database
    # Avoid loading relationship graphs during auth checks.
    result = await db.execute(
        select(User)
        .options(noload("*"))
        .where(User.user_id == user_id)
    )
    user = result.scalar_one_or_none()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user


async def get_current_admin(user: User = Depends(get_current_user)) -> User:
    """
    Dependency that authorises an admin-only endpoint. Wraps `get_current_user`
    and adds a 403 if the user lacks `is_admin`. Mount on every /api/admin/*
    endpoint.
    """
    if not getattr(user, "is_admin", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required",
        )
    return user
