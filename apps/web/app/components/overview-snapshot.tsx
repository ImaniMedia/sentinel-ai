"use client";

import { useEffect, useState } from "react";
import { Activity, BrainCircuit, Network, ShieldCheck } from "lucide-react";

type Overview = {
  analysis_count: number;
  records_analysed: number;
  anomalies_flagged: number;
  mean_macro_f1: number | null;
  open_alerts: number;
};

const API_BASE = (process.env.NEXT_PUBLIC_SENTINEL_API_URL || "http://localhost:8000").replace(/\/$/, "");

export default function OverviewSnapshot() {
  const [data, setData] = useState<Overview | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "unavailable">("loading");

  useEffect(() => {
    let active = true;
    fetch(`${API_BASE}/api/v1/dashboard/overview`)
      .then(async (response) => {
        if (!response.ok) throw new Error("API unavailable");
        return response.json() as Promise<Overview>;
      })
      .then((result) => { if (active) { setData(result); setStatus("ready"); } })
      .catch(() => { if (active) setStatus("unavailable"); });
    return () => { active = false; };
  }, []);

  const metrics = [
    { label: "Records analysed", value: data ? data.records_analysed.toLocaleString() : "—", icon: Network },
    { label: "Anomalies flagged", value: data ? data.anomalies_flagged.toLocaleString() : "—", icon: Activity },
    { label: "Open alerts", value: data ? data.open_alerts.toLocaleString() : "—", icon: ShieldCheck },
    { label: "Mean macro F1", value: data?.mean_macro_f1 == null ? "—" : `${(data.mean_macro_f1 * 100).toFixed(1)}%`, icon: BrainCircuit },
  ];

  return <>
    <div className="metric-grid">
      {metrics.map((metric) => { const Icon = metric.icon; return <article className="metric-card" key={metric.label}><div className="metric-top"><span>{metric.label}</span><i><Icon size={18} /></i></div><div className="metric-value">{metric.value}</div><div className="metric-note">{status === "ready" ? `${data?.analysis_count ?? 0} saved analyses` : status === "loading" ? "Loading verified totals…" : "API not connected"}</div></article>; })}
    </div>
    <p style={{ color: "#8993a5", fontSize: 10, marginTop: -6 }}>Summary values are retrieved from saved analysis records, not live network traffic.</p>
  </>;
}
