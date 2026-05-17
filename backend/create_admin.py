"""
Bootstrap a fixed admin account.

Usage:
    docker compose -f docker-compose.dev.yml exec backend python create_admin.py

By default creates / updates `admin@pt.com` with password `admin123` and
marks it as an admin. The credentials are intentionally simple so it can
be handed to a fresh marker / demo viewer; the admin should change the
password from the admin dashboard immediately after first login.

If the email already exists, this script promotes it to admin and resets
the password — safe to run repeatedly.
"""

from __future__ import annotations

import asyncio
import os
import sys
import uuid
from datetime import datetime, timezone

from dotenv import load_dotenv
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
EMAIL = "admin@pt.com"
PASSWORD = "admin123"
NAME = "Platform Admin"


async def main() -> None:
    if not DATABASE_URL:
        sys.exit("DATABASE_URL not set in environment")

    # We need the same hashing function the auth router uses so the login
    # endpoint will accept this account.
    sys.path.insert(0, os.path.dirname(__file__))
    from app.services.auth_service import hash_password  # noqa: WPS433

    pwd_hash = hash_password(PASSWORD)

    engine = create_async_engine(
        DATABASE_URL,
        connect_args={"prepared_statement_cache_size": 0, "statement_cache_size": 0},
        echo=False,
    )
    try:
        async with engine.begin() as conn:
            existing = await conn.execute(
                text("SELECT user_id FROM users WHERE email = :email"),
                {"email": EMAIL},
            )
            row = existing.fetchone()
            now = datetime.now(timezone.utc)

            if row is None:
                user_id = uuid.uuid4()
                await conn.execute(
                    text(
                        """
                        INSERT INTO users
                          (user_id, name, email, password_hash,
                           ui_theme, default_citation_style, response_length,
                           email_verified, is_admin, created_at, updated_at)
                        VALUES
                          (:user_id, :name, :email, :pwd,
                           'light', 'APA', 'Medium',
                           TRUE, TRUE, :now, :now)
                        """
                    ),
                    {
                        "user_id": str(user_id),
                        "name": NAME,
                        "email": EMAIL,
                        "pwd": pwd_hash,
                        "now": now,
                    },
                )
                print(f"✓ Created admin account: {EMAIL} (password: {PASSWORD})")
            else:
                await conn.execute(
                    text(
                        """
                        UPDATE users
                        SET password_hash = :pwd,
                            email_verified = TRUE,
                            is_admin = TRUE,
                            updated_at = :now
                        WHERE email = :email
                        """
                    ),
                    {"pwd": pwd_hash, "email": EMAIL, "now": now},
                )
                print(f"✓ Reset password + promoted existing user: {EMAIL} (password: {PASSWORD})")
    finally:
        await engine.dispose()

    print("")
    print("Sign in at /login with:")
    print(f"  Email:    {EMAIL}")
    print(f"  Password: {PASSWORD}")
    print("Change the password right away via Admin → My Account on the dashboard.")


if __name__ == "__main__":
    asyncio.run(main())
