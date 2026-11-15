""""Supervised baseline classifier and evaluation helpers."""
from __future__ import annotations

from typing import Any

import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    confusion_matrix,
    precision_recall_fscore_support,
    roc_auc_score,
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
    probabilities = model.predict_proba(prepared.X_test)

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

    # ROC-AUC is undefined if the held-out partition omits a class.
    roc_auc_macro: float | None = None
    roc_auc_note: str | None = None
    expected_classes = np.arange(len(prepared.label_encoder.classes_))
    if len(np.unique(prepared.y_test)) != len(expected_classes):
        roc_auc_note = "Not available: the held-out test partition does not contain every class."
    else:
        try:
            if len(expected_classes) == 2:
                roc_auc_macro = float(roc_auc_score(prepared.y_test, probabilities[:, 1]))
            else:
                roc_auc_macro = float(
                    roc_auc_score(
                        prepared.y_test,
                        probabilities,
                        labels=expected_classes,
                        multi_class="ovr",
                        average="macro",
                    )
                )
        except ValueError:
            roc_auc_note = "Not available: ROC-AUC could not be calculated for this test partition."

    minimum_recommended_test_support = 20
    class_metrics = []
    evaluation_warnings = []
    for index in range(len(precision)):
        class_name = str(prepared.label_encoder.classes_[index])
        class_support = int(support[index])
        warning = None
        if class_support < minimum_recommended_test_support:
            warning = (
                f"Only {class_support} test examples for {class_name}; "
                f"at least {minimum_recommended_test_support} are recommended for a more informative class-level estimate."
            )
            evaluation_warnings.append(warning)
        class_metrics.append({
            "class_name": class_name,
            "precision": float(precision[index]),
            "recall": float(recall[index]),
            "f1": float(f1[index]),
            "support": class_support,
            "evaluation_warning": warning,
        })

    metrics: dict[str, Any] = {
        "accuracy": float(accuracy_score(prepared.y_test, predictions)),
        "precision_macro": float(np.mean(precision)),
        "recall_macro": float(np.mean(recall)),
        "f1_macro": float(np.mean(f1)),
        "false_positive_rate_macro": float(np.mean(false_positive_rates)),
        "roc_auc_macro_ovr": roc_auc_macro,
        "roc_auc_note": roc_auc_note,
        "class_metrics": class_metrics,
        "minimum_recommended_test_support": minimum_recommended_test_support,
        "evaluation_warnings": evaluation_warnings,
        "confusion_matrix": matrix.tolist(),
        "test_sample_count": int(len(prepared.y_test)),
        "metric_source": "held_out_test_partition",
        "split_strategy": prepared.split_strategy,
        "split_warnings": prepared.evaluation_warnings,
        "test_actual_labels": [
            str(value) for value in prepared.label_encoder.inverse_transform(prepared.y_test)
        ],
        "test_predicted_labels": [
            str(value) for value in prepared.label_encoder.inverse_transform(predictions)
        ],
    }
    return model, metrics
