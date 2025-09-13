from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from src.api import api_router
from src.middleware.auth_middleware import add_security_headers, RateLimitMiddleware


app = FastAPI(
    title="View Rush",
    description="APIs for View Rush - A YouTube Video Publish Time Optimization Tool",
    version="0.0.1",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    contact={
        "name": "Madhushankha De Silva",
        "email": "madhusudhankhades@gmail.com"
    },
    license_info={
        "name": "MIT License",
        "url": "https://opensource.org/licenses/MIT",
    }
)

# Security middleware
app.middleware("http")(add_security_headers)

# Rate limiting middleware
# rate_limiter = RateLimitMiddleware(max_requests=1000, window_seconds=3600)
# app.middleware("http")(rate_limiter)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "http://localhost,https://localhost").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api")

@app.get("/")
async def read_root():
    """Root endpoint"""
    return {
        "message": "Welcome to View Rush API",
        "version": "1.0.0",
        "docs": "/docs",
        "status": "running"
    }

@app.get("/healthz")
def read_api_health():
    """Health check endpoint"""
    return {"status": "OK"}
