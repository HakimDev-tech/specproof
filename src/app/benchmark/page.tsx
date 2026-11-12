"use client";

import { useMemo, useState } from "react";

const scenarios = [
  ["api-01", "React 19 ref behavior", "API correctness"],
  ["api-02", "Next.js 15 Route Handler params", "API correctness"],
  ["api-03", "Drizzle insert returning", "API correctness"],
  ["api-04", "PostgreSQL JSONB containment", "API correctness"],
  ["mig-01", "Next.js 15 async request APIs", "Breaking changes"],
  ["mig-02", "React 19 ref migration", "Breaking changes"],
  ["mig-03", "Node.js deprecation signals", "Breaking changes"],
  ["mig-04", "Tailwind CSS v4 migration", "Breaking changes"],
  ["doc-01", "TypeScript satisfies source discovery", "Documentation research"],
  ["doc-02", "Next.js version disambiguation", "Documentation research"],
  ["doc-03", "PostgreSQL evidence boundary", "Documentation research"],
  ["doc-04", "Insufficient evidence abstention", "Documentation research"],
] as const;

type Mode = "baseline" | "research";
type RunSummary = { mode: Mode; id: string; status: string; completed: number; failed: number; score: number | null };

export default function BenchmarkConsole() {
  const [token, setToken] = useState("");
  const [running, setRunning] = useState(false);
  const [modeLabel, setModeLabel] = useState("Ready to execute");
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [runs, setRuns] = useState<RunSummary[]>([]);
  const [error, setError] = useState("");
  const [includeBaseline, setIncludeBaseline] = useState(true);
  const [includeResearch, setIncludeResearch] = useState(true);

  const total = useMemo(() => (includeBaseline ? 12 : 0) + (includeResearch ? 12 : 0), [includeBaseline, includeResearch]);

  function log(message: string) { setLogs((current) => [...current, message]); }

  async function request<T>(path: string, method = "GET", body?: unknown): Promise<T> {
    const response = await fetch(path, {
      method,
      headers: { Authorization: `Bearer ${token}`, ...(body === undefined ? {} : { "Content-Type": "application/json" }) },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      cache: "no-store",
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) throw new Error(payload?.error ?? `Request failed (HTTP ${response.status})`);
    return payload as T;
  }

  async function executeMode(mode: Mode) {
    const created = await request<{ data: { id: string } }>("/api/runs", "POST", {
      mode,
      name: mode === "baseline" ? "OpenRouter Baseline — 12 scenarios" : "OpenRouter + Tavily Research — 12 scenarios",
    });
    const runId = created.data.id;
    log(`RUN CREATED · ${mode.toUpperCase()} · ${runId}`);
    let completed = 0;
    let failed = 0;
    for (const [index, [key, title]] of scenarios.entries()) {
      setModeLabel(`${mode.toUpperCase()} / ${String(index + 1).padStart(2, "0")} · ${title}`);
      try {
        const result = await request<{ data: { score?: { total?: number } } }>(`/api/runs/${runId}/tasks/${key}`, "POST", {});
        completed += 1;
        log(`PASS · ${key} · SCORE ${result.data.score?.total ?? "—"}`);
      } catch (cause) {
        failed += 1;
        const message = cause instanceof Error ? cause.message : String(cause);
        log(`FAIL · ${key} · ${message}`);
      }
      setProgress((value) => value + 1);
    }
    const details = await request<{ data: { status: string; aggregate_score: number | null } }>(`/api/runs/${runId}`);
    const summary = { mode, id: runId, status: details.data.status, completed, failed, score: details.data.aggregate_score };
    setRuns((current) => [...current, summary]);
    log(`RUN FINISHED · ${completed}/12 PASSED · ${failed} FAILED · AGGREGATE ${summary.score ?? "N/A"}`);
  }

  async function start() {
    if (!token.trim() || running || total === 0) return;
    setRunning(true); setProgress(0); setLogs([]); setRuns([]); setError("");
    try {
      if (includeBaseline) await executeMode("baseline");
      if (includeResearch) await executeMode("research");
      setModeLabel("All selected runs finished");
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : String(cause);
      setError(message); setModeLabel("Execution interrupted"); log(`HALTED · ${message}`);
    } finally { setRunning(false); }
  }

  return (
    <main className="workbench">
      <header className="workbench-topbar">
        <a href="/" className="brand-lockup"><span className="brand-mark">S<span>/</span>P</span><span className="brand-name">SPEC<span>PROOF</span></span></a>
        <div className="breadcrumb"><a href="/">Workspace</a><span>/</span><b>Benchmark execution</b></div>
        <div className="topbar-right"><span className="system-status"><i /> PRODUCTION</span><a href="/" className="topbar-cta">Exit console <span>↗</span></a></div>
      </header>

      <div className="workbench-heading">
        <div><div className="eyebrow"><span className="eyebrow-line" /> EXECUTION ENVIRONMENT <span className="eyebrow-id">SP / RUNNER 001</span></div><h1>Benchmark <span>runner.</span></h1><p>Configure the test conditions, then execute the fixed 12-scenario workload against the production API.</p></div>
        <div className="heading-meta"><span>SUITE VERSION</span><b>1.0.0</b><span>SCENARIO COUNT</span><b>12</b><span>MAX EXECUTIONS</span><b>24 / RUN</b></div>
      </div>

      <div className="workbench-grid">
        <aside className="control-rail">
          <div className="rail-section">
            <div className="rail-heading"><span>01</span> AUTHENTICATION <span className="rail-heading-meta">REQUIRED</span></div>
            <label htmlFor="api-token">Production API token</label>
            <input id="api-token" className="token-input" type="password" autoComplete="off" spellCheck={false} placeholder="SPECPROOF_API_TOKEN" value={token} onChange={(event) => setToken(event.target.value)} disabled={running} />
            <div className="security-note" title="The token remains in this tab's volatile memory and is sent to the API over HTTPS. It is not persisted."><span>▣</span> RAM-ONLY <i /> TLS / HTTPS <b>ⓘ</b></div>
          </div>

          <div className="rail-section">
            <div className="rail-heading"><span>02</span> TEST CONDITIONS <span className="rail-heading-meta">{total} TASKS</span></div>
            <label className={`mode-option mode-baseline ${includeBaseline ? "selected" : ""}`}>
              <input type="checkbox" checked={includeBaseline} onChange={(event) => setIncludeBaseline(event.target.checked)} disabled={running} />
              <span className="mode-radio" />
              <span className="mode-copy"><b>Baseline</b><small>Without retrieval</small><em>OPENROUTER ONLY</em></span>
              <span className="mode-count">12</span>
            </label>
            <label className={`mode-option mode-research ${includeResearch ? "selected" : ""}`}>
              <input type="checkbox" checked={includeResearch} onChange={(event) => setIncludeResearch(event.target.checked)} disabled={running} />
              <span className="mode-radio" />
              <span className="mode-copy"><b>Research</b><small>With Tavily evidence</small><em>SEARCH + EXTRACT</em></span>
              <span className="mode-count">12</span>
            </label>
            <div className="selection-summary"><span>SELECTED EXECUTIONS</span><strong>{total.toString().padStart(2, "0")} <small>/ 24</small></strong></div>
            <button className="launch-button" type="button" onClick={start} disabled={running || !token.trim() || total === 0}>
              <span>{running ? "EXECUTING WORKLOAD" : "LAUNCH BENCHMARK"}</span><b>{running ? "…" : "↗"}</b>
            </button>
            <div className="write-warning"><span>!</span> PRODUCTION WRITE · NEON DATABASE</div>
          </div>

          <div className="rail-footer"><span>EXECUTION API</span><b>/api/runs</b><span>PROVIDER ROUTING</span><b>OPENROUTER → TAVILY</b></div>
        </aside>

        <section className="execution-area" aria-live="polite">
          <div className="execution-toolbar"><div><span className="live-indicator" /><b>{running ? "RUN IN PROGRESS" : error ? "EXECUTION INTERRUPTED" : runs.length ? "EXECUTION COMPLETE" : "READY TO EXECUTE"}</b></div><span className="toolbar-id">RUNNER / 001 <i /> PRODUCTION</span></div>
          <div className="telemetry-grid">
            <div className="telemetry-cell"><span>EXECUTION PROGRESS</span><strong>{progress.toString().padStart(2, "0")}<small>/{total.toString().padStart(2, "0")}</small></strong><div className="telemetry-track"><i style={{ width: `${total ? (progress / total) * 100 : 0}%` }} /></div></div>
            <div className="telemetry-cell"><span>RUNS PERSISTED</span><strong>{runs.length.toString().padStart(2, "0")}<small>/02</small></strong><em>{runs.length ? "DATABASE UPDATED" : "NO RUNS YET"}</em></div>
            <div className="telemetry-cell"><span>AGGREGATE SCORE</span><strong>{runs.length && runs[runs.length - 1].score !== null ? runs[runs.length - 1].score!.toFixed(1) : "—"}<small>{runs.length ? "/100" : "N/A"}</small></strong><em>{runs.length ? "LATEST COMPLETED RUN" : "AWAITING RESULTS"}</em></div>
          </div>

          <div className="current-task"><div><span className="micro-label">CURRENT OPERATION</span><b>{modeLabel}</b></div><span className={`operation-state ${running ? "is-running" : ""}`}>{running ? "PROCESSING" : "IDLE"}</span></div>
          {error && <div className="execution-error"><b>EXECUTION ERROR</b><span>{error}</span></div>}

          <div className="data-panel">
            <div className="data-panel-heading"><div><span className="micro-label">01 / TASK MANIFEST</span><h2>Scenario queue</h2></div><span>12 FIXED CASES <i /> 03 DOMAINS</span></div>
            <div className="scenario-table">
              <div className="scenario-table-head"><span>KEY</span><span>SCENARIO</span><span>DOMAIN</span><span>STATUS</span></div>
              {scenarios.map(([key, title, category]) => (
                <div className="scenario-table-row" key={key}><code>{key}</code><b>{title}</b><span>{category}</span><em>IN SCOPE</em></div>
              ))}
            </div>
          </div>

          <div className="data-panel log-panel">
            <div className="data-panel-heading"><div><span className="micro-label">02 / EVENT STREAM</span><h2>Execution trace</h2></div><span>{logs.length.toString().padStart(2, "0")} EVENTS <i /> LIVE</span></div>
            <div className="event-stream">
              {logs.length === 0 ? <div className="empty-stream"><span>⌁</span><div><b>No events recorded</b><small>Execution output will appear here when the runner starts.</small></div></div> : logs.map((line, index) => <div className="event-line" key={index}><span>{String(index + 1).padStart(3, "0")}</span><code className={line.startsWith("FAIL") || line.startsWith("HALTED") ? "event-failed" : line.startsWith("PASS") ? "event-passed" : ""}>{line}</code></div>)}
            </div>
          </div>

          {runs.length > 0 && <div className="data-panel results-panel"><div className="data-panel-heading"><div><span className="micro-label">03 / PERSISTED OUTPUT</span><h2>Run results</h2></div><span>{runs.length} RECORD(S)</span></div><div className="results-table"><div className="results-head"><span>MODE</span><span>RUN ID</span><span>COMPLETED</span><span>FAILED</span><span>SCORE</span><span>STATUS</span></div>{runs.map((run) => <div className="results-row" key={run.id}><b className={run.mode === "baseline" ? "cyan-text" : "amber-text"}>{run.mode.toUpperCase()}</b><code>{run.id}</code><span>{run.completed}/12</span><span>{run.failed}</span><strong>{run.score === null ? "—" : run.score.toFixed(1)}</strong><em>{run.status}</em></div>)}</div></div>}
        </section>
      </div>
      <footer className="workbench-footer"><span>SPECProof / EXECUTION DESK 001</span><span>ONE TASK · ONE TRACE · ONE RESULT</span><a href="/">RETURN TO OVERVIEW ↗</a></footer>
    </main>
  );
}