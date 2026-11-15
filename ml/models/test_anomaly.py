import numpy as np
import pytest

from ml.models.anomaly import fit_isolation_forest


def test_isolation_forest_returns_advisory_scores() -> None:
    training = np.array([[0.0], [0.1], [0.2], [0.3], [0.4], [0.5]])
    records = np.array([[0.2], [10.0]])
    _, result = fit_isolation_forest(training, records, random_state=2)

    assert result["record_count"] == 2
    assert len(result["anomaly_scores"]) == 2
    assert all(isinstance(value, bool) for value in result["is_anomaly"])
    assert "not a probability" in result["score_meaning"]


def test_isolation_forest_rejects_empty_scoring_records() -> None:
    with pytest.raises(ValueError, match="At least one record"):
        fit_isolation_forest(np.array([[0.0], [1.0]]), np.empty((0, 1)))
