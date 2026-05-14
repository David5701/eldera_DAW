import os
from contextlib import asynccontextmanager
from datetime import datetime
from pathlib import Path

# Inicialización de tablas de la base de datos
import database
import models_extended  # noqa: F401
from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from routers import auth, dashboard, residents
from sqlalchemy import text
from sqlalchemy.orm import Session


@asynccontextmanager
async def lifespan(app: FastAPI):
    # La inicialización se maneja ahora exclusivamente en start.sh
    # para evitar race conditions y problemas de permisos en producción.
    yield


app = FastAPI(
    title="Eldera API",
    description="Backend para el Sistema de Gestión de Residencias Eldera",
    lifespan=lifespan,
)

# Configuración de CORS robusta para desarrollo y producción
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)


# Política de Seguridad Zero Footprint: Prevenir el cacheo de datos PHI
@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    return response


# Resolución de la raíz del proyecto para la gestión de archivos
project_root = Path(__file__).resolve().parent.parent.parent
uploads_dir = project_root / "uploads"

# Crear directorio de subidas si no existe
os.makedirs(uploads_dir, exist_ok=True)

# Montar archivos estáticos para el acceso a fotos de perfil
app.mount("/static", StaticFiles(directory=str(uploads_dir)), name="static")

# Inclusión de rutas de la API
app.include_router(auth.router)
app.include_router(residents.router)
app.include_router(dashboard.router)


@app.get("/healthz", tags=["Mantenimiento"])
def health_check(db: Session = Depends(database.get_db)):
    """Verifica la salud de la aplicación y la conexión a la base de datos."""
    try:
        db.execute(text("SELECT 1"))
        return {
            "status": "ok",
            "database": "connected",
            "timestamp": datetime.utcnow(),
        }
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Database connection failed: {str(e)}") from e


@app.get("/", tags=["General"])
def read_root():
    """Endpoint de bienvenida que confirma el estado de la API."""
    return {
        "name": "Eldera API",
        "version": "1.0.0",
        "status": "online",
        "message": "Sistema de Gestión Integral para Residencias de Mayores",
    }
