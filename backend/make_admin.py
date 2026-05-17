"""
Promote a user to admin by email.

Usage:
    docker compose -f docker-compose.dev.yml exec backend python make_admin.py <email>

The user must already exist (registered + verified). Use `--demote` to revoke.
"""

import argparse
import asyncio
import os
import sys

from dotenv import load_dotenv
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")


async def set_admin(email: str, value: bool) -> None:
    if not DATABASE_URL:
        sys.exit("DATABASE_URL not set in environment")

    engine = create_async_engine(
        DATABASE_URL,
        connect_args={"prepared_statement_cache_size": 0, "statement_cache_size": 0},
        echo=False,
    )
    try:
        async with engine.begin() as conn:
            r = await conn.execute(
                text("UPDATE users SET is_admin = :v WHERE email = :email RETURNING email, is_admin"),
                {"v": value, "email": email},
            )
            row = r.fetchone()
            if not row:
                sys.exit(f"No user found with email {email!r}")
            print(f"✓ {row[0]} is_admin = {row[1]}")
    finally:
        await engine.dispose()


def main() -> None:
    parser = argparse.ArgumentParser(description="Promote / demote a user.")
    parser.add_argument("email", help="The email of the user to update")
    parser.add_argument("--demote", action="store_true", help="Revoke admin instead of granting it")
    args = parser.parse_args()
    asyncio.run(set_admin(args.email, not args.demote))


if __name__ == "__main__":
    main()
