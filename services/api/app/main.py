"""Sentinel AI API entry point."""
from fastapi import FastAPI

from app.api.v1.analysis import router as analysis_router
from app.api.v1.datasets import router as datasets_router

app = FastAPI(
    title="Sentinel AI API",
    description="Defensive network-traffic analysis research API.",
    version="0.3.0",
)

app.include_router(datasets_router, prefix="/api/v1")
app.include_router(analysis_router, prefix="/api/v1")


@app.get("/health", tags=["health"])
def health() -> dict[str, str]:
    """Return process-level health; this does not verify external dependencies."""
    return {"status": "ok", "service": "sentinel-ai-api"}
