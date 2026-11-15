"use client";

import { useEffect, useState } from "react";
import { Activity, RefreshCw, ShieldCheck } from "lucide-react";

type ClassMetric = { class_name: string; precision: number; recall: number; f1: number; support: number; evaluation_warning?: string | null };
type Evaluation = {
  classification?: {
    accuracy: number; precision_macro: number; recall_macro: number; f1_macro: number;
    false_positive_rate_macro: number; roc_auc_macro_ovr: number | null; roc_auc_note?: string | null;
    class_metrics: ClassMetric[]; confusion_matrix: number[][]; split_strategy: string;
    split_warnings: string[]; evaluation_warnings: string[]; test_sample_count: number;
  };
  limitations?: string[];
  evaluation_group_column?: string | null;
};
type AnalysisRecord = {
  id: number; created_at: string; filename: string; row_count: number; feature_count: number;
  classes: string[]; accuracy: number; precision_macro: number; recall_macro: number; f1_macro: number;
  false_positive_rate_macro: number; anomaly_count: number; anomaly_sample_count: number;
  evaluation: Evaluation | null;
};
const API_BASE = (process.env.NEXT_PUBLIC_SENTINEL_API_URL || "http://localhost:8000").replace(/\/$/, "");
const pct = (n: number) => `${(n * 100).toFixed(1)}%`;

export default function ModelPerformance() {
  const [items, setItems] = useState<AnalysisRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true); setError("");
    try {
      const response = await fetch(`${API_BASE}/api/v1/predictions?limit=50`, { cache: "no-store" });
      if (!response.ok) throw new Error(`Could not load saved evaluations (${response.status}).`);
      const payload = await response.json() as { items: AnalysisRecord[] };
      setItems(payload.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load model performance.");
    } finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);

  const latest = items[0];
  const metrics = latest ? [
    ["Accuracy", pct(latest.accuracy)],
    ["Macro precision", pct(latest.precision_macro)],
    ["Macro recall", pct(latest.recall_macro)],
    ["Macro F1", pct(latest.f1_macro)],
    ["Macro false-positive rate", pct(latest.false_positive_rate_macro)],
    ["Macro ROC-AUC (OvR)", latest.evaluation?.classification?.roc_auc_macro_ovr == null ? "—" : pct(latest.evaluation.classification.roc_auc_macro_ovr)],
  ] : [];

  return <section className="performance-workbench">
    <div className="panel performance-panel">
      <div className="panel-heading">
        <div><h2>Saved evaluation results</h2><p>Metrics from completed, persisted dataset analyses</p></div>
        <button className="text-button" onClick={() => void load()} disabled={loading}><RefreshCw size={14}/> Refresh</button>
      </div>
      {loading ? <p className="performance-muted">Loading saved evaluations…</p> :
        error ? <p className="performance-error" role="alert">{error}</p> :
        !latest ? <div className="empty-alerts"><div className="empty-icon"><Activity size={22}/></div><b>No saved evaluations yet</b><p>Run a labelled CSV analysis in Datasets. Its measured results will appear here.</p></div> :
        <>
          <div className="performance-source"><ShieldCheck size={16}/> Latest run: <strong>{latest.filename}</strong> · {latest.row_count.toLocaleString()} rows · {latest.classes.length} classes</div>
          <div className="performance-metrics">{metrics.map(([label,value]) => <article className="metric-card" key={label}><div className="metric-top"><span>{label}</span></div><div className="metric-value">{value}</div></article>)}</div>
          <p className="performance-muted">Saved {new Date(latest.created_at).toLocaleString()} · Test metrics are dataset- and split-specific, not a guarantee of real-world detection performance.</p>
          {latest.evaluation?.classification ? <>
            <h3>Per-class performance</h3>
            <div className="performance-table-wrap"><table><thead><tr><th>Class</th><th>Precision</th><th>Recall</th><th>F1</th><th>Support</th></tr></thead><tbody>
              {latest.evaluation.classification.class_metrics.map((row) => <tr key={row.class_name}><td>{row.class_name}</td><td>{pct(row.precision)}</td><td>{pct(row.recall)}</td><td>{pct(row.f1)}</td><td>{row.support}</td></tr>)}
            </tbody></table></div>
            {latest.evaluation.classification.roc_auc_note && <p className="performance-muted">{latest.evaluation.classification.roc_auc_note}</p>}
            <h3>Confusion matrix</h3>
            <p className="performance-muted">Rows are actual classes; columns are predicted classes. Values are held-out test record counts.</p>
            <div className="performance-table-wrap"><table><thead><tr><th>Actual ↓ / Predicted →</th>{latest.classes.map((name) => <th key={name}>{name}</th>)}</tr></thead><tbody>
              {latest.evaluation.classification.confusion_matrix.map((row,index) => <tr key={latest.classes[index]}><th>{latest.classes[index]}</th>{row.map((value,col) => <td key={col}>{value}</td>)}</tr>)}
            </tbody></table></div>
            <h3>Evaluation notes</h3>
            <p className="performance-muted">Split: {latest.evaluation.classification.split_strategy.replaceAll("_"," ")}. {latest.evaluation.evaluation_group_column ? `Grouping field: ${latest.evaluation.evaluation_group_column}.` : "No capture/session grouping field was selected."}</p>
            {[...latest.evaluation.classification.split_warnings, ...latest.evaluation.classification.evaluation_warnings, ...(latest.evaluation.limitations || [])].map((note,index) => <p className="performance-note" key={index}>{note}</p>)}
          </> : <p className="performance-note">This saved analysis predates detailed evaluation storage. Run the dataset again once to save its per-class metrics and confusion matrix. The summary metrics above are still the values recorded at the time.</p>}
        </>
      }
    </div>
    {items.length > 1 && <div className="panel performance-panel"><h2>Previous analysis runs</h2><div className="performance-table-wrap"><table><thead><tr><th>Dataset</th><th>Rows</th><th>Macro F1</th><th>Run date</th></tr></thead><tbody>{items.slice(1).map((item)=><tr key={item.id}><td>{item.filename}</td><td>{item.row_count.toLocaleString()}</td><td>{pct(item.f1_macro)}</td><td>{new Date(item.created_at).toLocaleString()}</td></tr>)}</tbody></table></div></div>}
  </section>;
}
