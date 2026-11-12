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
type RunSummary = {
  mode: Mode;
  id: string;
  status: string;
  completed: number;
  failed: number;
  score: number | null;
};

export default function BenchmarkConsole() {
  const [token, setToken] = useState("");
  const [running, setRunning] = useState(false);
  const [modeLabel, setModeLabel] = useState("Ready");
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [runs, setRuns] = useState<RunSummary[]>([]);
  const [error, setError] = useState("");
  const [includeBaseline, setIncludeBaseline] = useState(true);
  const [includeResearch, setIncludeResearch] = useState(true);

  const total = useMemo(
    () => (includeBaseline ? 12 : 0) + (includeResearch ? 12 : 0),
    [includeBaseline, includeResearch],
  );

  function log(message: string) {
    setLogs((current) => [...current, message]);
  }

  async function request<T>(path: string, method = "GET", body?: unknown): Promise<T> {
    const response = await fetch(path, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      cache: "no-store",
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(payload?.error ?? `Request failed (HTTP ${response.status})`);
    }
    return payload as T;
  }

  async function executeMode(mode: Mode) {
    const created = await request<{ data: { id: string } }>("/api/runs", "POST", {
      mode,
      name: mode === "baseline"
        ? "OpenRouter Baseline — 12 scenarios"
        : "OpenRouter + Tavily Research — 12 scenarios",
    });
    const runId = created.data.id;
    log(`${mode.toUpperCase()} · run ${runId}`);

    let completed = 0;
    let failed = 0;
    for (const [index, [key, title]] of scenarios.entries()) {
      setModeLabel(`${mode === "baseline" ? "Baseline" : "Research"} · ${index + 1}/12 · ${title}`);
      try {
        const result = await request<{ data: { score?: { total?: number }; progress?: { completed: number } } }>(
          `/api/runs/${runId}/tasks/${key}`,
          "POST",
          {},
        );
        completed += 1;
        log(`✓ ${key} · score ${result.data.score?.total ?? "—"}`);
      } catch (cause) {
        failed += 1;
        const message = cause instanceof Error ? cause.message : String(cause);
        log(`× ${key} · ${message}`);
      }
      setProgress((value) => value + 1);
    }

    const details = await request<{ data: { status: string; aggregate_score: number | null } }>(
      `/api/runs/${runId}`,
    );
    const summary = {
      mode,
      id: runId,
      status: details.data.status,
      completed,
      failed,
      score: details.data.aggregate_score,
    };
    setRuns((current) => [...current, summary]);
    log(`${mode.toUpperCase()} finished · ${completed}/12 completed · ${failed} failed · aggregate ${summary.score ?? "not available"}`);
  }

  async function start() {
    if (!token.trim() || running || total === 0) return;
    setRunning(true);
    setProgress(0);
    setLogs([]);
    setRuns([]);
    setError("");
    try {
      if (includeBaseline) await executeMode("baseline");
      if (includeResearch) await executeMode("research");
      setModeLabel("Execution finished");
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : String(cause);
      setError(message);
      setModeLabel("Execution interrupted");
      log(`STOP · ${message}`);
    } finally {
      setRunning(false);
    }
  }

  return (
    <main className="publication-shell console-shell">
      <header className="masthead">
        <a href="/" className="wordmark">SPEC<span>/</span>PROOF</a>
        <div className="masthead-meta"><span>Benchmark operations</span><span>Vol. 01 / 2026</span></div>
        <a href="/" className="masthead-link">← Publication</a>
      </header>

      <section className="console-intro">
        <div className="section-kicker">Execution desk / 001</div>
        <h1>Put the agent<br /><em>to the test.</em></h1>
        <p>Run the 12-scenario suite against OpenRouter, first without retrieval and then with Tavily evidence. Results are written directly to the production database.</p>
      </section>

      <section className="console-panel">
        <div className="console-panel-head">
          <span>01 / Credentials</span>
          <span>Session-only · not stored</span>
        </div>
        <label className="console-label" htmlFor="api-token">Production API token</label>
        <input
          id="api-token"
          className="console-input"
          type="password"
          autoComplete="off"
          spellCheck={false}
          placeholder="Paste SPECPROOF_API_TOKEN"
          value={token}
          onChange={(event) => setToken(event.target.value)}
          disabled={running}
        />
        <p className="console-help">The token stays in this browser tab's memory and is sent over HTTPS to the protected API. It is not saved to your account or database.</p>
      </section>

      <section className="console-panel">
        <div className="console-panel-head"><span>02 / Test conditions</span><span>{total} task executions selected</span></div>
        <label className="console-option">
          <input type="checkbox" checked={includeBaseline} onChange={(event) => setIncludeBaseline(event.target.checked)} disabled={running} />
          <span><strong>Baseline</strong><small>12 scenarios · OpenRouter only · no Tavily retrieval</small></span>
        </label>
        <label className="console-option">
          <input type="checkbox" checked={includeResearch} onChange={(event) => setIncludeResearch(event.target.checked)} disabled={running} />
          <span><strong>Research</strong><small>12 scenarios · Tavily Search + Extract · claim-to-evidence audit</small></span>
        </label>
        <button className="console-run" type="button" onClick={start} disabled={running || !token.trim() || total === 0}>
          {running ? "Execution in progress…" : `Launch ${total} task executions ↗`}
        </button>
        <p className="console-warning">Production execution creates permanent benchmark runs, attempts and evidence records in Neon. Each task is executed once per selected mode.</p>
      </section>

      <section className="console-progress" aria-live="polite">
        <div className="console-panel-head"><span>03 / Execution log</span><span>{progress}/{total || 0}</span></div>
        <div className="progress-track"><span style={{ width: `${total ? (progress / total) * 100 : 0}%` }} /></div>
        <p className="console-status">{modeLabel}</p>
        {error && <p className="console-error">{error}</p>}
        <div className="console-log">
          {logs.length === 0 ? <p>Awaiting launch. The execution trace will appear here.</p> : logs.map((line, index) => <p key={index}>{line}</p>)}
        </div>
      </section>

      {runs.length > 0 && (
        <section className="console-panel console-results">
          <div className="console-panel-head"><span>04 / Persisted results</span><span>{runs.length} run(s)</span></div>
          {runs.map((run) => (
            <div className="result-row" key={run.id}>
              <div><strong>{run.mode.toUpperCase()}</strong><small>{run.id}</small></div>
              <span>{run.completed}/12 completed</span>
              <span>{run.failed} failed</span>
              <strong>{run.score === null ? "—" : run.score.toFixed(1)}</strong>
              <span className="result-status">{run.status}</span>
            </div>
          ))}
        </section>
      )}
      <footer className="publication-footer"><span>SPECProof / Execution desk</span><span>One task. One trace. One result.</span><a href="/">Return to index ↑</a></footer>
    </main>
  );
}
