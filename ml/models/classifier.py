"""Supervised baseline classifier and evaluation helpers."""
from __future__ import annotations

from typing import Any

import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    confusion_matrix,
    precision_recall_fscore_support,
)

from ml.preprocessing.pipeline import PreparedDataset


def train_random_forest(
    prepared: PreparedDataset,
    *,
    random_state: int = 42,
) -> tuple[RandomForestClassifier, dict[str, Any]]:
    """Train a baseline Random Forest and return measured held-out metrics."""
    if len(np.unique(prepared.y_train)) < 2:
        raise ValueError("Training partition must contain at least two classes")

    model = RandomForestClassifier(
        n_estimators=200,
        class_weight="balanced_subsample",
        random_state=random_state,
        n_jobs=-1,
    )
    model.fit(prepared.X_train, prepared.y_train)
    predictions = model.predict(prepared.X_test)

    precision, recall, f1, support = precision_recall_fscore_support(
        prepared.y_test,
        predictions,
        labels=np.arange(len(prepared.label_encoder.classes_)),
        zero_division=0,
    )
    matrix = confusion_matrix(
        prepared.y_test,
        predictions,
        labels=np.arange(len(prepared.label_encoder.classes_)),
    )

    # Macro one-vs-rest FPR: mean FP / (FP + TN) across known classes.
    false_positive_rates = []
    for index in range(matrix.shape[0]):
        true_positive = matrix[index, index]
        false_negative = matrix[index, :].sum() - true_positive
        false_positive = matrix[:, index].sum() - true_positive
        true_negative = matrix.sum() - (
            true_positive + false_negative + false_positive
        )
        denominator = false_positive + true_negative
        false_positive_rates.append(
            float(false_positive / denominator) if denominator else 0.0
        )

    metrics: dict[str, Any] = {
        "accuracy": float(accuracy_score(prepared.y_test, predictions)),
        "precision_macro": float(np.mean(precision)),
        "recall_macro": float(np.mean(recall)),
        "f1_macro": float(np.mean(f1)),
        "false_positive_rate_macro": float(np.mean(false_positive_rates)),
        "class_metrics": [
            {
                "class_name": str(prepared.label_encoder.classes_[index]),
                "precision": float(precision[index]),
                "recall": float(recall[index]),
                "f1": float(f1[index]),
                "support": int(support[index]),
            }
            for index in range(len(precision))
        ],
        "confusion_matrix": matrix.tolist(),
        "test_sample_count": int(len(prepared.y_test)),
        "metric_source": "held_out_test_partition",
    }
    return model, metrics
