# Development commands

Run commands from the repository root so both the API package and the `ml` package are importable.

## Windows PowerShell

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
$env:PYTHONPATH = "$PWD;$PWD\services\api"
pip install -r services/api/requirements.txt
pip install -r ml/requirements.txt
uvicorn app.main:app --app-dir services/api --reload
```

In a second terminal, activate the environment and set the same `PYTHONPATH`, then run:

```powershell
pytest services/api/tests ml
```

## macOS/Linux

```bash
python -m venv .venv
source .venv/bin/activate
export PYTHONPATH="$PWD:$PWD/services/api"
pip install -r services/api/requirements.txt
pip install -r ml/requirements.txt
uvicorn app.main:app --app-dir services/api --reload
```

In a second terminal with the same environment:

```bash
pytest services/api/tests ml
```

Open `http://127.0.0.1:8000/docs` to inspect the API routes.

## Analysis endpoint

Use `POST /api/v1/analysis/classify` with multipart form fields:
- `file`: a UTF-8 CSV file.
- `label_column`: the exact name of the ground-truth target column.

This endpoint trains a baseline on the uploaded data in memory. It does not save the upload or model.

These instructions are not yet verified in a clean environment. Do not treat the tests as passing until they have actually been run.
