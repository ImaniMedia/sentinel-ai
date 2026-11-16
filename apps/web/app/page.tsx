"use client";

import { useEffect, useState } from "react";
import DatasetWorkbench from "./components/dataset-workbench";
import HistoryWorkbench from "./components/history-workbench";
import OverviewSnapshot from "./components/overview-snapshot";
import ModelPerformance from "./components/model-performance";
import {
  Activity, AlertTriangle, ArrowUpRight, Bell, BrainCircuit,
  FileUp, Gauge, LayoutDashboard, LockKeyhole, Menu,
  Settings, Shield, ShieldCheck, SlidersHorizontal, Sparkles, X, Moon, Sun,
} from "lucide-react";

type DashboardAnalysis = {
  id: number;
  created_at: string;
  filename: string;
  row_count: number;
  anomaly_count: number;
};

type DashboardAlert = {
  id: number;
  created_at: string;
  severity: string;
  title: string;
  description: string;
  flagged_count: number;
  sample_count: number;
  status: string;
};
type ResearchExperiment = {
  id: string;
  name: string;
  dataset: string;
  model: string;
  status: "planned" | "running" | "completed";
  notes: string;
  created_at: string;
};


const API_BASE = (process.env.NEXT_PUBLIC_SENTINEL_API_URL || "http://localhost:8000").replace(/\/$/, "");

const navigation = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "AI Predictions", icon: BrainCircuit },
  { label: "Threat Alerts", icon: AlertTriangle },
  { label: "Datasets", icon: FileUp },
  { label: "Model Performance", icon: Gauge },
  { label: "Research Lab", icon: SlidersHorizontal },
];



const pageCopy: Record<string, { title: string; description: string; detail: string; next: string }> = {
  "AI Predictions": {
    title: "AI predictions",
    description: "Review model outputs from analysed network-flow data.",
    detail: "No predictions are available yet.",
    next: "Run an analysis on a labelled CSV dataset. Predictions will appear here when the API is connected and analysis has completed.",
  },
  "Threat Alerts": {
    title: "Threat alerts",
    description: "Review suspicious activity flagged for analyst attention.",
    detail: "No alerts to review.",
    next: "Alerts will be created from actual analysis results. Sentinel AI does not generate sample incidents or claim that an attack is happening.",
  },
  Datasets: {
    title: "Dataset management",
    description: "Prepare network-flow data for controlled experiments.",
    detail: "No datasets registered.",
    next: "The API currently includes a CSV inspection route. A connected upload-and-storage workflow is the next integration task.",
  },
  "Model Performance": {
    title: "Model performance",
    description: "Evaluate detection quality using held-out data.",
    detail: "No benchmark results yet.",
    next: "Precision, recall, F1, false-positive rate and confusion matrices will be shown after models are trained and evaluated on a documented dataset split.",
  },
  "Research Lab": {
    title: "Research lab",
    description: "Track reproducible experiments and model configurations.",
    detail: "No experiments recorded.",
    next: "Experiments will be recorded with dataset versions, preprocessing settings, model parameters and evaluation results.",
  },
};

