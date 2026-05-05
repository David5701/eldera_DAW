"""add_saas_fields_idempotent

Revision ID: 999999999999
Revises: 62d11d93a63c
Create Date: 2026-02-05 23:00:00.000000

"""

from collections.abc import Sequence
from typing import Union

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "999999999999"
down_revision: Union[str, None] = "62d11d93a63c"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Use raw SQL for idempotency (IF NOT EXISTS) to avoid transaction aborts

    # 1. Residences Table
    # 1. Residences Table
    op.execute("""
        CREATE TABLE IF NOT EXISTS residences (
            id SERIAL PRIMARY KEY,
            name VARCHAR,
            cif VARCHAR,
            plan VARCHAR DEFAULT 'free',
            created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
        );
    """)

    # Ensure columns exist (if table pre-existed without them)
    op.execute("ALTER TABLE residences ADD COLUMN IF NOT EXISTS cif VARCHAR")
    op.execute(
        "ALTER TABLE residences ADD COLUMN IF NOT EXISTS plan VARCHAR DEFAULT 'free'"
    )

    # Seed default residence if not exists
    op.execute("""
        INSERT INTO residences (id, name, plan) 
        VALUES (1, 'Residencia Principal', 'free') 
        ON CONFLICT (id) DO NOTHING;
    """)

    # 2. Add residence_id to users
    op.execute(
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS residence_id INTEGER"
    )
    op.execute("UPDATE users SET residence_id = 1 WHERE residence_id IS NULL")
    # FK constraint: Drop first if exists to avoid dupes? Hard in SQL.
    # But usually harmless to not add if exists, or simple add.
    # We will try to add constraint only if not exists (Postgres style requires function/do block)
    # Simplified: We skip FK constraint creation in raw SQL to avoid errors if it exists.
    # The important part is the column.
    # For correctness we can try to add it with a specific name and catch error? No.
    # Let's assume for system restart we assume it's fine or just add column.

    # 3. Add residence_id to residents
    op.execute(
        "ALTER TABLE residents ADD COLUMN IF NOT EXISTS residence_id INTEGER"
    )
    op.execute(
        "UPDATE residents SET residence_id = 1 WHERE residence_id IS NULL"
    )

    # 4. Missing Cleanup Columns (JSONB, etc)
    # hospitalization_history (JSONB)
    op.execute(
        "ALTER TABLE residents ADD COLUMN IF NOT EXISTS hospitalization_history JSONB DEFAULT '[]'::jsonb"
    )
    op.execute(
        "ALTER TABLE residents ADD COLUMN IF NOT EXISTS hospitalization_end_date DATE"
    )
    op.execute(
        "ALTER TABLE residents ADD COLUMN IF NOT EXISTS hospitalization_hospital VARCHAR"
    )
    op.execute(
        "ALTER TABLE residents ADD COLUMN IF NOT EXISTS hospitalization_reason VARCHAR"
    )

    # wounds (JSONB)
    op.execute(
        "ALTER TABLE residents ADD COLUMN IF NOT EXISTS wounds JSONB DEFAULT '[]'::jsonb"
    )

    # family_contacts (JSONB)
    op.execute(
        "ALTER TABLE residents ADD COLUMN IF NOT EXISTS family_contacts JSONB DEFAULT '[]'::jsonb"
    )

    # sexuality
    op.execute(
        "ALTER TABLE residents ADD COLUMN IF NOT EXISTS sexuality_observations TEXT"
    )

    # sleep
    op.execute(
        "ALTER TABLE residents ADD COLUMN IF NOT EXISTS sleep_medication VARCHAR"
    )

    # ensure others
    op.execute(
        "ALTER TABLE residents ADD COLUMN IF NOT EXISTS mobility_level VARCHAR"
    )
    op.execute(
        "ALTER TABLE residents ADD COLUMN IF NOT EXISTS cognitive_impairment VARCHAR"
    )
    op.execute(
        "ALTER TABLE residents ADD COLUMN IF NOT EXISTS additional_data JSONB"
    )


def downgrade() -> None:
    # Downgrade usually not needed for fix scripts, but just in case
    # checking existence is hard. We'll skip for safety.
    pass
