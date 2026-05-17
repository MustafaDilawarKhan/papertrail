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
    await ensure_notifications_table()
    await ensure_document_text_column()
    await ensure_user_admin_column()


async def ensure_user_admin_column():
    """
    Add the `is_admin` column to users and auto-promote the project owner
    (whose email is hard-coded below) so the admin dashboard works out of
    the box on a fresh setup.

    To promote any OTHER user later, run `python make_admin.py <email>`.
    """
    # The canonical platform-admin account. Created + maintained by
    # `create_admin.py`. We re-promote here only as a belt-and-braces measure
    # in case someone accidentally demoted it from the SQL console.
    BOOTSTRAP_ADMIN_EMAIL = "admin@pt.com"

    print("Adding users.is_admin column…")
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
            await conn.execute(text(
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE;"
            ))
            print("✓ users.is_admin ensured")

            # Bootstrap the project owner as admin if they exist and aren't already.
            result = await conn.execute(
                text("UPDATE users SET is_admin = TRUE WHERE email = :email AND is_admin = FALSE RETURNING email"),
                {"email": BOOTSTRAP_ADMIN_EMAIL},
            )
            promoted = result.fetchall()
            if promoted:
                print(f"✓ Promoted {BOOTSTRAP_ADMIN_EMAIL} to admin")
            else:
                print(f"  (skip) {BOOTSTRAP_ADMIN_EMAIL} either not registered yet or already admin")
    except Exception as e:
        print(f"Error adding users.is_admin: {e}")
    finally:
        await engine.dispose()


async def ensure_document_text_column():
    """Add the `extracted_text` + `extracted_html` columns to documents for the AI chat feature."""
    print("Adding documents.extracted_text + extracted_html columns…")
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
            await conn.execute(text(
                "ALTER TABLE documents ADD COLUMN IF NOT EXISTS extracted_text TEXT;"
            ))
            await conn.execute(text(
                "ALTER TABLE documents ADD COLUMN IF NOT EXISTS extracted_html TEXT;"
            ))
        print("✓ documents.extracted_text + extracted_html ensured")
    except Exception as e:
        print(f"Error adding documents extraction columns: {e}")
    finally:
        await engine.dispose()


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

async def ensure_notifications_table():
    print(f"Setting up notifications table...")
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
            # Create notifications table if it doesn't exist (includes 'data' column)
            await conn.execute(text("""
                CREATE TABLE IF NOT EXISTS notifications (
                    notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    user_id UUID NOT NULL,
                    type VARCHAR(50) NOT NULL,
                    title VARCHAR(255) NOT NULL,
                    message TEXT NOT NULL,
                    related_id UUID,
                    data TEXT,
                    read BOOLEAN DEFAULT FALSE NOT NULL,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
                );
            """))
            print("✓ Notifications table created/verified")

            # Backfill 'data' column on pre-existing tables that were created without it
            await conn.execute(text(
                "ALTER TABLE notifications ADD COLUMN IF NOT EXISTS data TEXT;"
            ))
            print("✓ notifications.data column ensured")

            # Create index on user_id for faster queries
            await conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
            """))
            print("✓ Notifications index created")
        
        print("✓ Notifications setup completed successfully")
    except Exception as e:
        if "already exists" in str(e):
            print("✓ Notifications table already exists")
        else:
            print(f"Error with notifications table: {e}")
    finally:
        await engine.dispose()

if __name__ == "__main__":
    asyncio.run(main())
