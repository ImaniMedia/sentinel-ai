"""Safe, in-memory CSV inspection endpoint for research datasets."""
import csv
import io
from typing import Any

from fastapi import APIRouter, File, HTTPException, UploadFile, status

router = APIRouter(tags=["datasets"])

MAX_UPLOAD_BYTES = 25 * 1024 * 1024
MAX_ROWS = 100_000
PREVIEW_ROWS = 5


@router.post("/datasets/inspect", status_code=status.HTTP_200_OK)
async def inspect_dataset(file: UploadFile = File(...)) -> dict[str, Any]:
    """Inspect a CSV without saving it or training a model."""
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
        decoded = raw.decode("utf-8-sig")
    except UnicodeDecodeError:
        raise HTTPException(
            status_code=400,
            detail="CSV must use UTF-8 encoding. Please export it as UTF-8 and retry.",
        )

    try:
        reader = csv.reader(io.StringIO(decoded, newline=""))
        headers = next(reader, None)
        if not headers:
            raise HTTPException(status_code=400, detail="CSV is missing a header row.")

        headers = [header.strip() for header in headers]
        if any(not header for header in headers):
            raise HTTPException(status_code=400, detail="CSV contains an empty column name.")
        if len(set(headers)) != len(headers):
            raise HTTPException(status_code=400, detail="CSV contains duplicate column names.")

        preview: list[dict[str, str]] = []
        row_count = 0
        for row in reader:
            if not row or all(not cell.strip() for cell in row):
                continue
            if len(row) != len(headers):
                raise HTTPException(
                    status_code=400,
                    detail=f"CSV row {row_count + 2} has {len(row)} values; expected {len(headers)}.",
                )
            row_count += 1
            if row_count > MAX_ROWS:
                raise HTTPException(
                    status_code=413,
                    detail=f"CSV exceeds the {MAX_ROWS:,}-row inspection limit.",
                )
            if len(preview) < PREVIEW_ROWS:
                preview.append(dict(zip(headers, row)))
    except csv.Error:
        raise HTTPException(status_code=400, detail="CSV formatting is invalid.")

    if row_count == 0:
        raise HTTPException(status_code=400, detail="CSV contains headers but no data rows.")

    return {
        "filename": filename,
        "columns": headers,
        "column_count": len(headers),
        "row_count": row_count,
        "preview": preview,
        "stored": False,
        "analysis_status": "not_started",
        "message": "CSV structure inspected only. No model prediction or training was performed.",
    }
