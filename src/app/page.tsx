import { listSuites } from "@/modules/benchmark/application/suites";

const dimensions = [
  ["Factual correctness", "30%", "The answer must be technically accurate."],
  ["Evidence quality", "25%", "Claims must be supported by retrieved sources."],
  ["Version freshness", "15%", "The answer must match the relevant API version."],
  ["Completeness", "15%", "All required parts of the task must be addressed."],
  ["Efficiency", "10%", "Measure the cost of reaching a reliable answer."],
  ["Abstention", "05%", "Recognize when available evidence is insufficient."],
];

export default async function Home() {
  const suites = await listSuites();
  return (
    <main className="site-shell">
      <header className="site-header">
        <a href="/" className="brand" aria-label="SPECProof home"><span className="brand-symbol">S<span>•</span>P</span><span className="brand-word">SPEC<span>PROOF</span></span></a>
        <nav className="main-nav"><a className="selected" href="#overview">Overview</a><a href="#benchmarks">Benchmarks</a><a href="#methodology">Methodology</a></nav>
        <div className="header-actions"><span className="header-status"><i/> RESEARCH PREVIEW</span><a className="button button-dark button-small" href="/benchmark">Open benchmark <span>↗</span></a></div>
      </header>

      <section className="hero" id="overview">
        <div className="hero-copy">
          <div className="kicker"><span className="kicker-line"/> INDEPENDENT EVALUATION FOR AI DEVELOPER AGENTS</div>
          <h1>Can your agent<br/>prove it <em>knows?</em></h1>
          <p>SPECProof measures technical accuracy against real documentation, API versions and breaking changes. Every answer is evaluated for correctness, evidence and freshness — not confidence.</p>
          <div className="hero-buttons"><a className="button button-primary" href="/benchmark">Run the benchmark <span>↗</span></a><a className="text-link" href="#methodology">Explore the methodology <span>↓</span></a></div>
          <div className="hero-meta"><span><i/> 12 FIXED SCENARIOS</span><span>·</span><span>2 CONTROLLED CONDITIONS</span><span>·</span><span>6 SCORING DIMENSIONS</span></div>
        </div>
        <div className="hero-board">
          <div className="board-top"><span>SPEC / EVALUATION MATRIX</span><span className="board-live"><i/> SUITE 1.0.0</span></div>
          <div className="board-heading"><div><small>EXPERIMENT DESIGN</small><h2>Same tasks.<br/>Different evidence.</h2></div><span className="board-number">01—12</span></div>
          <div className="matrix-head"><span>TEST DOMAIN</span><span className="baseline-col">BASELINE</span><span className="research-col">RESEARCH</span></div>
          {[
            ["01","API correctness","04 tasks"],
            ["02","Breaking changes","04 tasks"],
            ["03","Documentation research","04 tasks"],
          ].map(([n,name,count])=><div className="matrix-row" key={n}><span className="matrix-index">{n}</span><div className="matrix-domain"><b>{name}</b><small>{count}</small></div><span className="matrix-cell baseline-cell"><i/> NO RETRIEVAL</span><span className="matrix-cell research-cell"><i/> TAVILY</span></div>)}
          <div className="board-foot"><span><i className="dot-blue"/> Direct model response</span><span><i className="dot-violet"/> Search + extract</span></div>
        </div>
      </section>

      <section className="stats-strip" aria-label="Benchmark specification">
        <div><strong>12</strong><span>Fixed scenarios</span><small>3 technical domains</small></div>
        <div><strong>02</strong><span>Execution modes</span><small>Baseline vs. research</small></div>
        <div><strong>06</strong><span>Scoring dimensions</span><small>Weighted rubric / 100 pts</small></div>
        <div className="stats-note"><span className="status-chip"><i/> SPECIFICATION LOCKED</span><small>Version 1.0.0 · November 2026</small></div>
      </section>

      <section className="section-block" id="benchmarks">
        <div className="section-top"><div><div className="kicker"><span className="kicker-line"/> THE TEST SUITE</div><h2>Three domains.<br/><em>Twelve ways to fail.</em></h2></div><p>Each scenario is executed under identical conditions in both modes. The paired design isolates the impact of documentation retrieval.</p></div>
        <div className="suite-list">
          <div className="suite-list-head"><span>REF</span><span>BENCHMARK DOMAIN</span><span>CASES</span><span>SUITE</span><span/></div>
          {suites.map((suite,index)=><a className="suite-item" href="/benchmark" key={suite.id}><span className="suite-ref">0{index+1}</span><div className="suite-title"><b>{suite.name}</b><small>{suite.description}</small></div><span className="suite-count">{String(suite.taskCount).padStart(2,"0")} <small>tasks</small></span><span className="suite-version">v{suite.version}</span><span className="suite-arrow">↗</span></a>)}
        </div>
      </section>

      <section className="method-block" id="methodology">
        <div className="method-copy"><div className="kicker"><span className="kicker-line"/> SCORING / 100 POINTS</div><h2>Fluency isn't<br/>a <em>score.</em></h2><p>We score the properties that make a technical answer dependable: truth, traceable evidence, version compatibility and the ability to say “I don't know”.</p><a className="text-link" href="/benchmark">Inspect the evaluation runner <span>↗</span></a></div>
        <div className="rubric">
          {dimensions.map(([name,weight,description],i)=><div className="rubric-row" key={name}><span className="rubric-num">0{i+1}</span><div className="rubric-info"><b>{name}</b><small>{description}</small></div><div className="rubric-track"><i style={{width:weight}}/></div><strong>{weight}</strong></div>)}
          <div className="rubric-total"><span>WEIGHTED RUBRIC</span><b>100%</b></div>
        </div>
      </section>

      <footer className="site-footer"><a href="/" className="brand"><span className="brand-symbol">S<span>•</span>P</span><span className="brand-word">SPEC<span>PROOF</span></span></a><span>Evidence is the test.</span><span>Independent agent benchmark · 2026</span><a href="/benchmark">Open evaluation ↗</a></footer>
    </main>
  );
}
