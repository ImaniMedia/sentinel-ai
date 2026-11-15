import numpy as np
import pandas as pd

from ml.models.classifier import train_random_forest
from ml.preprocessing.pipeline import prepare_classification_data


def test_random_forest_returns_metrics_from_test_partition() -> None:
    frame = pd.DataFrame(
        {
            "bytes": list(range(1, 31)),
            "packets": [value % 7 for value in range(1, 31)],
            "protocol": ["TCP", "UDP", "ICMP"] * 10,
            "label": ["benign" if value % 2 else "scan" for value in range(1, 31)],
        }
    )
    prepared = prepare_classification_data(frame, "label", random_state=3)
    model, metrics = train_random_forest(prepared, random_state=3)

    assert len(model.classes_) == 2
    assert 0.0 <= metrics["accuracy"] <= 1.0
    assert metrics["metric_source"] == "held_out_test_partition"
    assert len(metrics["confusion_matrix"]) == 2
    assert metrics["test_sample_count"] == len(prepared.y_test)
    assert set(np.unique(prepared.y_test)).issubset(set(model.classes_))
