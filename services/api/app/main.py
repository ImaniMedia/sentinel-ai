"""Minimal Sentinel AI API entry point.

Only the health route is implemented at this foundation stage.
"""
from fastapi import FastAPI

app = FastAPI(
    title="Sentinel AI API",
    description="Defensive network-traffic analysis research API.",
    version="0.1.0",
)


@app.get("/health", tags=["health"])
def health() -> dict[str, str]:
    """Return process-level health; this does not verify external dependencies."""
    return {"status": "ok", "service": "sentinel-ai-api"}
