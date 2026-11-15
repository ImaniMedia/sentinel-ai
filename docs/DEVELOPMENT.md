# Development commands

## API

Run from `services/api`:

```bash
python -m venv .venv
# Activate the environment for your operating system.
pip install -r requirements.txt
pip install -e .
uvicorn app.main:app --reload
pytest
```

The editable install command above requires a packaging configuration, which is not yet included. Until that is added, run the API tests from `services/api` with the project root on the Python path, for example:

```bash
# Windows PowerShell, from repository root
$env:PYTHONPATH = "services/api"
pytest services/api/tests
```

## ML helpers

From the repository root:

```bash
python -m venv .venv
# Activate the environment.
pip install -r ml/requirements.txt
pytest ml
```

These commands are documented but have not yet been executed in a clean environment. Treat them as intended setup instructions until verified.
