# Sentinel AI — Architecture

## Purpose and boundaries

Sentinel AI analyses supplied network-flow records for defensive research and triage. The first release is an offline dataset-analysis MVP. It does not passively monitor a network, block traffic, execute remediation, or claim certainty about future attacks.

## Data flow

1. Dataset intake: accept a documented CSV; enforce file-size and row limits; calculate a checksum; record source and schema.
2. Validation: inspect columns, types, missing values, duplicates, timestamps and label distribution.
3. Preprocessing: use explicit dataset-specific label mapping; handle missing/infinite values; fit transformations on training data only.
4. Split: prefer chronological, capture-based or scenario-based partitions to reduce leakage.
5. Training/evaluation: keep anomaly detection and supervised classification as separate tasks.
6. Inference: return model version, prediction, score, reason codes and data provenance.
7. Presentation: show dataset coverage, evaluation metrics, prediction records and analyst-review status.

## Initial model candidates

- Isolation Forest for unsupervised anomaly detection.
- Random Forest as a supervised baseline for known dataset labels.
- XGBoost may be evaluated later after a reliable baseline and leakage-aware evaluation.

These are candidates, not claims that models have already been trained.

## Service boundaries

- `apps/web`: dashboard and user interaction.
- `services/api`: validation, API contracts, persistence and orchestration.
- `ml/`: data preparation, feature definitions, training, evaluation and inference.
- `docs/`: dataset cards, decisions and reproducibility notes.

## API direction

- `GET /health` — implemented process-level health check.
- `GET /api/v1/dashboard/overview` — planned summary.
- `POST /api/v1/datasets/upload` — planned validated dataset intake.
- `GET /api/v1/datasets` — planned dataset inventory.
- `POST /api/v1/predictions/analyze` — planned analysis job.
- `GET /api/v1/predictions` — planned prediction history.
- `GET /api/v1/alerts` — planned analyst review queue.
- `GET /api/v1/models/metrics` — planned evaluation results.

Routes other than `/health` are planned, not implemented.

## Storage

PostgreSQL should hold metadata, jobs, model versions, predictions and audit events. Large CSV files and model binaries should live in controlled file/object storage. Store checksums and references so results can be traced to exact inputs.

## Security and reliability

Validate uploads, restrict file types and sizes, avoid logging raw sensitive traffic, keep secrets outside Git, use least privilege, and record analyst actions. Treat uploaded data as untrusted. See [SECURITY.md](../SECURITY.md).
