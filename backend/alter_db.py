import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from dotenv import load_dotenv
import os

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

async def main():
    await ensure_user_profile_columns()


async def ensure_user_profile_columns():
    print(f"Connecting to {DATABASE_URL}...")
    engine = create_async_engine(
        DATABASE_URL,
        connect_args={
            "prepared_statement_cache_size": 0,
            "statement_cache_size": 0,
        },
    )

    async with engine.begin() as conn:
        await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS affiliation VARCHAR(255);"))
        await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;"))
        await conn.execute(text("ALTER TABLE documents ADD COLUMN IF NOT EXISTS workspace_id UUID;"))

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(main())
