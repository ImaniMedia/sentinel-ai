import pandas as pd
import pytest

from ml.preprocessing.pipeline import prepare_classification_data


def test_preprocessing_splits_and_encodes_features() -> None:
    frame = pd.DataFrame(
        {
            "bytes": [10, 20, None, 40, 50, 60, 70, 80, 90, 100],
            "protocol": ["TCP", "UDP"] * 5,
            "empty": [None] * 10,
            "label": ["benign"] * 5 + ["scan"] * 5,
        }
    )
    result = prepare_classification_data(frame, "label", random_state=7)

    assert result.X_train.shape[0] == 8
    assert result.X_test.shape[0] == 2
    assert len(result.y_train) == 8
    assert set(result.label_encoder.classes_) == {"benign", "scan"}
    assert result.dropped_empty_columns == ["empty"]
    assert "label" not in result.feature_columns


def test_missing_label_column_is_rejected() -> None:
    with pytest.raises(ValueError, match="was not found"):
        prepare_classification_data(pd.DataFrame({"bytes": [1, 2, 3, 4]}), "label")


def test_single_class_target_is_rejected() -> None:
    frame = pd.DataFrame({"bytes": [1, 2, 3, 4], "label": ["benign"] * 4})
    with pytest.raises(ValueError, match="two distinct"):
        prepare_classification_data(frame, "label")
