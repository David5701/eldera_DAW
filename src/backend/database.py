import os
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Cargar variables de entorno desde .env
env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=env_path)

# URL de la base de datos (por defecto para Docker si no existe en el entorno)
SQLALCHEMY_DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:password@localhost:5433/eldera_daw",
)

# SQLAlchemy requiere 'postgresql://' en lugar de 'postgres://' (común en Render/Heroku)
if SQLALCHEMY_DATABASE_URL and SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Configuración del motor de la base de datos
# Para bases de datos en la nube (Supabase/Render), habilitamos SSL y reciclaje de conexiones
connect_args = {}
db_url_lower = SQLALCHEMY_DATABASE_URL.lower()

# Forzar SSL si no es localhost
if "localhost" not in db_url_lower and "127.0.0.1" not in db_url_lower:
    connect_args["sslmode"] = "require"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True,  # Verifica la conexión antes de usarla
    pool_recycle=300     # Refresca las conexiones cada 5 minutos
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
