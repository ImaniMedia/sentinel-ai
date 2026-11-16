"use client";

import { useEffect, useState } from "react";
import DatasetWorkbench from "./components/dataset-workbench";
import HistoryWorkbench from "./components/history-workbench";
import OverviewSnapshot from "./components/overview-snapshot";
import ModelPerformance from "./components/model-performance";
import {
  Activity, AlertTriangle, ArrowUpRight, Bell, BrainCircuit, ChevronDown,
  CircleHelp, FileUp, Gauge, LayoutDashboard, LockKeyhole, Menu,
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

  useEffect(() => {
    if (active !== "Overview") return;
    let current = true;
    setDashboardLoading(true);
    setDashboardError("");
    Promise.all([
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
    }).catch((error: unknown) => {
      if (!current) return;
      setDashboardError(error instanceof Error ? error.message : "Dashboard data could not be loaded.");
    }).finally(() => {
      if (current) setDashboardLoading(false);
    });
    return () => { current = false; };
  }, [active]);

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
          <div className="profile"><div className="avatar">SA</div><div><b>Security Analyst</b><small>Research workspace</small></div><ChevronDown size={16} /></div>
        </div>
      </aside>

      {menuOpen && <button className="scrim" onClick={() => setMenuOpen(false)} aria-label="Close navigation" />}
      <section className="main-area">
        <header className="topbar">
          <button className="menu-toggle" onClick={() => setMenuOpen(true)} aria-label="Open menu"><Menu size={20} /></button>
          <div className="breadcrumbs">Workspace <span>/</span> <b>{active}</b></div>
          <div className="top-actions">
            <div className="system-status"><span className="status-dot" /> Research mode</div>
            <button className="icon-button" aria-label="Help"><CircleHelp size={18} /></button>
            <button className="icon-button" aria-label="Notifications"><Bell size={18} /></button>
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
                <article className="panel model-panel"><div className="panel-heading"><div><h2>Model readiness</h2><p>Implementation status</p></div><span className="empty-chip">In development</span></div><div className="model-row"><span><i className="model-indicator pending" /> Random Forest classifier</span><small>Implemented · validation pending</small></div><div className="model-row"><span><i className="model-indicator pending" /> Isolation Forest detector</span><small>Implemented · validation pending</small></div><div className="model-row"><span><i className="model-indicator pending" /> Dataset-specific evaluation</span><small>Not yet completed</small></div><div className="model-row"><span><i className="model-indicator pending" /> Model version registry</span><small>Planned</small></div></article>
              </div>
            </>
          ) : (
            <>
              <div className="welcome-row"><div><div className="eyebrow"><Sparkles size={14} /> SENTINEL AI WORKSPACE</div><h1>{selectedPage?.title ?? "Settings"}</h1><p>{selectedPage?.description ?? "Configure your research workspace."}</p></div><div className="date-button"><Activity size={15} /> Research mode</div></div>
              <div className="notice"><LockKeyhole size={17} /><p><b>Evidence-led reporting.</b> This workspace only displays results produced by actual dataset analysis. No sample threats or invented model scores are shown.</p></div>
              {active === "Datasets" ? <DatasetWorkbench /> : active === "AI Predictions" ? <HistoryWorkbench mode="predictions" /> : active === "Threat Alerts" ? <HistoryWorkbench mode="alerts" /> : active === "Model Performance" ? <ModelPerformance /> : active === "Settings" ? (
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
