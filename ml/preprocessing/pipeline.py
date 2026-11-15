"""Leakage-aware preprocessing helpers for labelled tabular network-flow data.

The module intentionally does not guess dataset-specific labels or discard
columns based on their names. Dataset-specific decisions belong in a dataset
card and must be reviewed before training.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import LabelEncoder, OneHotEncoder, StandardScaler


@dataclass
class PreparedDataset:
    """Prepared train/test arrays and fitted preprocessing metadata."""

    X_train: Any
    X_test: Any
    y_train: np.ndarray
    y_test: np.ndarray
    preprocessor: ColumnTransformer
    label_encoder: LabelEncoder
    feature_columns: list[str]
    numeric_columns: list[str]
    categorical_columns: list[str]
    dropped_empty_columns: list[str]
    class_distribution: list[dict[str, Any]]
    split_strategy: str
    evaluation_warnings: list[str]


def prepare_classification_data(
    frame: pd.DataFrame,
    label_column: str,
    *,
    test_size: float = 0.2,
    random_state: int = 42,
) -> PreparedDataset:
    """Split labelled tabular data, then fit transforms on training rows only.

    The target is encoded separately. Numeric missing values use the training
    median; categorical missing values use the training most-frequent value.
    Numeric values are standardised and categorical values one-hot encoded.
    """
    if not isinstance(frame, pd.DataFrame):
        raise TypeError("frame must be a pandas DataFrame")
    if frame.empty:
        raise ValueError("Dataset has no rows")
    if label_column not in frame.columns:
        raise ValueError(f"Label column '{label_column}' was not found")
    if not 0.1 <= test_size <= 0.5:
        raise ValueError("test_size must be between 0.1 and 0.5")

    data = frame.copy()
    data = data.replace([np.inf, -np.inf], np.nan)
    data = data.dropna(subset=[label_column])
    if len(data) < 4:
        raise ValueError("At least 4 labelled rows are required")

    y_raw = data[label_column].astype(str).str.strip()
    valid_labels = y_raw.ne("")
    data = data.loc[valid_labels].copy()
    y_raw = y_raw.loc[valid_labels]
    if y_raw.nunique() < 2:
        raise ValueError("At least two distinct target classes are required")

    X = data.drop(columns=[label_column])
    empty_columns = [str(c) for c in X.columns[X.isna().all()]]
    if empty_columns:
        X = X.drop(columns=empty_columns)
    if X.shape[1] == 0:
        raise ValueError("No usable feature columns remain after removing empty columns")

    # Preserve source column names but reject duplicate names to avoid ambiguity.
    if not X.columns.is_unique:
        raise ValueError("Feature columns contain duplicate names")

    numeric_columns = X.select_dtypes(include=["number", "bool"]).columns.tolist()
    categorical_columns = [c for c in X.columns if c not in numeric_columns]
    transformers = []
    if numeric_columns:
        numeric_pipeline = Pipeline(
            steps=[
                ("imputer", SimpleImputer(strategy="median")),
                ("scaler", StandardScaler()),
            ]
        )
        transformers.append(("numeric", numeric_pipeline, numeric_columns))
    if categorical_columns:
        categorical_pipeline = Pipeline(
            steps=[
                ("imputer", SimpleImputer(strategy="most_frequent")),
                ("onehot", OneHotEncoder(handle_unknown="ignore")),
            ]
        )
        transformers.append(("categorical", categorical_pipeline, categorical_columns))

    preprocessor = ColumnTransformer(transformers=transformers)
    label_encoder = LabelEncoder()
    y = label_encoder.fit_transform(y_raw)

    # Allocate test rows per class ourselves. sklearn's approximate stratified
    # allocation can still assign zero test rows to a class with only two rows.
    counts = y_raw.value_counts().reindex(label_encoder.classes_, fill_value=0)
    n_test = int(np.ceil(len(y) * test_size))
    n_train = len(y) - n_test
    can_stratify = bool(counts.min() >= 2 and n_test >= len(counts) and n_train >= len(counts))
    split_strategy = "stratified_random_minimum_class_coverage"
    evaluation_warnings: list[str] = []

    if can_stratify:
        rng = np.random.default_rng(random_state)
        ideal = counts.to_numpy(dtype=float) * test_size
        allocation = np.floor(ideal).astype(int)
        allocation = np.maximum(allocation, 1)
        allocation = np.minimum(allocation, counts.to_numpy(dtype=int) - 1)

        # Adjust allocations to exactly match the requested test-set size,
        # while preserving at least one train and one test row per class.
        while int(allocation.sum()) < n_test:
            eligible = np.flatnonzero(allocation < counts.to_numpy(dtype=int) - 1)
            if len(eligible) == 0:
                break
            chosen = eligible[np.argmax(ideal[eligible] - allocation[eligible])]
            allocation[chosen] += 1
        while int(allocation.sum()) > n_test:
            eligible = np.flatnonzero(allocation > 1)
            if len(eligible) == 0:
                break
            chosen = eligible[np.argmin(ideal[eligible] - allocation[eligible])]
            allocation[chosen] -= 1

        if int(allocation.sum()) != n_test:
            can_stratify = False

    if can_stratify:
        test_parts = []
        train_parts = []
        for class_index, test_count in enumerate(allocation):
            class_indices = np.flatnonzero(y == class_index)
            rng.shuffle(class_indices)
            test_parts.extend(class_indices[:test_count].tolist())
            train_parts.extend(class_indices[test_count:].tolist())
        test_indices = np.asarray(test_parts, dtype=int)
        train_indices = np.asarray(train_parts, dtype=int)
        rng.shuffle(test_indices)
        rng.shuffle(train_indices)
        X_train, X_test = X.iloc[train_indices], X.iloc[test_indices]
        y_train, y_test = y[train_indices], y[test_indices]
    else:
        split_strategy = "random_unstratified_fallback"
        rare = [f"{name} ({int(count)})" for name, count in counts.items() if count < 2]
        if rare:
            evaluation_warnings.append(
                "Stratification was not possible because these classes have fewer than 2 total examples: "
                + ", ".join(rare)
                + ". Their train/test representation is not guaranteed."
            )
        else:
            evaluation_warnings.append(
                "Stratification was not possible because the requested train/test partition sizes cannot contain every class."
            )
        rng = np.random.default_rng(random_state)
        indices = rng.permutation(len(y))
        test_indices = indices[:n_test]
        train_indices = indices[n_test:]
        X_train, X_test = X.iloc[train_indices], X.iloc[test_indices]
        y_train, y_test = y[train_indices], y[test_indices]

    # Critical leakage control: fit imputers/scalers/encoders on training rows only.
    X_train_ready = preprocessor.fit_transform(X_train)
    X_test_ready = preprocessor.transform(X_test)

    return PreparedDataset(
        X_train=X_train_ready,
        X_test=X_test_ready,
        y_train=y_train,
        y_test=y_test,
        preprocessor=preprocessor,
        label_encoder=label_encoder,
        feature_columns=[str(c) for c in X.columns],
        numeric_columns=[str(c) for c in numeric_columns],
        categorical_columns=[str(c) for c in categorical_columns],
        dropped_empty_columns=empty_columns,
        class_distribution=[
            {"class_name": str(name), "total": int(count)}
            for name, count in counts.items()
        ],
        split_strategy=split_strategy,
        evaluation_warnings=evaluation_warnings,
    )
