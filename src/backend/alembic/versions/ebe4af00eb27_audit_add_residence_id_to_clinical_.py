"""audit add residence_id to clinical tables

Revision ID: ebe4af00eb27
Revises: fix_missing_columns
Create Date: 2026-02-06 16:25:42.438511

"""

from collections.abc import Sequence
from typing import Union

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "ebe4af00eb27"
down_revision: Union[str, None] = "fix_missing_columns"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Use raw SQL for idempotency (IF NOT EXISTS)
    tables = [
        "resident_vaccinations",
        "resident_followups",
        "resident_vitals",
        "resident_care_logs",
    ]

    for table in tables:
        op.execute(f"ALTER TABLE {table} ADD COLUMN IF NOT EXISTS residence_id INTEGER")
        # Ensure it has a foreign key if we want to be strict,
        # but for idempotency in this project we've been using raw SQL alters.
        # We also need to sync the residence_id from the resident it belongs to.
        op.execute(f"""
            UPDATE {table} t
            SET residence_id = r.residence_id
            FROM residents r
            WHERE t.resident_id = r.id AND t.residence_id IS NULL
        """)


def downgrade() -> None:
    pass
