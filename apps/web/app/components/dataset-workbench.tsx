"use client";

import { useState } from "react";

type Inspection = {
  filename: string;
  columns: string[];
  column_count: number;
  row_count: number;
  preview: Array<Record<string, string>>;
  stored: boolean;
  analysis_status: string;
  message: string;
};

type Analysis = {
  filename: string;
  analysis_status: string;
  dataset: {
    row_count: number;
    feature_count: number;
    label_column: string;
    classes: string[];
  };
  classification: {
    accuracy: number;
    precision_macro: number;
    recall_macro: number;
    f1_macro: number;
    false_positive_rate_macro: number;
    roc_auc_macro_ovr: number | null;
    roc_auc_note: string | null;
    test_sample_count: number;
    class_metrics: Array<{ class_name: string; precision: number; recall: number; f1: number; support: number }>;
  };
  anomaly_detection: {
    flagged_count: number;
    record_count: number;
    score_meaning: string;
  };
  limitations: string[];
};

const API_BASE = (process.env.NEXT_PUBLIC_SENTINEL_API_URL || "http://localhost:8000").replace(/\/$/, "");

function percent(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

export default function DatasetWorkbench() {
  const [file, setFile] = useState<File | null>(null);
  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [labelColumn, setLabelColumn] = useState("");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [busy, setBusy] = useState<"inspect" | "analyse" | null>(null);
  const [error, setError] = useState("");

  async function request(path: string, body: FormData) {
    const response = await fetch(`${API_BASE}/api/v1/${path}`, { method: "POST", body });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.detail || `Request failed (${response.status})`);
    return payload;
  }

  async function inspect() {
    if (!file) return;
    setBusy("inspect"); setError(""); setInspection(null); setAnalysis(null);
    const body = new FormData(); body.append("file", file);
    try {
      const result = await request("datasets/inspect", body) as Inspection;
      setInspection(result);
      const likelyLabel = result.columns.find((name) => ["label", "attack", "class", "target"].includes(name.trim().toLowerCase()));
      setLabelColumn(likelyLabel || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not inspect this CSV.");
    } finally { setBusy(null); }
  }

  async function analyse() {
    if (!file || !labelColumn) return;
    setBusy("analyse"); setError(""); setAnalysis(null);
    const body = new FormData(); body.append("file", file); body.append("label_column", labelColumn);
    try {
      const result = await request("analysis/classify", body) as Analysis;
      setAnalysis(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis could not be completed.");
    } finally { setBusy(null); }
  }

  const panelStyle = { background: "#fff", border: "1px solid #e9edf3", borderRadius: 10, padding: 18, marginTop: 14 } as const;
  const buttonStyle = { border: 0, borderRadius: 7, padding: "10px 14px", background: "#2563eb", color: "#fff", fontWeight: 600, fontSize: 12, cursor: "pointer" } as const;
  const metricStyle = { border: "1px solid #e9edf3", borderRadius: 8, padding: 12, minWidth: 0 } as const;

  return (
    <section>
      <div className="notice"><strong>Dataset workflow.</strong><span>Upload a labelled network-flow CSV. Files are processed in memory by the API and are not stored.</span></div>
      <div style={panelStyle}>
        <h2 style={{ margin: "0 0 6px", fontSize: 15 }}>Inspect a dataset</h2>
        <p style={{ color: "#8993a5", fontSize: 12, lineHeight: 1.6 }}>CSV only · Maximum 25 MB · Maximum 100,000 rows. Use a labelled dataset for classification.</p>
        <input type="file" accept=".csv,text/csv" onChange={(event) => { setFile(event.target.files?.[0] || null); setInspection(null); setAnalysis(null); setError(""); }} style={{ display: "block", width: "100%", margin: "14px 0" }} />
        {file && <p style={{ fontSize: 11, color: "#64748b" }}>Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</p>}
        <button style={buttonStyle} disabled={!file || busy !== null} onClick={inspect}>{busy === "inspect" ? "Inspecting…" : "Inspect CSV"}</button>
        {error && <p role="alert" style={{ color: "#b42318", background: "#fff1f0", padding: 10, borderRadius: 7, fontSize: 12, marginTop: 12 }}>{error}</p>}
      </div>

      {inspection && <div style={panelStyle}>
        <h2 style={{ margin: "0 0 10px", fontSize: 15 }}>Inspection result</h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
          <span className="empty-chip">{inspection.row_count.toLocaleString()} rows</span>
          <span className="empty-chip">{inspection.column_count} columns</span>
          <span className="empty-chip">Not stored</span>
        </div>
        <p style={{ fontSize: 12, color: "#64748b" }}>{inspection.message}</p>
        <label style={{ display: "block", fontSize: 12, fontWeight: 600, margin: "16px 0 6px" }} htmlFor="label-column">Target / label column</label>
        <select id="label-column" value={labelColumn} onChange={(event) => setLabelColumn(event.target.value)} style={{ width: "100%", maxWidth: 360, padding: 10, border: "1px solid #d8deea", borderRadius: 7, background: "#fff" }}>
          <option value="">Choose the column containing the true class labels</option>
          {inspection.columns.map((column) => <option key={column} value={column}>{column}</option>)}
        </select>
        <div style={{ overflowX: "auto", marginTop: 16 }}>
          <table style={{ borderCollapse: "collapse", fontSize: 11, width: "100%", minWidth: 480 }}>
            <thead><tr>{inspection.columns.map((column) => <th key={column} style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #e9edf3", whiteSpace: "nowrap" }}>{column}</th>)}</tr></thead>
            <tbody>{inspection.preview.map((row, index) => <tr key={index}>{inspection.columns.map((column) => <td key={column} style={{ padding: 8, borderBottom: "1px solid #f0f2f6", whiteSpace: "nowrap" }}>{row[column]}</td>)}</tr>)}</tbody>
          </table>
        </div>
        <button style={{ ...buttonStyle, marginTop: 16 }} disabled={!labelColumn || busy !== null} onClick={analyse}>{busy === "analyse" ? "Training and evaluating…" : "Run baseline analysis"}</button>
        <p style={{ fontSize: 10, color: "#8993a5", lineHeight: 1.6 }}>Analysis trains a baseline on a random held-out split. It is research-only and does not establish real-world detection performance.</p>
      </div>}

      {analysis && <div style={panelStyle}>
        <h2 style={{ margin: "0 0 5px", fontSize: 15 }}>Measured analysis results</h2>
        <p style={{ fontSize: 11, color: "#8993a5" }}>{analysis.filename} · {analysis.dataset.row_count.toLocaleString()} rows · {analysis.dataset.classes.length} classes</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(125px,1fr))", gap: 9, marginTop: 14 }}>
          {[
            ["Accuracy", percent(analysis.classification.accuracy)],
            ["Macro precision", percent(analysis.classification.precision_macro)],
            ["Macro recall", percent(analysis.classification.recall_macro)],
            ["Macro F1", percent(analysis.classification.f1_macro)],
            ["Macro false-positive rate", percent(analysis.classification.false_positive_rate_macro)],
            ["Macro ROC-AUC (OvR)", analysis.classification.roc_auc_macro_ovr === null ? "—" : percent(analysis.classification.roc_auc_macro_ovr)],
            ["Anomalies flagged", `${analysis.anomaly_detection.flagged_count} / ${analysis.anomaly_detection.record_count}`],
          ].map(([label, value]) => <div key={label} style={metricStyle}><div style={{ fontSize: 10, color: "#8993a5" }}>{label}</div><strong style={{ display: "block", marginTop: 8, fontSize: 19, color: "#28354b" }}>{value}</strong></div>)}
        </div>
        {analysis.classification.roc_auc_note && <p style={{ fontSize: 10, color: "#8993a5", marginTop: 8 }}>{analysis.classification.roc_auc_note}</p>}
        <h3 style={{ fontSize: 13, marginTop: 20 }}>Per-class performance</h3>
        <div style={{ overflowX: "auto" }}><table style={{ borderCollapse: "collapse", width: "100%", minWidth: 420, fontSize: 11 }}><thead><tr>{["Class", "Precision", "Recall", "F1", "Support"].map((v) => <th key={v} style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #e9edf3" }}>{v}</th>)}</tr></thead><tbody>{analysis.classification.class_metrics.map((item) => <tr key={item.class_name}>{[item.class_name, percent(item.precision), percent(item.recall), percent(item.f1), item.support].map((v, i) => <td key={i} style={{ padding: 8, borderBottom: "1px solid #f0f2f6" }}>{v}</td>)}</tr>)}</tbody></table></div>
        <p style={{ fontSize: 10, color: "#8993a5", lineHeight: 1.6, marginTop: 14 }}>{analysis.anomaly_detection.score_meaning}</p>
        <h3 style={{ fontSize: 13, marginTop: 18 }}>Evaluation limitations</h3>
        <ul style={{ paddingLeft: 18, color: "#64748b", fontSize: 11, lineHeight: 1.7 }}>{analysis.limitations.map((item) => <li key={item}>{item}</li>)}</ul>
      </div>}
      <p style={{ color: "#8993a5", fontSize: 10, marginTop: 12 }}>API endpoint: {API_BASE}. Configure NEXT_PUBLIC_SENTINEL_API_URL when the API is hosted away from this device.</p>
    </section>
  );
}
