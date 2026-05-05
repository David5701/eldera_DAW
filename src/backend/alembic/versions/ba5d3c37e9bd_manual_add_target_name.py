"""manual_add_target_name

Revision ID: ba5d3c37e9bd
Revises: a8a865e8fe46
Create Date: 2026-02-25 07:10:54.172666

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ba5d3c37e9bd'
down_revision: Union[str, None] = 'a8a865e8fe46'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
