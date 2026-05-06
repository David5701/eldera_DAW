#!/bin/bash
set -e

echo "🚀 Starting Eldera Backend (Robust Mode)..."
export TZ="Europe/Madrid"

# 1. Check for FORCE_RESET wiping
if [ "$FORCE_RESET" = "true" ] || [ "$FORCE_RESET" = "True" ]; then
    echo "⚠️ FORCE_RESET detected! Wiping database schema..."
    python -c "from database import engine; from sqlalchemy import text; 
try:
    with engine.connect() as conn:
        conn.execute(text('DROP SCHEMA public CASCADE; CREATE SCHEMA public;'))
        conn.execute(text('CREATE EXTENSION IF NOT EXISTS unaccent;'))
        conn.commit()
    print('✨ Schema wiped and reset.')
except Exception as e:
    print(f'❌ Error during FORCE_RESET: {e}')"
fi

# 1.5. Ensure unaccent extension exists (Normal boot)
# Wrap in try/except to avoid crash on permission errors (common in managed DBs)
python -c "from database import engine; from sqlalchemy import text; 
try:
    with engine.connect() as conn:
        conn.execute(text('CREATE EXTENSION IF NOT EXISTS unaccent;'))
        conn.commit()
    print('✅ Extensión unaccent verificada/activada.')
except Exception as e:
    print(f'⚠️ No se pudo activar unaccent (probablemente falta de permisos): {e}')"

# 2. Ensure Base Tables Exist (Sync Models to DB)
# This handles fresh installs where migrations might be out of order.
echo "🏗️  Ensuring base tables exist from models..."
python -c "import models, models_extended, database; models.Base.metadata.create_all(bind=database.engine)"

# 3. Synchronize Alembic with current Schema
echo "🏁 Stamping Alembic head..."
cd src/backend
alembic stamp head

# 4. Initialize Data & Seed Users (Idempotent)
echo "🛠️  Running init_db.py to ensure admin user and base data..."
python init_db.py

# 5. Start Server
echo "✅ Initialization complete. Starting Uvicorn on port ${PORT:-8000}..."
exec uvicorn main:app --host 0.0.0.0 --port "${PORT:-8000}"
