FROM python:3.11-slim

# Evitar la creación de archivos .pyc y habilitar log sin buffer
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
# PYTHONPATH asegura que las importaciones funcionen desde la raíz
# Añadimos la raíz y el directorio backend para máxima compatibilidad
ENV PYTHONPATH=/app:/app/src/backend

WORKDIR /app

# Instalar dependencias del sistema necesarias
RUN apt-get update && apt-get install -y \
    curl \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Instalar uv para una gestión de dependencias ultra-rápida
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Instalar dependencias usando pyproject.toml
# Copiamos solo los archivos de configuración primero para aprovechar la caché de capas
COPY pyproject.toml uv.lock ./
RUN uv pip install --system --no-cache .

# Copiar el resto del código fuente
COPY . .

# Asegurar permisos de ejecución para el script de inicio
RUN chmod +x src/backend/start.sh

EXPOSE 8000

# El comando se ejecuta desde la raíz (WORKDIR /app)
# Esto permite que 'docker exec ... python src/backend/init_db.py' funcione correctamente
CMD ["./src/backend/start.sh"]
