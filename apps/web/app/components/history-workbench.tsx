"use client";

import { useCallback, useEffect, useState } from "react";

type AnalysisItem = {
  id: number; created_at: string; filename: string; row_count: number;
  classes: string[]; accuracy: number; precision_macro: number;
  recall_macro: number; f1_macro: number; false_positive_rate_macro: number;
  anomaly_count: number; anomaly_sample_count: number;
  evaluation?: {
    classification?: {
      class_metrics?: Array<{ class_name: string; precision: number; recall: number; f1: number; support: number; evaluation_warning?: string | null }>;
      confusion_matrix?: number[][];
      metric_source?: string;
    };
  } | null;
};
type AlertItem = {
  id: number; analysis_id: number; created_at: string; severity: string;
  title: string; description: string; flagged_count: number;
  sample_count: number; status: string;
};

const API_BASE = (process.env.NEXT_PUBLIC_SENTINEL_API_URL || "http://localhost:8000").replace(/\/$/, "");
const panel = { background: "#fff", border: "1px solid #e9edf3", borderRadius: 10, padding: 16, marginTop: 12 } as const;
const small = { fontSize: 11, color: "#8993a5" } as const;
const button = { border: "1px solid #dbe3ef", background: "#fff", color: "#3c5e8d", padding: "7px 10px", borderRadius: 6, fontSize: 11, cursor: "pointer" } as const;
const pct = (n: number) => `${(n * 100).toFixed(1)}%`;\nconst displayClassName = (name: string) => name.replace(/\\uFFFD/g, "-").replace(/\\s*-\\s*/g, " - ");

