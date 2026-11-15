"use client";

import { useCallback, useEffect, useState } from "react";

type AnalysisItem = {
  id: number; created_at: string; filename: string; row_count: number;
  classes: string[]; accuracy: number; precision_macro: number;
  recall_macro: number; f1_macro: number; false_positive_rate_macro: number;
  anomaly_count: number; anomaly_sample_count: number;
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
const pct = (n: number) => `${(n * 100).toFixed(1)}%`;

export default function HistoryWorkbench({ mode }: { mode: "predictions" | "alerts" }) {
  const [analyses, setAnalyses] = useState<AnalysisItem[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const endpoint = mode === "predictions" ? "predictions" : "alerts";
      const response = await fetch(`${API_BASE}/api/v1/${endpoint}`);
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.detail || `API request failed (${response.status})`);
      if (mode === "predictions") setAnalyses(data.items || []);
      else setAlerts(data.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load records.");
    } finally { setLoading(false); }
  }, [mode]);

  useEffect(() => { void load(); }, [load]);

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
      <button style={button} onClick={() => { setLoading(true); void load(); }} disabled={loading}>Refresh</button>
    </div>
    {error && <p role="alert" style={{ color: "#b42318", background: "#fff1f0", padding: 10, borderRadius: 7, fontSize: 12 }}>{error}</p>}
    {!loading && !error && mode === "predictions" && analyses.length === 0 && <div style={{ ...panel, textAlign: "center", padding: 35 }}><b>No completed analyses yet</b><p style={small}>Inspect and analyse a labelled CSV in Dataset Management first.</p></div>}
    {!loading && !error && mode === "alerts" && alerts.length === 0 && <div style={{ ...panel, textAlign: "center", padding: 35 }}><b>No anomaly alerts recorded</b><p style={small}>Alerts appear when an actual analysis flags records for review.</p></div>}
    {mode === "predictions" && analyses.map((item) => <article key={item.id} style={panel}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}><b style={{ fontSize: 13 }}>{item.filename}</b><span style={small}>Analysis #{item.id} · {new Date(item.created_at).toLocaleString()}</span></div>
      <p style={small}>{item.row_count.toLocaleString()} rows · Classes: {item.classes.join(", ")}</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(100px,1fr))", gap: 8, marginTop: 12 }}>
        {[["Accuracy", pct(item.accuracy)], ["Precision", pct(item.precision_macro)], ["Recall", pct(item.recall_macro)], ["Macro F1", pct(item.f1_macro)], ["Anomalies", `${item.anomaly_count}/${item.anomaly_sample_count}`]].map(([label, value]) => <div key={label} style={{ background: "#f7f9fc", borderRadius: 7, padding: 10 }}><div style={small}>{label}</div><strong style={{ display: "block", marginTop: 5, fontSize: 16 }}>{value}</strong></div>)}
      </div>
    </article>)}
    {mode === "alerts" && alerts.map((item) => <article key={item.id} style={panel}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}><b style={{ fontSize: 13 }}>{item.title}</b><span className="empty-chip">{item.severity} · {item.status}</span></div>
      <p style={{ fontSize: 11, lineHeight: 1.6, color: "#64748b" }}>{item.description}</p>
      <p style={small}>Analysis #{item.analysis_id} · {item.flagged_count} flagged of {item.sample_count} scored · {new Date(item.created_at).toLocaleString()}</p>
      {item.status === "open" && <div style={{ display: "flex", gap: 8, marginTop: 12 }}><button style={button} onClick={() => void changeStatus(item.id, "reviewed")}>Mark reviewed</button><button style={button} onClick={() => void changeStatus(item.id, "dismissed")}>Dismiss</button></div>}
    </article>)}
    <p style={{ ...small, marginTop: 14 }}>API: {API_BASE}. Records are local SQLite summaries; deploy with a persistent volume to retain them across restarts.</p>
  </section>;
}
