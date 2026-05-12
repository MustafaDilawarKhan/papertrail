import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from dotenv import load_dotenv
import os

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

async def main():
    await ensure_user_profile_columns()
    await ensure_workspace_columns()


async def ensure_user_profile_columns():
    print(f"Connecting to {DATABASE_URL}...")
    engine = create_async_engine(
        DATABASE_URL,
        connect_args={
            "prepared_statement_cache_size": 0,
            "statement_cache_size": 0,
        },
        echo=False,
    )

    try:
        async with engine.begin() as conn:
            await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS affiliation VARCHAR(255);"))
            await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;"))
            await conn.execute(text("ALTER TABLE documents ADD COLUMN IF NOT EXISTS workspace_id UUID;"))
            await conn.commit()
        print("✓ User columns processed")
    except Exception as e:
        print(f"Error with user columns: {e}")
    finally:
        await engine.dispose()

async def ensure_workspace_columns():
    print(f"Adding workspace columns...")
    engine = create_async_engine(
        DATABASE_URL,
        connect_args={
            "prepared_statement_cache_size": 0,
            "statement_cache_size": 0,
        },
        echo=False,
    )

    try:
        # Add description column
        async with engine.begin() as conn:
            try:
                await conn.execute(text("ALTER TABLE workspaces ADD COLUMN description VARCHAR(500);"))
                print("✓ Added description column")
            except Exception as e:
                if "already exists" in str(e):
                    print("✓ Description column already exists")
        
        # Add privacy column in a separate transaction
        async with engine.begin() as conn:
            try:
                await conn.execute(text("ALTER TABLE workspaces ADD COLUMN privacy VARCHAR(20) DEFAULT 'private';"))
                print("✓ Added privacy column")
            except Exception as e:
                if "already exists" in str(e):
                    print("✓ Privacy column already exists")
                else:
                    raise
        
        print("✓ Workspace columns migration completed successfully")
    except Exception as e:
        print(f"Error with workspace columns: {e}")
    finally:
        await engine.dispose()

if __name__ == "__main__":
    asyncio.run(main())
