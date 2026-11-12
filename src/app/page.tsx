import { listSuites } from "@/modules/benchmark/application/suites";

const metrics = [
  { value: "12", label: "Benchmark scenarios", note: "Fixed task set" },
  { value: "06", label: "Scoring dimensions", note: "Weighted evaluation" },
  { value: "02", label: "Execution conditions", note: "Without / with retrieval" },
];

const dimensions = [
  ["Correctness", "30%"],
  ["Evidence quality", "25%"],
  ["Freshness", "15%"],
  ["Completeness", "15%"],
  ["Efficiency", "10%"],
  ["Abstention", "05%"],
];

export default async function Home() {
  const suites = await listSuites();
  return (
    <main className="app-shell">
      <header className="topbar">
        <a href="/" className="brand-lockup" aria-label="SPECProof home">
          <span className="brand-mark">S<span>/</span>P</span>
          <span className="brand-name">SPEC<span>PROOF</span></span>
        </a>
        <nav className="topnav" aria-label="Main navigation">
          <a className="active" href="#overview">Overview</a>
          <a href="#methodology">Methodology</a>
          <a href="#scenarios">Scenarios <span className="nav-count">12</span></a>
        </nav>
        <div className="topbar-right">
          <span className="system-status"><i /> Research instrument</span>
          <a href="/benchmark" className="topbar-cta">Open benchmark <span>↗</span></a>
        </div>
      </header>

      <section className="hero-grid" id="overview">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-line" /> INDEPENDENT AGENT EVALUATION <span className="eyebrow-id">SP / 001</span></div>
          <h1>Answers are easy.<br /><span>Proof is harder.</span></h1>
          <p className="hero-description">SPECProof evaluates whether AI developer agents can produce technically correct answers, grounded in current documentation and compatible with real-world versions.</p>
          <div className="hero-actions">
            <a className="button-primary" href="/benchmark">Run evaluation <span>↗</span></a>
            <a className="button-secondary" href="#methodology">Explore methodology <span>↓</span></a>
          </div>
          <div className="hero-footnote"><span className="tiny-dot" /> FIXED SCENARIOS <b>·</b> REPRODUCIBLE CONDITIONS <b>·</b> EVIDENCE AUDIT</div>
        </div>

        <div className="instrument-preview" aria-label="Benchmark structure preview">
          <div className="preview-topline">
            <span><i className="window-dot" /> SPEC / BENCHMARK OVERVIEW</span>
            <span className="preview-code">INSTRUMENT 001</span>
          </div>
          <div className="preview-title-row">
            <div><span className="micro-label">EVALUATION MATRIX</span><h2>Two conditions.<br />One task set.</h2></div>
            <span className="preview-index">01—12</span>
          </div>
          <div className="condition-head">
            <span>SCENARIO GROUP</span><span className="cyan-label">01 / BASELINE</span><span className="amber-label">02 / RESEARCH</span>
          </div>
          {[
            ["01", "API correctness", "04 tasks"],
            ["02", "Breaking changes", "04 tasks"],
            ["03", "Documentation research", "04 tasks"],
          ].map((item) => (
            <div className="condition-row" key={item[0]}>
              <span className="condition-index">{item[0]}</span>
              <span className="condition-name">{item[1]}<small>{item[2]}</small></span>
              <span className="condition-cell"><i className="cyan-mark" /> <b>RUN</b></span>
              <span className="condition-cell"><i className="amber-mark" /> <b>RUN</b></span>
            </div>
          ))}
          <div className="preview-bottom">
            <span><i className="cyan-mark" /> No retrieval</span>
            <span><i className="amber-mark" /> Tavily evidence</span>
            <span className="preview-bottom-note">SAME 12 SCENARIOS</span>
          </div>
        </div>
      </section>

      <section className="metric-rail" aria-label="Benchmark at a glance">
        {metrics.map((item, index) => (
          <div className="metric-cell" key={item.label}>
            <span className="metric-ordinal">0{index + 1}</span>
            <strong>{item.value}</strong>
            <div><b>{item.label}</b><small>{item.note}</small></div>
          </div>
        ))}
        <div className="metric-rail-note"><span className="status-pulse" /> SPECIFICATION LOCKED <small>v1.0 / 2026</small></div>
      </section>

      <section className="content-section" id="scenarios">
        <div className="section-heading">
          <div><div className="eyebrow"><span className="eyebrow-line" /> TEST COVERAGE / 12 CASES</div><h2>Where agents<br /><span>get tested.</span></h2></div>
          <p>Three technical domains. Four scenarios per domain. The same fixed workload is evaluated under both retrieval conditions.</p>
        </div>
        <div className="suite-table">
          <div className="suite-table-head"><span>REF</span><span>DOMAIN / TEST SUITE</span><span>SCENARIOS</span><span>VERSION</span><span /></div>
          {suites.map((suite, index) => (
            <a className="suite-table-row" href="/benchmark" key={suite.id}>
              <span className="suite-ref">0{index + 1}</span>
              <span className="suite-main"><b>{suite.name}</b><small>{suite.description}</small></span>
              <span className="suite-scenarios"><b>{String(suite.taskCount).padStart(2, "0")}</b><small>tasks</small></span>
              <span className="suite-version">v{suite.version}</span>
              <span className="suite-open">↗</span>
            </a>
          ))}
        </div>
      </section>

      <section className="method-section" id="methodology">
        <div className="method-intro">
          <div className="eyebrow"><span className="eyebrow-line" /> SCORING MODEL / 100 POINTS</div>
          <h2>Measure more<br />than <span>fluency.</span></h2>
          <p>A weighted rubric examines correctness, supporting evidence and operational usefulness—not just whether an answer sounds convincing.</p>
        </div>
        <div className="weight-list">
          {dimensions.map(([name, weight], index) => (
            <div className="weight-row" key={name}>
              <span className="weight-index">0{index + 1}</span><b>{name}</b>
              <div className="weight-track"><i style={{ width: weight }} /></div>
              <strong>{weight}</strong>
            </div>
          ))}
          <div className="weight-footnote">WEIGHTS TOTAL 100% <span>·</span> LLM-ASSISTED EVALUATION</div>
        </div>
      </section>

      <footer className="site-footer">
        <a href="/" className="footer-brand">SPEC<span>/</span>PROOF</a>
        <span>Independent benchmark series · 2026</span>
        <span>Accuracy is a claim. Evidence is the test.</span>
        <a href="/benchmark">Open evaluation desk ↗</a>
      </footer>
    </main>
  );
}