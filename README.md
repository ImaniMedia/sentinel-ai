# Sentinel AI

**An explainable network-threat analysis and research platform.**

Sentinel AI is an educational and defensive research MVP for analysing labelled network-traffic datasets, identifying anomalous behaviour, classifying known attack categories, and presenting evidence-based risk indicators.

> **Important:** Sentinel AI does not guarantee future attacks, replace a security operations team, or automatically block traffic. Its outputs are model assessments based on supplied data and require human review.

## MVP goals

- Inspect and validate uploaded network-flow CSV datasets.
- Build a reproducible preprocessing and evaluation pipeline.
- Detect anomalous records with an unsupervised baseline.
- Classify known dataset attack categories with a supervised baseline.
- Present explainable findings, alerts, and evaluation metrics.
- Preserve dataset provenance, model versions, and experiment results.

## Planned stack

- Web: Next.js, TypeScript, Tailwind CSS
- API: Python, FastAPI, Pydantic
- ML: pandas, NumPy, scikit-learn
- Storage: PostgreSQL for metadata; files/object storage for datasets and model artifacts
- Development: Docker Compose, pytest

Exact dependency versions will be pinned during implementation and tested together.

## Repository map

- `apps/web/` — dashboard
- `services/api/` — FastAPI service
- `ml/` — data, features, training, evaluation and inference
- `docs/` — architecture, research notes and delivery plan
- `tests/` — automated tests
- `infrastructure/` — local and deployment configuration

## API foundation

Requires Python 3.11+.

```bash
cd services/api
python -m venv .venv
# Windows PowerShell: .venv\\Scripts\\Activate.ps1
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Open `http://127.0.0.1:8000/health` or `http://127.0.0.1:8000/docs`.

## Dataset and evaluation principles

- Begin with one documented research dataset (CICIDS2017 is the proposed candidate).
- Keep dataset-specific label mapping explicit; do not assume labels align across datasets.
- Prefer chronological, capture-based or scenario-based splits to reduce leakage.
- Check duplicates and related flows before splitting.
- Report precision, recall, F1, confusion matrix and false-positive rate; accuracy alone is insufficient.
- Never invent model metrics. Every reported score must come from a reproducible evaluation.
- Keep ground-truth labels separate from model predictions.

## Current MVP status

Implemented in the repository:
- FastAPI health, CSV inspection, and labelled-dataset baseline analysis endpoints.
- Preprocessing, Random Forest classification, and Isolation Forest anomaly detection.
- Next.js dashboard with dataset workbench, saved analysis history, and analyst-reviewed anomaly alerts.
- SQLite storage for aggregate analysis summaries and alert metadata only.
- GitHub Actions checks for Python tests, frontend linting, and the Next.js production build.
- Docker and Render deployment configuration for the API.

The current analysis is an offline, uploaded-CSV workflow. It is not a live network sensor. The baseline uses a generic random train/test split and must not be presented as capture-aware security validation. Review [deployment instructions](docs/DEPLOYMENT.md), [the delivery plan](docs/PLAN.md), [architecture](docs/ARCHITECTURE.md), and [security notes](SECURITY.md).
