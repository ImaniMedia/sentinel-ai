# Preprocessing design notes

The initial preprocessing helper supports labelled tabular CSV-derived network-flow data.

## Current behaviour

- Removes rows without a usable target label.
- Replaces positive and negative infinity with missing values.
- Drops feature columns that are entirely empty.
- Separates numeric and categorical features.
- Splits data into train and test partitions before fitting transformations.
- Fits median imputation and scaling on training numeric features only.
- Fits most-frequent imputation and one-hot encoding on training categorical features only.
- Encodes target labels separately and returns the fitted encoders.

## Important limitations

This is a generic baseline, not a complete CICIDS2017/UNSW-NB15 adapter. It does not infer which columns are identifiers, select a target column automatically, reconcile labels between datasets, remove duplicate flows, or create capture/time-aware splits. Those decisions must be documented and implemented for each dataset before publishing model scores.

The default split is random with a fixed seed. For a final security evaluation, replace it with a chronological, capture-based or scenario-based split where dataset metadata permits. The helper avoids transformation leakage, but it cannot by itself prevent related attack sessions from crossing the split.
