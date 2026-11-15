"""Dataset analysis endpoint connecting CSV intake to baseline ML helpers."""
from __future__ import annotations

import io
from typing import Any

import pandas as pd
from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from ml.models.anomaly import fit_isolation_forest
from ml.models.classifier import train_random_forest
from ml.preprocessing.pipeline import prepare_classification_data
from app.storage import save_analysis

router = APIRouter(tags=["analysis"])

MAX_UPLOAD_BYTES = 25 * 1024 * 1024
MAX_ROWS = 100_000


@router.post("/analysis/classify")
async def classify_dataset(
    label_column: str = Form(..., min_length=1, max_length=128),
    group_column: str | None = Form(default=None, max_length=128),
    file: UploadFile = File(...),
) -> dict[str, Any]:
    """Train/evaluate a baseline on an uploaded labelled CSV in memory.

    This is a synchronous research MVP endpoint: it does not persist uploads,
    trained models, predictions, or experiment metadata.
    """
    filename = (file.filename or "").strip()
    if not filename.lower().endswith(".csv"):
        raise HTTPException(status_code=415, detail="Upload a .csv file.")

    raw = await file.read(MAX_UPLOAD_BYTES + 1)
    await file.close()
    if len(raw) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="CSV exceeds the 25 MB upload limit.")
    if not raw:
        raise HTTPException(status_code=400, detail="The uploaded CSV is empty.")

    try:
        frame = pd.read_csv(io.BytesIO(raw), encoding="utf-8-sig")
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="CSV must use UTF-8 encoding.")
    except (pd.errors.ParserError, ValueError):
        raise HTTPException(status_code=400, detail="CSV could not be parsed. Check its formatting.")

    if frame.empty:
        raise HTTPException(status_code=400, detail="CSV contains no data rows.")
    if len(frame) > MAX_ROWS:
        raise HTTPException(status_code=413, detail=f"CSV exceeds the {MAX_ROWS:,}-row analysis limit.")
    if not frame.columns.is_unique:
        raise HTTPException(status_code=400, detail="CSV contains duplicate column names.")
    if label_column not in frame.columns:
        raise HTTPException(
            status_code=400,
            detail=f"Label column '{label_column}' was not found. Available columns: {list(frame.columns)}",
        )

    try:
        prepared = prepare_classification_data(frame, label_column, group_column=group_column or None)
        _, metrics = train_random_forest(prepared)
        _, anomaly = fit_isolation_forest(prepared.X_train, prepared.X_test)
    except (ValueError, TypeError) as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except Exception as exc:
        # Do not expose internal exception details to the caller.
        raise HTTPException(
            status_code=500,
            detail="Analysis failed unexpectedly. Check the dataset schema and server logs.",
        ) from exc

    result = {
        "filename": filename,
        "analysis_status": "completed",
        "dataset": {
            "row_count": int(len(frame)),
            "feature_count": len(prepared.feature_columns),
            "label_column": label_column,
            "evaluation_group_column": prepared.group_column,
            "classes": [str(value) for value in prepared.label_encoder.classes_],
            "numeric_features": prepared.numeric_columns,
            "categorical_features": prepared.categorical_columns,
            "dropped_empty_features": prepared.dropped_empty_columns,
            "class_distribution": prepared.class_distribution,
        },
        "classification": metrics,
        "anomaly_detection": anomaly,
        "limitations": [
            (
                f"Group-aware holdout used '{prepared.group_column}', keeping matching group values together; this is only as reliable as the selected grouping field."
                if prepared.group_column
                else "This evaluation uses a row-level stratified random holdout. Related flows from the same capture or session may appear in both partitions, so the result is not capture-aware or chronological and may overestimate generalisation to unseen captures."
            ),
            (
                "Group-aware holdout does not guarantee every class appears in both partitions; missing held-out classes are explicitly reported."
                if prepared.group_column
                else "The minimum-class-coverage stratified random split keeps each class in both partitions when feasible; otherwise an unstratified random fallback is clearly flagged."
            ),
            "Class-level metrics with fewer than 20 test examples are low-support estimates and should not be treated as reliable performance evidence.",
            "Metrics are dataset-specific and do not establish real-world detection performance.",
            "Anomaly scores are not probabilities of malicious activity.",
            "Uploaded CSV files and trained model artifacts are not persisted; only summary metrics and alert metadata are stored locally.",
        ],
    }
    result["analysis_id"] = save_analysis(result)
    return result
