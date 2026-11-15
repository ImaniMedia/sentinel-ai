# Deployment guide

Sentinel AI is split into a Next.js frontend and a FastAPI analysis API. Deploy
the API first, then deploy the frontend and connect it to the API URL.

## 1. Deploy the API on Render

The repository includes a root `Dockerfile` and `render.yaml` blueprint.

1. Sign in to Render and choose **New → Blueprint**.
2. Connect the `ImaniMedia/sentinel-ai` GitHub repository.
3. Review the service named `sentinel-ai-api` and deploy the blueprint.
4. When prompted for `SENTINEL_CORS_ORIGINS`, enter the exact frontend origin
   after the Vercel deployment exists. Until then, use the temporary local
   value `http://localhost:3000`; replace it before public use.
5. Wait for the service to become live. Open
   `https://YOUR-API-HOST/health`; expect JSON with status `ok`.

The blueprint provisions a 1 GB persistent disk and stores the SQLite summary
database at `/var/data/sentinel.db`. The Starter service and persistent disk
may incur charges. Check Render's current pricing before confirming deployment.
Do not remove the disk if you need to retain saved analysis history.

## 2. Deploy the frontend on Vercel

1. Sign in to Vercel and choose **Add New → Project**.
2. Import `ImaniMedia/sentinel-ai`.
3. Set the **Root Directory** to `apps/web`.
4. Keep the detected Next.js framework and default build settings.
5. Add the environment variable:
   - Name: `NEXT_PUBLIC_SENTINEL_API_URL`
   - Value: the API base URL from Render, with no trailing slash.
6. Deploy and copy the resulting Vercel origin, for example
   `https://your-project.vercel.app`.

## 3. Allow the deployed frontend in the API

Return to the Render API service's environment settings and set
`SENTINEL_CORS_ORIGINS` to the exact Vercel origin, including
`https://` and excluding any trailing slash. Save the change and allow the
API service to redeploy.

## 4. Verify the connection

- Open the Vercel site on a phone or computer.
- Confirm the overview reports the API connection rather than an unavailable
  state. Empty metrics are expected until a dataset has been analysed.
- Open Dataset Management, upload a labelled CSV, inspect it, and run the
  baseline analysis.
- Confirm the resulting analysis appears in AI Predictions and any anomaly
  alert appears in Threat Alerts.
- Mark an alert reviewed and refresh to verify the status persists.

## Important limitations

- This is a research MVP, not a live network sensor or production SOC.
- CSV files and trained model artifacts are processed in memory and are not
  retained. Only aggregate analysis summaries and alert metadata are stored.
- The baseline uses a generic random train/test split. It is not yet a
  capture-aware or chronological evaluation.
- Anomaly flags are review signals, not proof of malicious activity.
- Do not upload confidential or personally identifying network data until
  authentication, access controls, retention policies, and a security review
  are implemented.
