#!/bin/bash
set -e

echo "🚀 Starting Eldera Backend (Robust Mode)..."
export TZ="Europe/Madrid"

# Move to the backend directory and force it into PYTHONPATH
cd src/backend
export PYTHONPATH=$PYTHONPATH:.
echo "📂 Current directory: $(pwd)"
echo "📜 Files in current directory: $(ls -m)"

# 1. Check for FORCE_RESET wiping
if [ "$FORCE_RESET" = "true" ] || [ "$FORCE_RESET" = "True" ]; then
    echo "⚠️ FORCE_RESET detected! Wiping database schema..."
    python -c "import sys; sys.path.append('.'); from database import engine; from sqlalchemy import text; 
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
python -c "import sys; sys.path.append('.'); from database import engine; from sqlalchemy import text; 
try:
    with engine.connect() as conn:
        conn.execute(text('CREATE EXTENSION IF NOT EXISTS unaccent;'))
        conn.commit()
    print('✅ Extensión unaccent verificada/activada.')
except Exception as e:
    print(f'⚠️ No se pudo activar unaccent (probablemente falta de permisos): {e}')"

# 2. Ensure Base Tables Exist (Sync Models to DB)
echo "🏗️  Ensuring base tables exist from models..."
python -c "import sys; sys.path.append('.'); import models, models_extended, database; models.Base.metadata.create_all(bind=database.engine)"

# 3. Synchronize Alembic with current Schema
echo "🏁 Stamping Alembic head..."
alembic stamp head

# 4. Initialize Data & Seed Users (Idempotent)
echo "🛠️  Running init_db.py to ensure admin user and base data..."
python init_db.py

# 5. Start Server
echo "✅ Initialization complete. Starting Uvicorn on port ${PORT:-8000}..."
exec uvicorn main:app --host 0.0.0.0 --port "${PORT:-8000}"
