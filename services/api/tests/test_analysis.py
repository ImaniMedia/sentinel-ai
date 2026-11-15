from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_analysis_rejects_unknown_label_column() -> None:
    response = client.post(
        "/api/v1/analysis/classify",
        data={"label_column": "attack"},
        files={"file": ("flows.csv", "bytes,protocol,label\n10,TCP,benign\n20,UDP,scan\n", "text/csv")},
    )
    assert response.status_code == 400
    assert "was not found" in response.json()["detail"]


def test_analysis_rejects_non_csv() -> None:
    response = client.post(
        "/api/v1/analysis/classify",
        data={"label_column": "label"},
        files={"file": ("flows.txt", "not csv", "text/plain")},
    )
    assert response.status_code == 415


def test_analysis_runs_baseline_pipeline() -> None:
    rows = ["bytes,packets,protocol,label"]
    for index in range(40):
        label = "benign" if index % 2 == 0 else "scan"
        protocol = "TCP" if index % 3 else "UDP"
        rows.append(f"{index + 1},{(index % 5) + 1},{protocol},{label}")
    response = client.post(
        "/api/v1/analysis/classify",
        data={"label_column": "label"},
        files={"file": ("flows.csv", "\n".join(rows), "text/csv")},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["analysis_status"] == "completed"
    assert body["classification"]["metric_source"] == "held_out_test_partition"
    assert body["dataset"]["classes"] == ["benign", "scan"]
    assert body["anomaly_detection"]["record_count"] > 0
    assert body["limitations"]
