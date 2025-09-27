# Stage 1: Build the React client
FROM node:20-alpine AS client-builder

WORKDIR /app/client

# Copy client package files
COPY client/package*.json ./

# Install client dependencies
RUN npm install

# Copy client source code
COPY client/ ./

# Build the client
RUN npm run build

# Stage 2: Setup Python server with uv
FROM python:3.12.6-slim-bullseye

# Install uv
RUN pip install --no-cache-dir uv

WORKDIR /app

# Copy server files
COPY server/pyproject.toml server/uv.lock ./

# Install server dependencies
RUN uv sync --frozen --no-cache

# Copy server source code
COPY server/src ./src

# Copy built client files
COPY --from=client-builder /app/client/dist ./static

# Expose ports
EXPOSE 8000

# Start the server
CMD ["uv", "run", "uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
