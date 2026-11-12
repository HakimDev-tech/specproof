import { listSuites } from "@/modules/benchmark/application/suites";

const metrics = [
  { value: "12", label: "Scenarios", note: "Three technical domains" },
  { value: "06", label: "Evaluation axes", note: "Weighted scoring model" },
  { value: "02", label: "Execution modes", note: "Knowledge / evidence" },
];

export default async function Home() {
  const suites = await listSuites();

  return (
    <main id="top" className="publication-shell">
      <header className="masthead">
        <a href="/" className="wordmark" aria-label="SPECProof home">SPEC<span>/</span>PROOF</a>
        <div className="masthead-meta">
          <span>Independent benchmark series</span>
          <span>Vol. 01 / 2026</span>
        </div>
        <a href="/benchmark" className="masthead-link">Run the benchmark <span aria-hidden="true">↗</span></a>
      </header>

      <div className="publication-grid">
        <aside className="side-index" aria-label="Publication index">
          <div className="side-index-stamp">SP<br />01</div>
          <div className="side-index-rule" />
          <p>RESEARCH<br />SYSTEMS<br />RELIABILITY</p>
          <span className="vertical-caption">A FIELD GUIDE TO AGENT EVALUATION</span>
        </aside>

        <div className="main-column">
          <section className="cover-story">
            <div className="cover-kicker">
              <span className="issue-number">01—12</span>
              <span>Evidence-based evaluation / Developer agents</span>
            </div>
            <h1>Can an agent<br />stand behind<br /><em>its answer?</em></h1>
            <div className="cover-bottom">
              <p className="cover-deck">
                A benchmark for technical answers that must survive contact with real documentation,
                changing APIs and version constraints.
              </p>
              <a className="text-link" href="#suite">Read the benchmark <span aria-hidden="true">↘</span></a>
            </div>
            <div className="cover-registration" aria-hidden="true">FIELD<br />NOTES<br /><strong>2026</strong></div>
          </section>

          <section className="metrics-strip" aria-label="Benchmark at a glance">
            {metrics.map((item, index) => (
              <div className="metric" key={item.label}>
                <span className="metric-index">0{index + 1}</span>
                <strong>{item.value}</strong>
                <div>
                  <span className="metric-label">{item.label}</span>
                  <span className="metric-note">{item.note}</span>
                </div>
              </div>
            ))}
          </section>

          <section className="suite-section" id="suite">
            <div className="section-heading">
              <div>
                <div className="section-kicker">The benchmark / Catalogue</div>
                <h2>What gets<br /><em>put to the test.</em></h2>
              </div>
              <p className="section-aside">A fixed set of tasks. A common scoring model. Two execution conditions.</p>
            </div>

            <div className="suite-list">
              {suites.map((suite, index) => (
                <article className="suite-row" key={suite.id}>
                  <span className="suite-number">0{index + 1}</span>
                  <div className="suite-copy">
                    <span className="suite-category">{suite.category}</span>
                    <h3>{suite.name}</h3>
                    <p>{suite.description}</p>
                  </div>
                  <div className="suite-count">
                    <strong>{String(suite.taskCount).padStart(2, "0")}</strong>
                    <span>tasks</span>
                  </div>
                  <span className="suite-version">v{suite.version}</span>
                  <span className="suite-arrow" aria-hidden="true">↗</span>
                </article>
              ))}
            </div>
          </section>

          <footer className="publication-footer">
            <span>SPECProof / Research instrument 001</span>
            <span>Accuracy is a claim. Evidence is the test.</span>
            <a href="#top">Back to top ↑</a>
          </footer>
        </div>
      </div>
    </main>
  );
}
