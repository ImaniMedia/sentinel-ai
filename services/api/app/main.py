"""Sentinel AI API entry point."""
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.analysis import router as analysis_router
from app.api.v1.datasets import router as datasets_router
from app.api.v1.history import router as history_router
from app.storage import initialize_storage

app = FastAPI(
    title="Sentinel AI API",
    description="Defensive network-traffic analysis research API.",
    version="0.3.0",
)

# Configure comma-separated trusted frontend origins in production.
# Local defaults support the Next.js development server only.
allowed_origins = [
    origin.strip()
    for origin in os.getenv(
        "SENTINEL_CORS_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000",
    ).split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "PATCH", "OPTIONS"],
    allow_headers=["Content-Type"],
)

app.include_router(datasets_router, prefix="/api/v1")
app.include_router(analysis_router, prefix="/api/v1")
app.include_router(history_router, prefix="/api/v1")


@app.on_event("startup")
def startup_storage() -> None:
    """Create local summary tables before serving requests."""
    initialize_storage()


@app.get("/health", tags=["health"])
def health() -> dict[str, str]:
    """Return process-level health; this does not verify external dependencies."""
    return {"status": "ok", "service": "sentinel-ai-api"}
