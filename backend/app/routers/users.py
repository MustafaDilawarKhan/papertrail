"""
Users Router — Profile management and preferences.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text, update, select
from app.database import get_db
from app.models.user import User
from app.schemas.user import UserResponse, UserUpdateRequest
from app.middleware.auth import get_current_user

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("", response_model=list[UserResponse])
async def list_users(q: str | None = None, limit: int = 20, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """List users (searchable). Returns users matching email or name. Authenticated only."""
    query = select(User)
    if q:
        like = f"%{q}%"
        query = query.where((User.email.ilike(like)) | (User.name.ilike(like)))
    query = query.limit(limit)
    result = await db.execute(query)
    items = result.scalars().all()
    return [UserResponse.model_validate(u).model_dump() for u in items]


async def ensure_profile_columns(db: AsyncSession) -> None:
    await db.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS affiliation VARCHAR(255);"))
    await db.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;"))


@router.get("/profile", response_model=UserResponse)
async def get_profile(current_user: User = Depends(get_current_user)):
    """Get the current user's profile and preferences."""
    return current_user


@router.patch("/profile", response_model=UserResponse)
async def update_profile(
    request: UserUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update the current user's profile and preferences."""
    update_data = request.model_dump(exclude_unset=True)
    print(f"UPDATE_PROFILE DATA: {update_data}")

    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update",
        )

    await ensure_profile_columns(db)

    await db.execute(
        update(User)
        .where(User.user_id == current_user.user_id)
        .values(**update_data)
    )
    await db.commit()

    result = await db.execute(select(User).where(User.user_id == current_user.user_id))
    current_user = result.scalar_one()

    return current_user
