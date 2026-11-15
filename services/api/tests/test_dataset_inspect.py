from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_inspect_valid_csv() -> None:
    response = client.post(
        "/api/v1/datasets/inspect",
        files={"file": ("flows.csv", "duration,protocol\n12,TCP\n7,UDP\n", "text/csv")},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["column_count"] == 2
    assert body["row_count"] == 2
    assert body["preview"][0] == {"duration": "12", "protocol": "TCP"}
    assert body["stored"] is False
    assert body["analysis_status"] == "not_started"


def test_reject_non_csv() -> None:
    response = client.post(
        "/api/v1/datasets/inspect",
        files={"file": ("flows.txt", "not a csv", "text/plain")},
    )
    assert response.status_code == 415


def test_reject_duplicate_headers() -> None:
    response = client.post(
        "/api/v1/datasets/inspect",
        files={"file": ("flows.csv", "duration,duration\n1,2\n", "text/csv")},
    )
    assert response.status_code == 400