export default function Home() {
  const [active, setActive] = useState("Overview");
  const [menuOpen, setMenuOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [dashboardAnalyses, setDashboardAnalyses] = useState<DashboardAnalysis[]>([]);
  const [dashboardAlerts, setDashboardAlerts] = useState<DashboardAlert[]>([]);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [dashboardError, setDashboardError] = useState("");
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState<DashboardAlert[]>([]);
  const [notificationLoading, setNotificationLoading] = useState(true);
  const [notificationError, setNotificationError] = useState("");
  const [experiments, setExperiments] = useState<ResearchExperiment[]>([]);
  const [experimentsLoaded, setExperimentsLoaded] = useState(false);
  const [experimentName, setExperimentName] = useState("");
  const [experimentDataset, setExperimentDataset] = useState("");
  const [experimentModel, setExperimentModel] = useState("Random Forest");
  const [experimentNotes, setExperimentNotes] = useState("");
  const [editingExperiment, setEditingExperiment] = useState<string | null>(null);


  useEffect(() => {
    if (active !== "Overview") return;
    let current = true;
    Promise.resolve().then(() => {
      if (!current) return;
      setDashboardLoading(true);
      setDashboardError("");
      return Promise.all([
        fetch(`${API_BASE}/api/v1/predictions?limit=7`).then(async (response) => {
          const payload = await response.json().catch(() => ({}));
          if (!response.ok) throw new Error(payload.detail || "Could not load analysis history.");
          return payload.items as DashboardAnalysis[];
        }),
        fetch(`${API_BASE}/api/v1/alerts?status=open&limit=5`).then(async (response) => {
          const payload = await response.json().catch(() => ({}));
          if (!response.ok) throw new Error(payload.detail || "Could not load threat alerts.");
          return payload.items as DashboardAlert[];
        }),
      ]).then(([analyses, alerts]) => {
        if (!current) return;
        setDashboardAnalyses(analyses || []);
        setDashboardAlerts(alerts || []);
      });
    }).catch((error: unknown) => {
      if (!current) return;
      setDashboardError(error instanceof Error ? error.message : "Dashboard data could not be loaded.");
    }).finally(() => {
      if (current) setDashboardLoading(false);
    });
    return () => { current = false; };
  }, [active]);

  useEffect(() => {
    Promise.resolve().then(() => {
      try {
        const savedExperiments = window.localStorage.getItem("sentinel-experiments");
        if (savedExperiments) setExperiments(JSON.parse(savedExperiments) as ResearchExperiment[]);
      } catch {
        setExperiments([]);
      } finally {
        setExperimentsLoaded(true);
      }
    });
  }, []);

  useEffect(() => {
    if (experimentsLoaded) window.localStorage.setItem("sentinel-experiments", JSON.stringify(experiments));
  }, [experiments, experimentsLoaded]);

  useEffect(() => {
    let current = true;
    fetch(`${API_BASE}/api/v1/alerts?limit=100`)
      .then(async (response) => {
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.detail || "Could not load notification history.");
        return payload.items as DashboardAlert[];
      })
      .then((items) => {
        if (!current) return;
        setNotifications(items || []);
        setNotificationError("");
      })
      .catch((error: unknown) => {
        if (current) setNotificationError(error instanceof Error ? error.message : "Notifications could not be loaded.");
      })
      .finally(() => { if (current) setNotificationLoading(false); });
    return () => { current = false; };
  }, [notificationOpen]);

  async function markNotificationReviewed(alertId: number) {
    setNotificationError("");
    try {
      const response = await fetch(`${API_BASE}/api/v1/alerts/${alertId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "reviewed" }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.detail || "Could not update notification.");
      setNotifications((items) => items.map((item) => item.id === alertId ? payload : item));
      setDashboardAlerts((items) => items.filter((item) => item.id !== alertId));
    } catch (error) {
      setNotificationError(error instanceof Error ? error.message : "Could not update notification.");
    }
  }

  function saveExperiment() {
    const name = experimentName.trim();
    if (!name) return;
    if (editingExperiment) {
      setExperiments((items) => items.map((item) => item.id === editingExperiment
        ? { ...item, name, dataset: experimentDataset.trim(), model: experimentModel, notes: experimentNotes.trim() }
        : item));
    } else {
      setExperiments((items) => [{
        id: `exp-${Date.now()}`, name, dataset: experimentDataset.trim(),
        model: experimentModel, status: "planned", notes: experimentNotes.trim(),
        created_at: new Date().toISOString(),
      }, ...items]);
    }
    setExperimentName("");
    setExperimentDataset("");
    setExperimentModel("Random Forest");
    setExperimentNotes("");
    setEditingExperiment(null);
  }

  function editExperiment(item: ResearchExperiment) {
    setEditingExperiment(item.id);
    setExperimentName(item.name);
    setExperimentDataset(item.dataset);
    setExperimentModel(item.model);
    setExperimentNotes(item.notes);
  }

  useEffect(() => {
    const saved = window.localStorage.getItem("sentinel-theme");
    const initial = saved === "dark" ? "dark" : "light";
    document.documentElement.dataset.theme = initial;
    Promise.resolve().then(() => setTheme(initial));
  }, []);
  function changeTheme(next: "light" | "dark") {
    setTheme(next);
    document.documentElement.dataset.theme = next;
    window.localStorage.setItem("sentinel-theme", next);
  }
  const selectedPage = pageCopy[active];

  return (
    <main className="app-shell">
      <aside className={`sidebar ${menuOpen ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-mark"><Shield size={21} strokeWidth={2.4} /></div>
          <div><strong>sentinel<span>.</span>ai</strong><small>THREAT INTELLIGENCE</small></div>
          <button className="mobile-close" onClick={() => setMenuOpen(false)} aria-label="Close menu"><X size={18} /></button>
        </div>
        <div className="workspace-label">WORKSPACE</div>
        <nav className="nav-list" aria-label="Main navigation">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.label} onClick={() => { setActive(item.label); setMenuOpen(false); }} className={`nav-item ${active === item.label ? "active" : ""}`} aria-current={active === item.label ? "page" : undefined}>
                <Icon size={18} /><span>{item.label}</span>
                {item.label === "Threat Alerts" && <i className="nav-dot" />}
              </button>
            );
          })}
        </nav>
        <div className="sidebar-bottom">
          <div className="environment-card"><span className="status-dot" /><div><b>Research environment</b><small>Offline dataset mode</small></div></div>
          <button className="nav-item" onClick={() => { setActive("Settings"); setMenuOpen(false); }}><Settings size={18} /><span>Settings</span></button>
          <div className="profile" aria-label="Current workspace profile"><div className="avatar">SA</div><div><b>Security Analyst</b><small>Research workspace</small></div></div>
        </div>
      </aside>

      {menuOpen && <button className="scrim" onClick={() => setMenuOpen(false)} aria-label="Close navigation" />}
      <section className="main-area">
        <header className="topbar">
          <button className="menu-toggle" onClick={() => setMenuOpen(true)} aria-label="Open menu"><Menu size={20} /></button>
          <div className="breadcrumbs">Workspace <span>/</span> <b>{active}</b></div>
          <div className="top-actions">
            <div className="system-status"><span className="status-dot" /> Research mode</div>
            <div className="notification-wrap">
              <button className="icon-button notification-trigger" type="button" aria-label="Open notifications" aria-expanded={notificationOpen} title="Notifications" onClick={() => setNotificationOpen((open) => !open)}>
                <Bell size={18} />
                {notifications.filter((item) => item.status === "open").length > 0 && <span className="notification-count">{notifications.filter((item) => item.status === "open").length > 99 ? "99+" : notifications.filter((item) => item.status === "open").length}</span>}
              </button>
              {notificationOpen && <div className="notification-popover" role="dialog" aria-label="Notification centre">
                <div className="notification-heading"><div><b>Notifications</b><small>{notifications.filter((item) => item.status === "open").length} unread · {notifications.length} total</small></div><button type="button" onClick={() => setNotificationOpen(false)} aria-label="Close notifications"><X size={16} /></button></div>
                {notificationError && <p className="notification-error" role="alert">{notificationError}</p>}
                {notificationLoading ? <p className="notification-empty">Loading notification history…</p> : notifications.length === 0 && !notificationError ? <p className="notification-empty">No notifications yet. Alerts from completed dataset analyses will appear here.</p> : <div className="notification-list">
                  {notifications.slice(0, 10).map((item) => <div className={`notification-item ${item.status === "open" ? "unread" : ""}`} key={item.id}>
                    <div className="notification-item-top"><b>{item.title}</b><span>{item.status}</span></div>
                    <p>{item.description}</p>
                    <small>{item.severity} · {item.flagged_count.toLocaleString()} flagged · {new Date(item.created_at).toLocaleString()}</small>
                    {item.status === "open" && <button type="button" onClick={() => void markNotificationReviewed(item.id)}>Mark as reviewed</button>}
                  </div>)}
                </div>}
                <button className="notification-footer" type="button" onClick={() => { setActive("Threat Alerts"); setNotificationOpen(false); }}>Open full alert history <ArrowUpRight size={14} /></button>
              </div>}
            </div>
            <div className="top-avatar">SA</div>
          </div>
        </header>

        <div className="content">
          {active === "Overview" ? (
            <>
              <div className="welcome-row">
                <div><div className="eyebrow"><Sparkles size={14} /> SECURITY RESEARCH WORKSPACE</div><h1>Security overview</h1><p>Understand your network activity. Find what deserves a closer look.</p></div>
                <div className="date-button"><Activity size={15} /> Offline analysis</div>
              </div>
              <div className="notice"><LockKeyhole size={17} /><p><b>Research environment is ready.</b> Metrics and alerts will appear after you upload and analyse a dataset. Nothing here is simulated.</p></div>
              <div className="section-heading"><div><h2>Workspace snapshot</h2><p>Results from your analysed datasets</p></div><span className="empty-chip">Awaiting first analysis</span></div>
              <OverviewSnapshot />
              <div className="dashboard-grid">
                <article className="panel activity-panel">
                  <div className="panel-heading"><div><h2>Traffic analysis</h2><p>Saved dataset activity over time</p></div><span className="empty-chip">{dashboardLoading ? "Loading…" : dashboardAnalyses.length ? `${dashboardAnalyses.length} recent runs` : "No data yet"}</span></div>
                  {dashboardError ? <div className="empty-chart"><div className="chart-empty-icon"><Activity size={25} /></div><b>Traffic activity unavailable</b><p>{dashboardError}</p></div> : dashboardLoading ? <div className="empty-chart"><div className="chart-empty-icon"><Activity size={25} /></div><b>Loading analysis history…</b><p>Fetching saved dataset results from Sentinel AI.</p></div> : dashboardAnalyses.length === 0 ? <div className="empty-chart"><div className="chart-grid"><span /><span /><span /><span /></div><div className="chart-empty-icon"><Activity size={25} /></div><b>Your analysis timeline will appear here</b><p>Upload and analyse a labelled network-flow CSV to get started.</p></div> : <div style={{ display: "flex", alignItems: "end", gap: 10, minHeight: 178, padding: "22px 8px 8px", overflowX: "auto" }}>
                    {[...dashboardAnalyses].reverse().map((item) => {
                      const maxRows = Math.max(...dashboardAnalyses.map((entry) => entry.row_count), 1);
                      const barHeight = Math.max(8, (item.row_count / maxRows) * 112);
                      const anomalyHeight = item.row_count ? Math.max(3, (item.anomaly_count / item.row_count) * barHeight) : 0;
                      return <div key={item.id} title={`${item.filename}: ${item.row_count.toLocaleString()} records, ${item.anomaly_count.toLocaleString()} anomalies flagged`} style={{ minWidth: 48, flex: "1 0 48px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "end", gap: 7 }}>
                        <span style={{ fontSize: 10, color: "var(--muted, #8993a5)" }}>{item.row_count.toLocaleString()}</span>
                        <div style={{ height: barHeight, width: "70%", maxWidth: 34, minHeight: 8, background: "#dbeafe", borderRadius: "5px 5px 0 0", position: "relative", overflow: "hidden" }}><div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: anomalyHeight, background: "#f59e0b" }} /></div>
                        <span style={{ fontSize: 9, color: "var(--muted, #8993a5)", whiteSpace: "nowrap" }}>{new Date(item.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
                      </div>;
                    })}
                  </div>}
                  <div className="chart-legend"><span><i className="legend-blue" /> Records analysed</span><span><i className="legend-orange" /> Flagged anomalies</span></div>
                </article>
                <article className="panel alerts-panel">
                  <div className="panel-heading"><div><h2>Recent threat alerts</h2><p>Open items requiring analyst review</p></div><button className="text-button" onClick={() => setActive("Threat Alerts")}>View all <ArrowUpRight size={14} /></button></div>
                  {dashboardError ? <div className="empty-alerts"><div className="empty-icon"><ShieldCheck size={22} /></div><b>Alerts unavailable</b><p>{dashboardError}</p></div> : dashboardLoading ? <div className="empty-alerts"><div className="empty-icon"><ShieldCheck size={22} /></div><b>Loading threat alerts…</b><p>Checking saved alerts from completed analyses.</p></div> : dashboardAlerts.length === 0 ? <div className="empty-alerts"><div className="empty-icon"><ShieldCheck size={22} /></div><b>No alerts to review</b><p>Alerts will appear here when actual dataset analysis flags anomalies for review.</p></div> : <div style={{ display: "grid", gap: 12, padding: "14px 2px" }}>
                    {dashboardAlerts.slice(0, 3).map((alert) => <div key={alert.id} style={{ borderBottom: "1px solid var(--border, #e9edf3)", paddingBottom: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}><b style={{ fontSize: 12 }}>{alert.title}</b><span className="empty-chip">{alert.severity}</span></div>
                      <p style={{ fontSize: 11, color: "var(--muted, #8993a5)", lineHeight: 1.5, margin: "6px 0" }}>{alert.description}</p>
                      <small style={{ color: "var(--muted, #8993a5)" }}>{alert.flagged_count.toLocaleString()} flagged of {alert.sample_count.toLocaleString()} · {new Date(alert.created_at).toLocaleString()}</small>
                    </div>)}
                  </div>}
                </article>
              </div>
              <div className="bottom-grid">
                <article className="panel quick-panel"><div className="panel-heading"><div><h2>Get started</h2><p>Run your first network traffic analysis</p></div><Sparkles size={18} className="muted-icon" /></div><button className="upload-tile" onClick={() => setActive("Datasets")}><span className="upload-icon"><FileUp size={20} /></span><span><b>Manage datasets</b><small>Inspect and prepare a CSV dataset</small></span><ArrowUpRight size={17} /></button><button className="upload-tile" onClick={() => setActive("Research Lab")}><span className="upload-icon purple"><BrainCircuit size={20} /></span><span><b>Explore model experiments</b><small>Review the ML research pipeline</small></span><ArrowUpRight size={17} /></button></article>
                <article className="panel model-panel"><div className="panel-heading"><div><h2>Model readiness</h2><p>Current implementation status</p></div><span className="empty-chip">Research MVP</span></div><div className="model-row"><span><i className="model-indicator ready" /> Random Forest classifier</span><small>Implemented · evaluated on labelled datasets</small></div><div className="model-row"><span><i className="model-indicator ready" /> Isolation Forest detector</span><small>Implemented · runs during dataset analysis</small></div><div className="model-row"><span><i className="model-indicator ready" /> Dataset-specific evaluation</span><small>Completed · CICIDS2017 sample (10,000 rows)</small></div><div className="model-row"><span><i className="model-indicator pending" /> Model version registry</span><small>Not implemented · future work</small></div></article>
              </div>
            </>
          ) : (
            <>
              <div className="welcome-row"><div><div className="eyebrow"><Sparkles size={14} /> SENTINEL AI WORKSPACE</div><h1>{selectedPage?.title ?? "Settings"}</h1><p>{selectedPage?.description ?? "Configure your research workspace."}</p></div><div className="date-button"><Activity size={15} /> Research mode</div></div>
              <div className="notice"><LockKeyhole size={17} /><p><b>Evidence-led reporting.</b> This workspace only displays results produced by actual dataset analysis. No sample threats or invented model scores are shown.</p></div>
              {active === "Datasets" ? <DatasetWorkbench /> : active === "AI Predictions" ? <HistoryWorkbench mode="predictions" /> : active === "Threat Alerts" ? <HistoryWorkbench mode="alerts" /> : active === "Model Performance" ? <ModelPerformance /> : active === "Research Lab" ? (
                <section className="research-lab">
                  <div className="panel research-form">
                    <div className="panel-heading"><div><h2>{editingExperiment ? "Edit experiment" : "Create experiment"}</h2><p>Record a repeatable model evaluation and track its progress.</p></div><span className="empty-chip">Saved on this device</span></div>
                    <div className="experiment-form-grid">
                      <label>Experiment name<input value={experimentName} onChange={(event) => setExperimentName(event.target.value)} placeholder="e.g. CICIDS2017 Random Forest baseline" /></label>
                      <label>Dataset / version<input value={experimentDataset} onChange={(event) => setExperimentDataset(event.target.value)} placeholder="e.g. CICIDS2017 · 10k sample" /></label>
                      <label>Model<select value={experimentModel} onChange={(event) => setExperimentModel(event.target.value)}><option>Random Forest</option><option>Isolation Forest</option><option>Combined pipeline</option><option>Other</option></select></label>
                      <label className="experiment-notes">Notes<textarea value={experimentNotes} onChange={(event) => setExperimentNotes(event.target.value)} placeholder="Hypothesis, configuration, split strategy or observations…" rows={3} /></label>
                    </div>
                    <div className="experiment-form-actions"><button type="button" className="experiment-save" onClick={saveExperiment} disabled={!experimentName.trim()}>{editingExperiment ? "Save changes" : "Add experiment"}</button>{editingExperiment && <button type="button" className="experiment-cancel" onClick={() => { setEditingExperiment(null); setExperimentName(""); setExperimentDataset(""); setExperimentModel("Random Forest"); setExperimentNotes(""); }}>Cancel</button>}</div>
                  </div>
                  <div className="research-list-heading"><div><h2>Experiment tracker</h2><p>{experiments.length} saved {experiments.length === 1 ? "experiment" : "experiments"}</p></div></div>
                  {experiments.length === 0 ? <div className="panel research-empty"><div className="empty-icon"><BrainCircuit size={22} /></div><b>No experiments recorded yet</b><p>Create an experiment above to document its dataset, model, notes and progress. Records stay in this browser on this device.</p></div> : <div className="experiment-list">{experiments.map((item) => <article className="panel experiment-card" key={item.id}>
                    <div className="experiment-card-heading"><div><h3>{item.name}</h3><small>Created {new Date(item.created_at).toLocaleDateString()}</small></div><span className={`experiment-status status-${item.status}`}>{item.status}</span></div>
                    <div className="experiment-meta"><span><b>Dataset:</b> {item.dataset || "Not specified"}</span><span><b>Model:</b> {item.model}</span></div>
                    {item.notes && <p className="experiment-notes-text">{item.notes}</p>}
                    <div className="experiment-card-actions"><label>Status<select value={item.status} onChange={(event) => setExperiments((items) => items.map((entry) => entry.id === item.id ? { ...entry, status: event.target.value as ResearchExperiment["status"] } : entry))}><option value="planned">Planned</option><option value="running">Running</option><option value="completed">Completed</option></select></label><button type="button" onClick={() => editExperiment(item)}>Edit</button><button type="button" className="experiment-delete" onClick={() => { setExperiments((items) => items.filter((entry) => entry.id !== item.id)); if (editingExperiment === item.id) setEditingExperiment(null); }}>Delete</button></div>
                  </article>)}</div>}
                </section>
              ) : active === "Settings" ? (
                <article className="panel settings-panel">
                  <div className="panel-heading"><div><h2>Appearance</h2><p>Choose how Sentinel AI looks on this device.</p></div></div>
                  <div className="theme-setting">
                    <div className="theme-setting-copy"><b>Dark mode</b><span>Use a darker colour theme across the entire workspace.</span></div>
                    <button type="button" role="switch" aria-checked={theme === "dark"} aria-label="Enable dark mode" className={`theme-switch ${theme === "dark" ? "is-on" : ""}`} onClick={() => changeTheme(theme === "dark" ? "light" : "dark")}><span /></button>
                  </div>
                  <p className="performance-muted">Your theme preference is saved on this device and will be restored when you return.</p>
                  <div className="theme-preview"><span>{theme === "dark" ? <Moon size={16}/> : <Sun size={16}/>}</span><div><b>{theme === "dark" ? "Dark theme enabled" : "Light theme enabled"}</b><small>Applies to dashboard pages, tables, forms and panels.</small></div></div>
                </article>
              ) : (
                <article className="panel empty-alerts" style={{ minHeight: 270, height: "auto", padding: 30 }}>
                  <div className="empty-icon"><ShieldCheck size={22} /></div>
                  <b>{selectedPage?.detail ?? "This section is not configured yet."}</b>
                  <p style={{ maxWidth: 520, lineHeight: 1.7 }}>{selectedPage?.next ?? "This workspace section is not configured yet."}</p>
                </article>
              )}
            </>
          )}
          <footer>Sentinel AI <span>·</span> Evidence-led security research <span>·</span> Offline dataset analysis</footer>
        </div>
      </section>
    </main>
  );
}
