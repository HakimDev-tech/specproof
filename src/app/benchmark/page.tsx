"use client";
import { useEffect, useMemo, useRef, useState } from "react";

const scenarios = [
  ["api-01","React 19 ref behavior","API correctness"],["api-02","Next.js 15 Route Handler params","API correctness"],["api-03","Drizzle insert returning","API correctness"],["api-04","PostgreSQL JSONB containment","API correctness"],
  ["mig-01","Next.js 15 async request APIs","Breaking changes"],["mig-02","React 19 ref migration","Breaking changes"],["mig-03","Node.js deprecation signals","Breaking changes"],["mig-04","Tailwind CSS v4 migration","Breaking changes"],
  ["doc-01","TypeScript satisfies source discovery","Documentation research"],["doc-02","Next.js version disambiguation","Documentation research"],["doc-03","PostgreSQL evidence boundary","Documentation research"],["doc-04","Insufficient evidence abstention","Documentation research"],
] as const;
type Mode = "baseline" | "research";
type ScenarioState = "pending" | "running" | "completed" | "failed";
type RunSummary = { mode: Mode; id: string; status: string; completed: number; failed: number; score: number | null };
type EventItem = { id: number; time: string; level: "info" | "success" | "warning" | "error"; message: string };
const clock = () => new Date().toLocaleTimeString("en-GB",{hour12:false});

