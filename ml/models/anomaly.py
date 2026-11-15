"""Unsupervised anomaly-detection baseline for prepared feature matrices."""
from __future__ import annotations

from typing import Any

import numpy as np
from sklearn.ensemble import IsolationForest


def fit_isolation_forest(
    training_features: Any,
    records: Any,
    *,
    contamination: float | str = "auto",
    random_state: int = 42,
) -> tuple[IsolationForest, dict[str, Any]]:
    """Fit only on training features and score the supplied records.

    Higher anomaly_score means more anomalous. Scores are not probabilities or
    calibrated estimates of attack likelihood.
    """
    if len(training_features) < 2:
        raise ValueError("At least two training records are required")
    if len(records) == 0:
        raise ValueError("At least one record is required for scoring")

    model = IsolationForest(
        n_estimators=200,
        contamination=contamination,
        random_state=random_state,
        n_jobs=-1,
    )
    model.fit(training_features)
    decision_values = model.decision_function(records)
    labels = model.predict(records)

    scores = -decision_values
    return model, {
        "anomaly_scores": [float(value) for value in scores],
        "is_anomaly": [bool(value == -1) for value in labels],
        "flagged_count": int(np.sum(labels == -1)),
        "record_count": int(len(labels)),
        "score_meaning": "higher values indicate greater anomaly; not a probability",
    }
