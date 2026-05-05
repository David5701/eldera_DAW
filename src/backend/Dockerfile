FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    tzdata \
    libpq5 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Use uv to install dependencies
COPY pyproject.toml uv.lock ./
RUN uv pip install --system .

# Copy backend source code
COPY src/backend /app

# Ensure we're in the right directory for CMD
WORKDIR /app

# Auto-migrate DB on startup (Robust Mode via script)
COPY src/backend/start.sh /start.sh
RUN chmod +x /start.sh

EXPOSE 8000

CMD ["/start.sh"]
