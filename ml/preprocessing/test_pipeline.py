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


def test_rare_class_with_two_rows_appears_in_train_and_test() -> None:
    frame = pd.DataFrame(
        {
            "bytes": list(range(12)),
            "label": ["benign"] * 10 + ["xss"] * 2,
        }
    )
    result = prepare_classification_data(
        frame,
        "label",
        test_size=0.25,
        random_state=42,
    )

    encoded = {
        name: index for index, name in enumerate(result.label_encoder.classes_)
    }
    xss_index = encoded["xss"]
    assert (result.y_train == xss_index).sum() == 1
    assert (result.y_test == xss_index).sum() == 1
    assert result.split_strategy == "stratified_random_minimum_class_coverage"



def test_group_holdout_keeps_groups_separate_and_excludes_group_feature() -> None:
    frame = pd.DataFrame(
        {
            "bytes": list(range(20)),
            "capture_id": ["capture-a"] * 10 + ["capture-b"] * 10,
            "label": ["benign", "scan"] * 10,
        }
    )
    result = prepare_classification_data(
        frame,
        "label",
        group_column="capture_id",
        test_size=0.5,
        random_state=42,
    )

    assert "capture_id" not in result.feature_columns
    assert result.group_column == "capture_id"
    assert result.split_strategy == "group_holdout"
    # Each partition contains whole capture groups, never a mixture of rows.
    train_groups = set(result.train_group_values)
    test_groups = set(result.test_group_values)
    assert train_groups.isdisjoint(test_groups)
    assert train_groups | test_groups == {"capture-a", "capture-b"}
    assert len(set(result.y_train)) == 2
    assert len(set(result.y_test)) == 2
    assert any("Group-aware holdout used 'capture_id'" in warning for warning in result.evaluation_warnings)



def test_replacement_character_in_attack_labels_is_normalized() -> None:
    frame = pd.DataFrame(
        {
            "bytes": list(range(12)),
            "label": ["Benign"] * 5 + ["Web Attack � Brute Force"] * 4 + ["Web Attack � XSS"] * 3,
        }
    )
    result = prepare_classification_data(frame, "label", random_state=7)

    assert list(result.label_encoder.classes_) == [
        "Benign", "Web Attack - Brute Force", "Web Attack - XSS"
    ]
