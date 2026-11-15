# Security policy and safe-use boundaries

## Intended use

Sentinel AI is for defensive analysis of network-flow datasets and security research. Do not use it to attack systems, evade detection, or access data without authorisation.

## Data handling

- Treat uploaded files as untrusted input.
- Enforce file type, size, row-count and processing-time limits.
- Do not commit datasets, credentials, tokens, private keys, database dumps or model artifacts to Git.
- Minimise collection of IP addresses and other identifying traffic metadata.
- Avoid logging raw packet payloads or sensitive records.
- Document dataset licence, source, collection context and permitted use.

## Application security

- Keep secrets in environment variables; commit only safe placeholders in `.env.example`.
- Validate and normalise API input.
- Use parameterised database access.
- Apply authentication and authorisation before exposing user or dataset data.
- Restrict CORS to known origins in deployed environments.
- Do not expose debug mode publicly without an explicit decision.
- Record security-relevant actions without storing secrets.

## Model safety

- Treat model outputs as advisory, not proof.
- Distinguish anomaly scores, risk scores and calibrated probabilities.
- Display model version and data provenance.
- Document false positives, false negatives, dataset bias and evaluation limits.
- Require human review; no automatic blocking or remediation in the MVP.

## Reporting a vulnerability

Do not publish exploit details or sensitive data in a public issue. Contact the repository maintainer privately through the GitHub account associated with this project.
