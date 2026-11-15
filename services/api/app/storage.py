"""Small SQLite store for analysis summaries and analyst-review alerts.

Only derived summary metadata is stored; uploaded CSVs and row-level traffic are
never written to this database. Set SENTINEL_DB_PATH to a persistent volume
path in hosted deployments.
"""
from __future__ import annotations

import json
import os
import sqlite3
from pathlib import Path
from typing import Any

DEFAULT_DB_PATH = Path(os.getenv("SENTINEL_DB_PATH", "data/sentinel.db"))


def _connect() -> sqlite3.Connection:
    DEFAULT_DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(DEFAULT_DB_PATH, timeout=10)
    connection.row_factory = sqlite3.Row
    return connection


def initialize_storage() -> None:
    with _connect() as connection:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS analyses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
                filename TEXT NOT NULL,
                row_count INTEGER NOT NULL,
                feature_count INTEGER NOT NULL,
                label_column TEXT NOT NULL,
                classes_json TEXT NOT NULL,
                accuracy REAL NOT NULL,
                precision_macro REAL NOT NULL,
                recall_macro REAL NOT NULL,
                f1_macro REAL NOT NULL,
                false_positive_rate_macro REAL NOT NULL,
                anomaly_count INTEGER NOT NULL,
                anomaly_sample_count INTEGER NOT NULL
            )
            """
        )
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS alerts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                analysis_id INTEGER NOT NULL REFERENCES analyses(id),
                created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
                severity TEXT NOT NULL,
                title TEXT NOT NULL,
                description TEXT NOT NULL,
                flagged_count INTEGER NOT NULL,
                sample_count INTEGER NOT NULL,
                status TEXT NOT NULL DEFAULT 'open'
            )
            """
        )
        connection.execute("CREATE INDEX IF NOT EXISTS idx_analyses_created ON analyses(created_at)")
        connection.execute("CREATE INDEX IF NOT EXISTS idx_alerts_status_created ON alerts(status, created_at)")


def save_analysis(result: dict[str, Any]) -> int:
    # Ensure storage also works in tests or ASGI clients that do not run lifespan hooks.
    initialize_storage()
    dataset = result["dataset"]
    metrics = result["classification"]
    anomaly = result["anomaly_detection"]
    flagged = int(anomaly["flagged_count"])
    sample_count = int(anomaly["record_count"])
    with _connect() as connection:
        cursor = connection.execute(
            """
            INSERT INTO analyses (
                filename, row_count, feature_count, label_column, classes_json,
                accuracy, precision_macro, recall_macro, f1_macro,
                false_positive_rate_macro, anomaly_count, anomaly_sample_count
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                result["filename"], int(dataset["row_count"]), int(dataset["feature_count"]),
                dataset["label_column"], json.dumps(dataset["classes"]),
                float(metrics["accuracy"]), float(metrics["precision_macro"]),
                float(metrics["recall_macro"]), float(metrics["f1_macro"]),
                float(metrics["false_positive_rate_macro"]), flagged, sample_count,
            ),
        )
        analysis_id = int(cursor.lastrowid)
        if flagged:
            severity = "high" if flagged / max(sample_count, 1) >= 0.25 else "medium"
            connection.execute(
                """
                INSERT INTO alerts (analysis_id, severity, title, description, flagged_count, sample_count)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (
                    analysis_id, severity, "Anomalies flagged for review",
                    "Isolation Forest flagged records in the held-out sample. This is an anomaly signal, not proof of malicious activity.",
                    flagged, sample_count,
                ),
            )
        return analysis_id


def list_analyses(limit: int = 50) -> list[dict[str, Any]]:
    with _connect() as connection:
        rows = connection.execute(
            "SELECT * FROM analyses ORDER BY id DESC LIMIT ?", (limit,)
        ).fetchall()
    return [
        {
            "id": row["id"], "created_at": row["created_at"], "filename": row["filename"],
            "row_count": row["row_count"], "feature_count": row["feature_count"],
            "label_column": row["label_column"], "classes": json.loads(row["classes_json"]),
            "accuracy": row["accuracy"], "precision_macro": row["precision_macro"],
            "recall_macro": row["recall_macro"], "f1_macro": row["f1_macro"],
            "false_positive_rate_macro": row["false_positive_rate_macro"],
            "anomaly_count": row["anomaly_count"], "anomaly_sample_count": row["anomaly_sample_count"],
        }
        for row in rows
    ]


def list_alerts(limit: int = 100, status: str | None = None) -> list[dict[str, Any]]:
    with _connect() as connection:
        if status:
            rows = connection.execute(
                "SELECT * FROM alerts WHERE status = ? ORDER BY id DESC LIMIT ?", (status, limit)
            ).fetchall()
        else:
            rows = connection.execute(
                "SELECT * FROM alerts ORDER BY id DESC LIMIT ?", (limit,)
            ).fetchall()
    return [dict(row) for row in rows]


def update_alert_status(alert_id: int, status: str) -> dict[str, Any] | None:
    with _connect() as connection:
        cursor = connection.execute(
            "UPDATE alerts SET status = ? WHERE id = ?", (status, alert_id)
        )
        if cursor.rowcount == 0:
            return None
        row = connection.execute("SELECT * FROM alerts WHERE id = ?", (alert_id,)).fetchone()
    return dict(row) if row else None


def dashboard_overview() -> dict[str, Any]:
    with _connect() as connection:
        analysis_count = connection.execute("SELECT COUNT(*) FROM analyses").fetchone()[0]
        totals = connection.execute(
            """
            SELECT COALESCE(SUM(row_count),0), COALESCE(SUM(anomaly_count),0),
                   COALESCE(AVG(f1_macro),0)
            FROM analyses
            """
        ).fetchone()
        open_alerts = connection.execute(
            "SELECT COUNT(*) FROM alerts WHERE status = 'open'"
        ).fetchone()[0]
    return {
        "analysis_count": int(analysis_count),
        "records_analysed": int(totals[0]),
        "anomalies_flagged": int(totals[1]),
        "mean_macro_f1": float(totals[2]) if analysis_count else None,
        "open_alerts": int(open_alerts),
        "storage": "local_sqlite_summary_only",
    }