export default function BenchmarkConsole() {
  const [token,setToken] = useState("");
  const [running,setRunning] = useState(false);
  const [modeLabel,setModeLabel] = useState("Ready to execute");
  const [progress,setProgress] = useState(0);
  const [events,setEvents] = useState<EventItem[]>([]);
  const [runs,setRuns] = useState<RunSummary[]>([]);
  const [error,setError] = useState("");
  const [includeBaseline,setIncludeBaseline] = useState(true);
  const [includeResearch,setIncludeResearch] = useState(true);
  const [density,setDensity] = useState<"compact"|"comfortable">("compact");
  const [health,setHealth] = useState<"checking"|"healthy"|"degraded"|"unknown">("checking");
  const [scenarioStates,setScenarioStates] = useState<Record<string,ScenarioState>>({});
  const eventSequence = useRef(0);
  const logViewport = useRef<HTMLDivElement>(null);
  const total = useMemo(() => (includeBaseline?12:0)+(includeResearch?12:0),[includeBaseline,includeResearch]);
  const latestScore = runs.length ? runs[runs.length-1].score : null;

  useEffect(() => {
    let active=true;
    fetch("/api/health",{cache:"no-store"}).then(async r=>{if(!r.ok) throw new Error("Health unavailable"); const data=await r.json(); if(active)setHealth(data?.status==="ok"?"healthy":"degraded");}).catch(()=>{if(active)setHealth("unknown");});
    return ()=>{active=false;};
  },[]);
  useEffect(()=>{if(logViewport.current)logViewport.current.scrollTo({top:logViewport.current.scrollHeight,behavior:"smooth"});},[events]);

  function emit(message:string,level:EventItem["level"]="info") {
    eventSequence.current+=1;
    const item={id:eventSequence.current,time:clock(),level,message};
    setEvents(current=>[...current.slice(-199),item]);
  }
  async function request<T>(path:string,method="GET",body?:unknown):Promise<T> {
    const response=await fetch(path,{method,headers:{Authorization:"Bearer "+token,...(body===undefined?{}:{"Content-Type":"application/json"})},...(body===undefined?{}:{body:JSON.stringify(body)}),cache:"no-store"});
    const payload=await response.json().catch(()=>null);
    if(!response.ok)throw new Error(payload?.error??"Request failed (HTTP "+response.status+")");
    return payload as T;
  }
  async function executeMode(mode:Mode) {
    emit("Initializing "+mode.toUpperCase()+" run");
    const created=await request<{data:{id:string}}>("/api/runs","POST",{mode,name:mode==="baseline"?"OpenRouter Baseline — 12 scenarios":"OpenRouter + Tavily Research — 12 scenarios"});
    const runId=created.data.id;
    emit("Run persisted · "+runId,"success");
    let completed=0,failed=0;
    for(const [index,[key,title]] of scenarios.entries()) {
      setModeLabel(mode.toUpperCase()+" / "+String(index+1).padStart(2,"0")+" · "+title);
      setScenarioStates(current=>({...current,[key]:"running"}));
      emit("Executing "+key+" · "+title);
      try {
        const result=await request<{data:{score?:{total?:number}}}>("/api/runs/"+runId+"/tasks/"+key,"POST",{});
        completed+=1; setScenarioStates(current=>({...current,[key]:"completed"}));
        emit(key+" completed · score "+(result.data.score?.total??"not returned"),"success");
      } catch(cause) {
        failed+=1; setScenarioStates(current=>({...current,[key]:"failed"}));
        emit(key+" failed · "+(cause instanceof Error?cause.message:String(cause)),"error");
      }
      setProgress(value=>value+1);
    }
    const details=await request<{data:{status:string;aggregate_score:number|null}}>("/api/runs/"+runId);
    const summary={mode,id:runId,status:details.data.status,completed,failed,score:details.data.aggregate_score};
    setRuns(current=>[...current,summary]);
    emit("Run finalized · "+completed+"/12 requests completed · "+failed+" failed · aggregate "+(summary.score??"N/A"),failed?"warning":"success");
  }
  async function start() {
    if(!token.trim()||running||total===0)return;
    setRunning(true);setProgress(0);setEvents([]);eventSequence.current=0;setRuns([]);setError("");setScenarioStates({});
    emit("Execution session opened · production API","success");
    try {
      if(includeBaseline)await executeMode("baseline");
      if(includeResearch)await executeMode("research");
      setModeLabel("All selected runs finished");emit("Selected workload finished","success");
    } catch(cause) {
      const message=cause instanceof Error?cause.message:String(cause);
      setError(message);setModeLabel("Execution interrupted");emit("Execution halted · "+message,"error");
    } finally {setRunning(false);}
  }
  const statusLabel=running?"RUN IN PROGRESS":error?"EXECUTION INTERRUPTED":runs.length?"EXECUTION COMPLETE":"READY TO EXECUTE";

  return <main className="workbench workbench-v2" data-density={density} data-activity={running?"running":runs.length?"complete":"idle"}>
    <div className="ambient-orb ambient-orb-one"/><div className="ambient-orb ambient-orb-two"/>
    <header className="workbench-topbar">
      <a href="/" className="brand-lockup"><span className="brand-mark">S<span>/</span>P</span><span className="brand-name">SPEC<span>PROOF</span></span></a>
      <div className="breadcrumb"><a href="/">Workspace</a><span>/</span><b>Benchmark execution</b></div>
      <div className="topbar-right"><span className={"system-status health-"+health}><i/>{health==="checking"?"CHECKING":health==="healthy"?"API HEALTHY":health==="degraded"?"API DEGRADED":"API UNKNOWN"}</span><a href="/" className="topbar-cta">Exit console <span>↗</span></a></div>
    </header>
    <div className="workbench-heading">
      <div><div className="eyebrow"><span className="eyebrow-line"/> EXECUTION ENVIRONMENT <span className="eyebrow-id">SP / RUNNER 001</span></div><h1>Benchmark <span>runner.</span></h1><p>Controlled experiments for technical accuracy, evidence quality and version compatibility.</p></div>
      <div className="heading-meta"><span>SUITE VERSION</span><b>1.0.0</b><span>SCENARIO COUNT</span><b>12</b><span>MAX EXECUTIONS</span><b>24 / RUN</b></div>
    </div>
    <div className="workbench-toolbar-row"><div className="workbench-context"><span className="context-mark">◈</span><span>EXPERIMENT CONTROL</span><i/><span>PRODUCTION ENVIRONMENT</span></div><div className="density-control" role="group" aria-label="Display density"><button type="button" className={density==="compact"?"active":""} onClick={()=>setDensity("compact")}>Compact</button><button type="button" className={density==="comfortable"?"active":""} onClick={()=>setDensity("comfortable")}>Comfortable</button></div></div>
    <div className="workbench-grid">
      <aside className="control-rail">
        <div className="rail-section"><div className="rail-heading"><span>01</span> AUTHENTICATION <span className="rail-heading-meta">REQUIRED</span></div><label htmlFor="api-token">Production API token</label><input id="api-token" className="token-input" type="password" autoComplete="off" spellCheck={false} placeholder="SPECPROOF_API_TOKEN" value={token} onChange={e=>setToken(e.target.value)} disabled={running}/><div className="security-note" title="Token remains in volatile tab memory and is sent over HTTPS."><span>▣</span> RAM-ONLY <i/> TLS / HTTPS <b>ⓘ</b></div></div>
        <div className="rail-section"><div className="rail-heading"><span>02</span> TEST CONDITIONS <span className="rail-heading-meta">{total} TASKS</span></div>
          <label className={"mode-option mode-baseline "+(includeBaseline?"selected":"")}><input type="checkbox" checked={includeBaseline} onChange={e=>setIncludeBaseline(e.target.checked)} disabled={running}/><span className="mode-radio"/><span className="mode-copy"><b>Baseline</b><small>Without retrieval</small><em>OPENROUTER ONLY</em></span><span className="mode-count">12</span></label>
          <label className={"mode-option mode-research "+(includeResearch?"selected":"")}><input type="checkbox" checked={includeResearch} onChange={e=>setIncludeResearch(e.target.checked)} disabled={running}/><span className="mode-radio"/><span className="mode-copy"><b>Research</b><small>With Tavily evidence</small><em>SEARCH + EXTRACT</em></span><span className="mode-count">12</span></label>
          <div className="selection-summary"><span>SELECTED EXECUTIONS</span><strong>{String(total).padStart(2,"0")} <small>/ 24</small></strong></div>
          <button className="launch-button" type="button" onClick={start} disabled={running||!token.trim()||total===0}><span>{running?"EXECUTING WORKLOAD":"LAUNCH BENCHMARK"}</span><b>{running?<span className="button-spinner"/>:"↗"}</b></button>
          <div className="write-warning"><span>!</span> PRODUCTION WRITE · NEON DATABASE</div>
        </div>
        <div className="rail-footer"><span>EXECUTION API</span><b>/api/runs</b><span>PROVIDER ROUTING</span><b>OPENROUTER → TAVILY</b></div>
        <div className="rail-decoration"><span className="rail-decoration-line"/><span>REPRODUCIBLE BY DESIGN</span><span className="rail-decoration-line"/></div>
      </aside>
      <section className="execution-area">
        <div className="execution-toolbar"><div><span className={"live-indicator "+(running?"is-live":"")}/><b>{statusLabel}</b></div><span className="toolbar-id">RUNNER / 001 <i/> PRODUCTION</span></div>
        <div className="telemetry-grid">
          <div className="telemetry-cell"><span>EXECUTION PROGRESS</span><strong>{String(progress).padStart(2,"0")}<small>/{String(total).padStart(2,"0")}</small></strong><div className="telemetry-track"><i style={{width:(total?progress/total*100:0)+"%"}}/></div><div className="metric-foot">{total?Math.round(progress/total*100):0}% OF SELECTED WORKLOAD</div></div>
          <div className="telemetry-cell"><span>RUNS PERSISTED</span><strong>{String(runs.length).padStart(2,"0")}<small>/{Number(includeBaseline)+Number(includeResearch)}</small></strong><em>{runs.length?"DATABASE UPDATED":"NO RUNS YET"}</em><div className="metric-spark" aria-hidden="true">{Array.from({length:12},(_,i)=><i key={i}/>)}</div></div>
          <div className="telemetry-cell"><span>AGGREGATE SCORE</span><strong>{latestScore!==null?latestScore.toFixed(1):"—"}<small>{latestScore!==null?"/100":"N/A"}</small></strong><em>{runs.length?"LATEST COMPLETED RUN":"AWAITING RESULTS"}</em><div className="score-foot">{runs.length?"PERSISTED RESULT":"NO SCORE GENERATED"}</div></div>
        </div>
        <div className="current-task"><div><span className="micro-label">CURRENT OPERATION</span><b>{modeLabel}</b></div><span className={"operation-state "+(running?"is-running":"")}>{running?"PROCESSING":"IDLE"}</span></div>
        {error&&<div className="execution-error"><b>EXECUTION ERROR</b><span>{error}</span></div>}
        <div className="data-panel"><div className="data-panel-heading"><div><span className="micro-label">01 / TASK MANIFEST</span><h2>Scenario manifest</h2></div><span>12 FIXED CASES <i/> 03 DOMAINS</span></div>
          <div className="scenario-table"><div className="scenario-table-head"><span>KEY</span><span>SCENARIO</span><span>DOMAIN</span><span>STATUS</span></div>
            {scenarios.map(([key,title,category],index)=>{const state=scenarioStates[key]??"pending";return <div className={"scenario-table-row scenario-"+state} key={key} style={{animationDelay:(index*24)+"ms"}}><code>{key}</code><b>{title}</b><span>{category}</span><em>{state==="pending"?"IN SCOPE":state.toUpperCase()}</em></div>;})}
          </div>
        </div>
        <div className="data-panel log-panel"><div className="data-panel-heading"><div><span className="micro-label">02 / EVENT STREAM</span><h2>Execution trace</h2></div><span>{String(events.length).padStart(2,"0")} EVENTS <i/> {running?"STREAMING":"CAPTURED"}</span></div>
          <div className="event-stream" ref={logViewport} aria-label="Execution events">{events.length===0?<div className="empty-stream"><span>⌁</span><div><b>Awaiting first event</b><small>Run initialization, scenario transitions and evaluator responses will appear here.</small></div><span className="empty-orbit"/></div>:events.map(event=><div className={"event-line event-"+event.level} key={event.id}><span className="event-sequence">{String(event.id).padStart(3,"0")}</span><time>{event.time}</time><i/><code>{event.message}</code></div>)}</div>
        </div>
        {runs.length>0&&<div className="data-panel results-panel"><div className="data-panel-heading"><div><span className="micro-label">03 / PERSISTED OUTPUT</span><h2>Run results</h2></div><span>{runs.length} RECORD(S)</span></div><div className="results-table"><div className="results-head"><span>MODE</span><span>RUN ID</span><span>COMPLETED</span><span>FAILED</span><span>SCORE</span><span>STATUS</span></div>{runs.map(run=><div className="results-row" key={run.id}><b className={run.mode==="baseline"?"cyan-text":"amber-text"}>{run.mode.toUpperCase()}</b><code title={run.id}>{run.id}</code><span>{run.completed}/12</span><span>{run.failed}</span><strong>{run.score===null?"—":run.score.toFixed(1)}</strong><em>{run.status}</em></div>)}</div></div>}
      </section>
    </div>
    <footer className="workbench-footer"><span>SPECProof / EXECUTION DESK 001</span><span>ONE TASK · ONE TRACE · ONE RESULT</span><a href="/">RETURN TO OVERVIEW ↗</a></footer>
  </main>;
}