export default function HistoryWorkbench({ mode }: { mode: "predictions" | "alerts" }) {
  const [analyses, setAnalyses] = useState<AnalysisItem[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const endpoint = mode === "predictions" ? "predictions" : "alerts";
      const response = await fetch(`${API_BASE}/api/v1/${endpoint}`);
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.detail || `API request failed (${response.status})`);
      if (mode === "predictions") setAnalyses(data.items || []);
      else setAlerts(data.items || []);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load records.");
    } finally {
      setLoading(false);
    }
  }, [mode]);

  useEffect(() => {
    let active = true;
    const endpoint = mode === "predictions" ? "predictions" : "alerts";
    fetch(`${API_BASE}/api/v1/${endpoint}`)
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.detail || `API request failed (${response.status})`);
        return data;
      })
      .then((data) => {
        if (!active) return;
        if (mode === "predictions") setAnalyses(data.items || []);
        else setAlerts(data.items || []);
        setError("");
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : "Could not load records.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [mode]);

  async function changeStatus(id: number, status: "reviewed" | "dismissed") {
    setError("");
    try {
      const response = await fetch(`${API_BASE}/api/v1/alerts/${id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.detail || "Could not update alert.");
      setAlerts((current) => current.map((item) => item.id === id ? data : item));
    } catch (err) { setError(err instanceof Error ? err.message : "Could not update alert."); }
  }

  return <section>
    <div className="notice"><strong>Evidence-led records.</strong><span>These entries come from completed dataset analyses stored by the API. They are not live network detections.</span></div>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14 }}>
      <span style={small}>{loading ? "Loading records…" : mode === "predictions" ? `${analyses.length} analysis records` : `${alerts.length} alert records`}</span>
      <button style={button} onClick={() => void load()} disabled={loading}>Refresh</button>
    </div>
    {error && <p role="alert" style={{ color: "#b42318", background: "#fff1f0", padding: 10, borderRadius: 7, fontSize: 12 }}>{error}</p>}
    {!loading && !error && mode === "predictions" && analyses.length === 0 && <div style={{ ...panel, textAlign: "center", padding: 35 }}><b>No completed analyses yet</b><p style={small}>Inspect and analyse a labelled CSV in Dataset Management first.</p></div>}
    {!loading && !error && mode === "alerts" && alerts.length === 0 && <div style={{ ...panel, textAlign: "center", padding: 35 }}><b>No anomaly alerts recorded</b><p style={small}>Alerts appear when an actual analysis flags records for review.</p></div>}
    {mode === "predictions" && analyses.map((item) => {
      const classification = item.evaluation?.classification;
      const classMetrics = classification?.class_metrics || [];
      const confusion = classification?.confusion_matrix || [];
      return <article key={item.id} className="record-card" style={{ ...panel, color: "#172033" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}><b style={{ fontSize: 13, color: "#172033" }}>{item.filename}</b><span style={small}>Analysis #{item.id} · {new Date(item.created_at).toLocaleString()}</span></div>
        <p style={{ ...small, color: "#526078", lineHeight: 1.6 }}>{item.row_count.toLocaleString()} rows · Classes: {item.classes.map(displayClassName).join(", ")}</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(100px,1fr))", gap: 8, marginTop: 12 }}>
          {[["Accuracy", pct(item.accuracy)], ["Precision", pct(item.precision_macro)], ["Recall", pct(item.recall_macro)], ["Macro F1", pct(item.f1_macro)], ["Anomalies", `${item.anomaly_count}/${item.anomaly_sample_count}`]].map(([label, value]) => <div key={label} style={{ background: "#f7f9fc", borderRadius: 7, padding: 10 }}><div style={small}>{label}</div><strong style={{ display: "block", marginTop: 5, fontSize: 16, color: "#172033" }}>{value}</strong></div>)}
        </div>
        <div style={{ marginTop: 18 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: "#172033" }}>Class-by-class results</h3>
          <p style={{ ...small, color: "#526078", marginTop: 4 }}>Measured on the held-out test data. Support is the number of actual test examples for each class.</p>
          {classMetrics.length === 0 ? <p style={{ ...small, color: "#526078", marginTop: 10 }}>Class-level results are not available for this saved analysis. Run a new analysis to generate them.</p> : <div style={{ overflowX: "auto", marginTop: 10 }}>
            <table style={{ width: "100%", minWidth: 460, borderCollapse: "collapse", fontSize: 12, textAlign: "left" }}>
              <thead><tr>{["Traffic class", "Actual", "Predicted", "Precision", "Recall", "F1"].map((heading) => <th key={heading} style={{ padding: "9px 7px", color: "#526078", background: "#f7f9fc", borderBottom: "1px solid #e5eaf1", whiteSpace: "nowrap" }}>{heading}</th>)}</tr></thead>
              <tbody>{classMetrics.map((metric, index) => {
                const predictedCount = confusion.reduce((total, row) => total + (Number(row[index]) || 0), 0);
                return <tr key={metric.class_name}>
                  <td style={{ padding: "10px 7px", borderBottom: "1px solid #edf0f5", color: "#172033", fontWeight: 600 }}>{displayClassName(metric.class_name)}</td>
                  <td style={{ padding: "10px 7px", borderBottom: "1px solid #edf0f5", color: "#172033" }}>{metric.support.toLocaleString()}</td>
                  <td style={{ padding: "10px 7px", borderBottom: "1px solid #edf0f5", color: "#172033" }}>{confusion.length ? predictedCount.toLocaleString() : "—"}</td>
                  {[metric.precision, metric.recall, metric.f1].map((value, valueIndex) => <td key={valueIndex} style={{ padding: "10px 7px", borderBottom: "1px solid #edf0f5", color: "#172033" }}>{pct(value)}</td>)}
                </tr>;
              })}</tbody>
            </table>
            {classMetrics.some((metric) => metric.evaluation_warning) && <div style={{ marginTop: 8, padding: 10, background: "#fff8e7", borderRadius: 7, color: "#805b12", fontSize: 11 }}>
              {classMetrics.filter((metric) => metric.evaluation_warning).map((metric) => <p key={metric.class_name}>{metric.evaluation_warning}</p>)}
            </div>}
          </div>}
        </div>
        {confusion.length > 0 && <details style={{ marginTop: 12 }}>
          <summary style={{ cursor: "pointer", color: "#365d91", fontSize: 12, fontWeight: 600 }}>View confusion matrix</summary>
          <p style={{ ...small, color: "#526078", marginTop: 6 }}>Rows are actual classes; columns are model-predicted classes. Class order: {item.classes.join(", ")}.</p>
          <div style={{ overflowX: "auto", marginTop: 8 }}><table style={{ borderCollapse: "collapse", fontSize: 11, minWidth: "100%" }}>
            <tbody>{confusion.map((row, rowIndex) => <tr key={rowIndex}><th style={{ padding: 7, textAlign: "left", color: "#526078", whiteSpace: "nowrap" }}>{displayClassName(item.classes[rowIndex])}</th>{row.map((count, colIndex) => <td key={colIndex} style={{ padding: 7, textAlign: "center", color: "#172033", background: rowIndex === colIndex ? "#e8f5ed" : "#f7f9fc", border: "1px solid #e5eaf1" }}>{count.toLocaleString()}</td>)}</tr>)}</tbody>
          </table></div>
        </details>}
      </article>;
    })}
    {mode === "alerts" && alerts.map((item) => <article key={item.id} className="record-card" style={{ ...panel, color: "#172033" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}><b className="record-title" style={{ fontSize: 13 }}>{item.title}</b><span className="empty-chip">{item.severity} · {item.status}</span></div>
      <p className="record-description" style={{ fontSize: 11, lineHeight: 1.6 }}>{item.description}</p>
      <p className="record-meta" style={small}>Analysis #{item.analysis_id} · {item.flagged_count} flagged of {item.sample_count} scored · {new Date(item.created_at).toLocaleString()}</p>
      {item.status === "open" && <div style={{ display: "flex", gap: 8, marginTop: 12 }}><button style={button} onClick={() => void changeStatus(item.id, "reviewed")}>Mark reviewed</button><button style={button} onClick={() => void changeStatus(item.id, "dismissed")}>Dismiss</button></div>}
    </article>)}
  </section>;
}
