from fastapi import FastAPI
from routers import user_profiling, test_youtube, heatmap,heatmap_cross_attention
from routers import profile_embedding
from fastapi.middleware.cors import CORSMiddleware
from middleware.security import SecurityHeadersMiddleware
import os

app = FastAPI(
    title="YouTube Optimal Time Backend",
    docs_url="/docs" if os.getenv("ENVIRONMENT") != "production" else None,
    redoc_url="/redoc" if os.getenv("ENVIRONMENT") != "production" else None,
)

# Get allowed origins from environment variable, default to localhost for development
ALLOWED_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:5173").split(",")

# Add security headers middleware
app.add_middleware(SecurityHeadersMiddleware)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
    max_age=3600,
)

# Register routers
app.include_router(test_youtube.router)
app.include_router(user_profiling.router)
app.include_router(profile_embedding.router)
app.include_router(heatmap.router)
app.include_router(heatmap_cross_attention.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to the YouTube Optimal Time Backend!"}  

@app.get("/healthz")
def health_check():
    return {"status": "healthy"}
