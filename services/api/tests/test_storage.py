from app import storage


def test_analysis_summary_creates_review_alert(monkeypatch, tmp_path) -> None:
    monkeypatch.setattr(storage, "DEFAULT_DB_PATH", tmp_path / "sentinel-test.db")
    storage.initialize_storage()

    analysis_id = storage.save_analysis({
        "filename": "flows.csv",
        "dataset": {"row_count": 40, "feature_count": 3, "label_column": "label", "classes": ["benign", "scan"]},
        "classification": {
            "accuracy": 0.9, "precision_macro": 0.89, "recall_macro": 0.9,
            "f1_macro": 0.895, "false_positive_rate_macro": 0.1,
        },
        "anomaly_detection": {"flagged_count": 3, "record_count": 8},
    })

    history = storage.list_analyses()
    alerts = storage.list_alerts()
    overview = storage.dashboard_overview()

    assert history[0]["id"] == analysis_id
    assert history[0]["filename"] == "flows.csv"
    assert alerts[0]["analysis_id"] == analysis_id
    assert alerts[0]["status"] == "open"
    assert overview["analysis_count"] == 1
    assert overview["records_analysed"] == 40
    assert overview["anomalies_flagged"] == 3
    assert overview["open_alerts"] == 1


def test_alert_can_be_reviewed(monkeypatch, tmp_path) -> None:
    monkeypatch.setattr(storage, "DEFAULT_DB_PATH", tmp_path / "sentinel-test.db")
    storage.initialize_storage()
    storage.save_analysis({
        "filename": "flows.csv",
        "dataset": {"row_count": 20, "feature_count": 2, "label_column": "label", "classes": ["benign", "attack"]},
        "classification": {
            "accuracy": 0.8, "precision_macro": 0.8, "recall_macro": 0.8,
            "f1_macro": 0.8, "false_positive_rate_macro": 0.2,
        },
        "anomaly_detection": {"flagged_count": 1, "record_count": 10},
    })

    updated = storage.update_alert_status(1, "reviewed")

    assert updated is not None
    assert updated["status"] == "reviewed"
    assert storage.list_alerts(status="open") == []
