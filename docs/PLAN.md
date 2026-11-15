# Delivery plan

## Stage 1 — Foundation
- [x] Establish project purpose, boundaries and repository documentation.
- [x] Add project architecture and delivery plan.
- [ ] Add pinned dependencies and automated API test.
- [ ] Verify local run on Windows and document tested commands.

## Stage 2 — Dataset inspection
- [ ] Select and document a permitted research dataset.
- [ ] Implement CSV upload limits and schema inspection.
- [ ] Add dataset checksum, metadata and validation report.
- [ ] Keep raw datasets out of Git.

## Stage 3 — Baseline analysis
- [ ] Create dataset-specific label mapping.
- [ ] Build leakage-aware train/validation/test split.
- [ ] Train baseline classifier and anomaly detector.
- [ ] Save model version and preprocessing pipeline.
- [ ] Evaluate precision, recall, F1, confusion matrix and false-positive rate.

## Stage 4 — API and dashboard
- [ ] Add dataset and analysis endpoints.
- [ ] Persist jobs and results.
- [ ] Build overview, dataset, prediction and model-metrics views.
- [ ] Clearly distinguish historical/offline analysis from live monitoring.

## Stage 5 — Verification and demo
- [ ] Add unit and API tests.
- [ ] Re-run from a clean environment.
- [ ] Prepare a permitted demo dataset and reproducible walkthrough.
- [ ] Document limitations, model card and known issues.

## Acceptance criteria

A feature is complete only when it runs, has meaningful validation or tests, and its status is documented. Do not show placeholder charts as real findings. Do not invent evaluation scores, sample alerts or training results. If a stage cannot be verified, label it incomplete.
