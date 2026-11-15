"""Read and triage endpoints for persisted analysis summaries."""
from typing import Literal

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from app.storage import dashboard_overview, list_alerts, list_analyses, update_alert_status

router = APIRouter(tags=["history"])


class AlertStatusUpdate(BaseModel):
    status: Literal["open", "reviewed", "dismissed"] = Field(...)


@router.get("/dashboard/overview")
def get_dashboard_overview() -> dict:
    return dashboard_overview()


@router.get("/predictions")
def get_prediction_history(limit: int = Query(default=50, ge=1, le=200)) -> dict:
    items = list_analyses(limit)
    return {"items": items, "count": len(items)}


@router.get("/alerts")
def get_alert_history(
    status: Literal["open", "reviewed", "dismissed"] | None = None,
    limit: int = Query(default=100, ge=1, le=500),
) -> dict:
    items = list_alerts(limit, status)
    return {"items": items, "count": len(items)}


@router.patch("/alerts/{alert_id}")
def patch_alert(alert_id: int, payload: AlertStatusUpdate) -> dict:
    updated = update_alert_status(alert_id, payload.status)
    if updated is None:
        raise HTTPException(status_code=404, detail="Alert not found.")
    return updated
