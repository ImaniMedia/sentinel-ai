# Model baseline

## Supervised classifier

The first candidate is a Random Forest classifier trained on the output of the preprocessing helper. It uses class-balanced subsampling and a fixed random seed for repeatability.

The training function returns measured held-out accuracy, macro precision, macro recall, macro F1, macro one-vs-rest false-positive rate, per-class metrics, confusion matrix and test sample count.

## Interpretation

- Metrics are computed from the held-out test partition only.
- Macro averages give each class equal weight.
- Scores depend on dataset quality, label mapping and split design.
- The current generic random split is a development baseline, not final evidence of real-world generalisation.
- No model has been trained on a real benchmark dataset as part of these repository commits. Do not quote example test outputs as project performance.

## Next steps

Add capture-aware/time-aware splits, dataset-specific label maps, model persistence/versioning, model cards and independent evaluation before reporting benchmark performance.
