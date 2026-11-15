# Dataset analysis API

## Endpoint

`POST /api/v1/analysis/classify`

Content type: `multipart/form-data`

Fields:
- `file`: UTF-8 CSV file, maximum 25 MB and 100,000 rows.
- `label_column`: exact name of the target/ground-truth label column.

The endpoint reads the file in memory, prepares a random train/test split, trains a Random Forest classifier on the training partition, calculates held-out classification metrics, fits Isolation Forest on training features, and scores held-out feature rows.

## Response and limitations

The response includes dataset shape and feature metadata, class metrics, confusion matrix, false-positive rate, anomaly scores and explicit limitations. Uploaded CSV and model artifacts are not persisted.

This is a development research endpoint, not a production multi-user training service. It uses a generic random split, so results must not be presented as evidence of generalisation to unseen captures or future traffic. Use dataset-specific, time/capture-aware evaluation before reporting benchmark performance.
