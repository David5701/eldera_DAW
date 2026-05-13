"""fix missing columns

Revision ID: fix_missing_columns
Revises:
Create Date: 2024-02-06 10:00:00.000000

"""

from alembic import op
from sqlalchemy.engine.reflection import Inspector

# revision identifiers, used by Alembic.
revision = "fix_missing_columns"
down_revision = "999999999999"  # After the saas fields
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = Inspector.from_engine(conn)
    if "residents" not in inspector.get_table_names():
        return
    columns = [col["name"] for col in inspector.get_columns("residents")]

    # List of columns to check and add if missing
    # (name, type_str, default_sql)
    missing_columns = [
        ("norton_score", "INTEGER", None),
        ("diet_texture", "VARCHAR", None),
        ("thickener_instructions", "VARCHAR", None),
        ("allergy_medication_detail", "VARCHAR", None),
        ("allergy_food_detail", "VARCHAR", None),
        ("allergy_material_detail", "VARCHAR", None),
        ("has_food_intolerance", "BOOLEAN", "FALSE"),
        ("intolerance_food_detail", "VARCHAR", None),
        ("diet_normal", "BOOLEAN", "FALSE"),
        ("diet_diabetic", "BOOLEAN", "FALSE"),
        ("diet_low_salt", "BOOLEAN", "FALSE"),
        ("diet_astringent", "BOOLEAN", "FALSE"),
        ("diet_protection", "BOOLEAN", "FALSE"),
        ("diet_soft", "BOOLEAN", "FALSE"),
        ("diet_pureed", "BOOLEAN", "FALSE"),
        ("diet_liquid", "BOOLEAN", "FALSE"),
    ]

    for col_name, col_type, default_val in missing_columns:
        if col_name not in columns:
            print(f"Adding missing column: {col_name}")
            default_clause = f"DEFAULT {default_val}" if default_val else ""
            op.execute(f"ALTER TABLE residents ADD COLUMN {col_name} {col_type} {default_clause}")


def downgrade() -> None:
    pass
