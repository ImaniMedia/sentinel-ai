# Anomaly detection baseline

The initial unsupervised candidate is Isolation Forest. It is fitted on a training feature matrix and can score a separate set of records.

The returned anomaly score is the negative of scikit-learn's decision function: larger values indicate records that the model considers more unusual. The score is **not** an attack probability or calibrated risk percentage. The model's binary anomaly flag is a triage signal and can include benign unusual traffic.

Before using this on a benchmark, define a training-only reference population, document feature preparation, assess contamination assumptions, and evaluate false positives against labelled holdout data. No real-world detection performance is claimed by this implementation.
