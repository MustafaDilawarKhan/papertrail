import asyncio
import sys
import traceback
sys.path.insert(0, '.')

from app.database import AsyncSessionLocal
from sqlalchemy import select
from app.models.user import User
from app.models.workspace import Workspace, WorkspaceMember
from app.models.notification import Notification
from app.schemas.notification import NotificationResponse
import json, uuid

WORKSPACE_ID = uuid.UUID("3257f612-74ba-4f06-aca5-4993fdb77359")
INVITE_EMAIL = "testingkhan645@gmail.com"

# Simulate current_user — try both owner and non-owner
async def simulate_add_member(current_user_id: uuid.UUID):
    async with AsyncSessionLocal() as db:
        print(f"\n=== Simulating add_member as user {current_user_id} ===")
        
        # Step 1: verify ownership (same as the endpoint)
        result = await db.execute(
            select(Workspace).where(
                Workspace.workspace_id == WORKSPACE_ID,
                Workspace.owner_id == current_user_id,
            )
        )
        workspace = result.scalar_one_or_none()
        if not workspace:
            print(f"  OWNERSHIP CHECK FAILED - user {current_user_id} is not the owner")
            return
        print(f"  Workspace ownership verified: {workspace.name}")

        # Step 2: find invited user
        user_result = await db.execute(select(User).where(User.email == INVITE_EMAIL))
        invited_user = user_result.scalar_one_or_none()
        if not invited_user:
            print("  Invited user not found")
            return
        print(f"  Invited user: {invited_user.name} ({invited_user.user_id})")

        # Step 3: check existing membership
        existing = await db.execute(
            select(WorkspaceMember).where(
                WorkspaceMember.workspace_id == WORKSPACE_ID,
                WorkspaceMember.user_id == invited_user.user_id,
            )
        )
        if existing.scalar_one_or_none():
            print("  USER IS ALREADY A MEMBER - this would return 409")
            return

        # Step 4: create notification
        print("  Creating notification...")
        try:
            notification = Notification(
                user_id=invited_user.user_id,
                type="workspace_invite",
                title=f"Invited to {workspace.name}",
                message=f"{current_user_id} invited you to '{workspace.name}'.",
                related_id=WORKSPACE_ID,
                data=json.dumps({"role": "Viewer", "inviter_id": str(current_user_id), "inviter_name": "Test"}),
            )
            db.add(notification)
            await db.flush()
            await db.refresh(notification)
            print(f"  Notification created: {notification.notification_id}")
            
            # Step 5: serialize to response
            resp = NotificationResponse.model_validate(notification)
            print(f"  NotificationResponse OK: type={resp.type}, data={resp.data}")
        except Exception as e:
            print(f"  ERROR: {e}")
            traceback.print_exc()


async def main():
    async with AsyncSessionLocal() as db:
        # Find the workspace owner
        result = await db.execute(select(Workspace).where(Workspace.workspace_id == WORKSPACE_ID))
        ws = result.scalar_one_or_none()
        if not ws:
            print("Workspace not found!")
            return
        owner_id = ws.owner_id
        print(f"Workspace owner_id: {owner_id}")

        # Also list all users to see who we're working with
        users_result = await db.execute(select(User))
        users = users_result.scalars().all()
        print(f"All users in DB:")
        for u in users:
            print(f"  {u.user_id} | {u.email} | {u.name}")

        # List workspace members
        members_result = await db.execute(
            select(WorkspaceMember).where(WorkspaceMember.workspace_id == WORKSPACE_ID)
        )
        members = members_result.scalars().all()
        print(f"\nWorkspace members:")
        for m in members:
            print(f"  user_id={m.user_id}, role={m.role}")

    await simulate_add_member(owner_id)

asyncio.run(main())
