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
  useEffect(() => {
    const saved = window.localStorage.getItem("sentinel-theme");
    const initial = saved === "dark" ? "dark" : "light";
    setTheme(initial);
    document.documentElement.dataset.theme = initial;
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
                <article className="panel activity-panel"><div className="panel-heading"><div><h2>Traffic analysis</h2><p>Dataset activity over time</p></div><span className="empty-chip">No data yet</span></div><div className="empty-chart"><div className="chart-grid"><span /><span /><span /><span /></div><div className="chart-empty-icon"><Activity size={25} /></div><b>Your analysis timeline will appear here</b><p>Upload a labelled network-flow CSV to get started.</p></div><div className="chart-legend"><span><i className="legend-blue" /> Records analysed</span><span><i className="legend-orange" /> Flagged anomalies</span></div></article>
                <article className="panel alerts-panel"><div className="panel-heading"><div><h2>Recent threat alerts</h2><p>Items requiring analyst review</p></div><button className="text-button" onClick={() => setActive("Threat Alerts")}>View all <ArrowUpRight size={14} /></button></div><div className="empty-alerts"><div className="empty-icon"><ShieldCheck size={22} /></div><b>No alerts to review</b><p>Alerts will be generated from actual dataset analysis results.</p></div></article>
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
                <article className="panel empty-alerts" style={{ minHeight: 270, height: "auto", padding: 30 }}>
                  <div className="empty-icon"><ShieldCheck size={22} /></div>
                  <b>{selectedPage?.detail ?? "Settings are not configured yet."}</b>
                  <p style={{ maxWidth: 520, lineHeight: 1.7 }}>{selectedPage?.next ?? "Workspace configuration controls will be added after core analysis and storage are connected."}</p>
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
