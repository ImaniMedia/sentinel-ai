"use client";

import { useState } from "react";
import {
  Activity, AlertTriangle, ArrowDownRight, ArrowUpRight, Bell,
  BrainCircuit, ChevronDown, CircleHelp, FileUp, Gauge, LayoutDashboard,
  LockKeyhole, Menu, Network, Search, Settings, Shield, ShieldCheck,
  SlidersHorizontal, Sparkles, X,
} from "lucide-react";

const navigation = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "AI Predictions", icon: BrainCircuit },
  { label: "Threat Alerts", icon: AlertTriangle },
  { label: "Datasets", icon: FileUp },
  { label: "Model Performance", icon: Gauge },
  { label: "Research Lab", icon: SlidersHorizontal },
];

const metrics = [
  { label: "Records analysed", value: "—", note: "No dataset analysed yet", icon: Network },
  { label: "Threats identified", value: "—", note: "Awaiting analysis", icon: ShieldAlertIcon },
  { label: "Anomalies detected", value: "—", note: "Awaiting analysis", icon: Activity },
  { label: "Model F1 score", value: "—", note: "Not evaluated yet", icon: BrainCircuit },
];

function ShieldAlertIcon({ size = 20 }: { size?: number }) {
  return <ShieldCheck size={size} />;
}

export default function Home() {
  const [active, setActive] = useState("Overview");
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <main className="app-shell">
      <aside className={`sidebar ${menuOpen ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-mark"><Shield size={21} strokeWidth={2.4} /></div>
          <div><strong>sentinel<span>.</span>ai</strong><small>THREAT INTELLIGENCE</small></div>
          <button className="mobile-close" onClick={() => setMenuOpen(false)} aria-label="Close menu"><X size={18} /></button>
        </div>
        <div className="workspace-label">WORKSPACE</div>
        <nav className="nav-list">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.label} onClick={() => { setActive(item.label); setMenuOpen(false); }} className={`nav-item ${active === item.label ? "active" : ""}`}>
                <Icon size={18} /><span>{item.label}</span>
                {item.label === "Threat Alerts" && <i className="nav-dot" />}
              </button>
            );
          })}
        </nav>
        <div className="sidebar-bottom">
          <div className="environment-card"><span className="status-dot" /><div><b>Research environment</b><small>Offline dataset mode</small></div></div>
          <button className="nav-item"><Settings size={18} /><span>Settings</span></button>
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
          <div className="welcome-row">
            <div>
              <div className="eyebrow"><Sparkles size={14} /> SECURITY RESEARCH WORKSPACE</div>
              <h1>{active === "Overview" ? "Security overview" : active}</h1>
              <p>Understand your network activity. Find what deserves a closer look.</p>
            </div>
            <button className="date-button"><Activity size={15} /> Offline analysis <ChevronDown size={15} /></button>
          </div>

          <div className="notice"><LockKeyhole size={17} /><p><b>Research environment is ready.</b> Metrics and alerts will appear after you upload and analyse a dataset. Nothing here is simulated.</p></div>

          <div className="section-heading"><div><h2>Workspace snapshot</h2><p>Results from your analysed datasets</p></div><button className="subtle-button"><SlidersHorizontal size={15} /> Customize</button></div>
          <div className="metric-grid">
            {metrics.map((metric) => {
              const Icon = metric.icon;
              return <article className="metric-card" key={metric.label}><div className="metric-top"><span>{metric.label}</span><i><Icon size={18} /></i></div><div className="metric-value">{metric.value}</div><div className="metric-note">{metric.note}</div></article>;
            })}
          </div>

          <div className="dashboard-grid">
            <article className="panel activity-panel">
              <div className="panel-heading"><div><h2>Traffic analysis</h2><p>Dataset activity over time</p></div><span className="empty-chip">No data yet</span></div>
              <div className="empty-chart"><div className="chart-grid"><span /><span /><span /><span /></div><div className="chart-empty-icon"><Activity size={25} /></div><b>Your analysis timeline will appear here</b><p>Upload a labelled network-flow CSV to get started.</p></div>
              <div className="chart-legend"><span><i className="legend-blue" /> Records analysed</span><span><i className="legend-orange" /> Flagged anomalies</span></div>
            </article>
            <article className="panel alerts-panel">
              <div className="panel-heading"><div><h2>Recent threat alerts</h2><p>Items requiring analyst review</p></div><button className="text-button" onClick={() => setActive("Threat Alerts")}>View all <ArrowUpRight size={14} /></button></div>
              <div className="empty-alerts"><div className="empty-icon"><ShieldCheck size={22} /></div><b>No alerts to review</b><p>Alerts will be generated from actual dataset analysis results.</p></div>
            </article>
          </div>

          <div className="bottom-grid">
            <article className="panel quick-panel"><div className="panel-heading"><div><h2>Get started</h2><p>Run your first network traffic analysis</p></div><Sparkles size={18} className="muted-icon" /></div><button className="upload-tile" onClick={() => setActive("Datasets")}><span className="upload-icon"><FileUp size={20} /></span><span><b>Manage datasets</b><small>Inspect and prepare a CSV dataset</small></span><ArrowUpRight size={17} /></button><button className="upload-tile" onClick={() => setActive("Research Lab")}><span className="upload-icon purple"><BrainCircuit size={20} /></span><span><b>Explore model experiments</b><small>Review the ML research pipeline</small></span><ArrowUpRight size={17} /></button></article>
            <article className="panel model-panel"><div className="panel-heading"><div><h2>Model readiness</h2><p>Implementation status</p></div><span className="empty-chip">In development</span></div><div className="model-row"><span><i className="model-indicator ready" /> Random Forest classifier</span><small>Code added</small></div><div className="model-row"><span><i className="model-indicator ready" /> Isolation Forest detector</span><small>Code added</small></div><div className="model-row"><span><i className="model-indicator pending" /> Dataset-specific evaluation</span><small>Pending</small></div><div className="model-row"><span><i className="model-indicator pending" /> Model version registry</span><small>Pending</small></div></article>
          </div>
          <footer>Sentinel AI <span>·</span> Evidence-led security research <span>·</span> Offline dataset analysis</footer>
        </div>
      </section>
    </main>
  );
}
