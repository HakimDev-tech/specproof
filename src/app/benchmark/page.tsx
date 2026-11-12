"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const scenarios = [
  ["api-01","React 19 ref behavior","API correctness"],["api-02","Next.js 15 Route Handler params","API correctness"],["api-03","Drizzle insert returning","API correctness"],["api-04","PostgreSQL JSONB containment","API correctness"],
  ["mig-01","Next.js 15 async request APIs","Breaking changes"],["mig-02","React 19 ref migration","Breaking changes"],["mig-03","Node.js deprecation signals","Breaking changes"],["mig-04","Tailwind CSS v4 migration","Breaking changes"],
  ["doc-01","TypeScript satisfies source discovery","Documentation research"],["doc-02","Next.js version disambiguation","Documentation research"],["doc-03","PostgreSQL evidence boundary","Documentation research"],["doc-04","Insufficient evidence abstention","Documentation research"],
] as const;
type Mode="baseline"|"research";
type State="pending"|"running"|"completed"|"failed";
type Run={mode:Mode;id:string;status:string;completed:number;failed:number;score:number|null;dimensions:Record<string,number>};
type Event={id:number;time:string;level:"info"|"success"|"warning"|"error";message:string};
const timeNow=()=>new Date().toLocaleTimeString("en-GB",{hour12:false});

export default function BenchmarkConsole(){
  const [token,setToken]=useState("");
  const [running,setRunning]=useState(false);
  const [progress,setProgress]=useState(0);
  const [events,setEvents]=useState<Event[]>([]);
  const [runs,setRuns]=useState<Run[]>([]);
  const [error,setError]=useState("");
  const [baseline,setBaseline]=useState(true);
  const [research,setResearch]=useState(true);
  const [health,setHealth]=useState<"checking"|"healthy"|"degraded"|"unknown">("checking");
  const [states,setStates]=useState<Record<string,State>>({});
  const [operation,setOperation]=useState("Waiting for an execution");
  const sequence=useRef(0);
  const logRef=useRef<HTMLDivElement>(null);
  const total=useMemo(()=>12*(Number(baseline)+Number(research)),[baseline,research]);
  const selectedRuns=Number(baseline)+Number(research);
  const latestScore=runs.length?runs[runs.length-1].score:null;

  useEffect(()=>{let active=true;fetch("/api/health",{cache:"no-store"}).then(async r=>{if(!r.ok)throw new Error();const d=await r.json();if(active)setHealth(d?.status==="ok"?"healthy":"degraded");}).catch(()=>{if(active)setHealth("unknown");});return()=>{active=false;};},[]);
  useEffect(()=>{logRef.current?.scrollTo({top:logRef.current.scrollHeight,behavior:"smooth"});},[events]);
  function log(message:string,level:Event["level"]="info"){sequence.current+=1;setEvents(old=>[...old.slice(-199),{id:sequence.current,time:timeNow(),level,message}]);}
  async function api<T>(path:string,method="GET",body?:unknown):Promise<T>{
    const response=await fetch(path,{method,headers:{Authorization:"Bearer "+token,...(body===undefined?{}:{"Content-Type":"application/json"})},...(body===undefined?{}:{body:JSON.stringify(body)}),cache:"no-store"});
    const payload=await response.json().catch(()=>null);if(!response.ok)throw new Error(payload?.error??"HTTP "+response.status);return payload as T;
  }
  async function execute(mode:Mode){
    log("Creating "+mode.toUpperCase()+" experiment");
    const created=await api<{data:{id:string}}>("/api/runs","POST",{mode,name:mode==="baseline"?"OpenRouter Baseline — 12 scenarios":"OpenRouter + Tavily Research — 12 scenarios"});
    const id=created.data.id;log("Run persisted · "+id,"success");let completed=0,failed=0;
    for(const [index,[key,title]] of scenarios.entries()){
      setOperation(mode.toUpperCase()+" / "+String(index+1).padStart(2,"0")+" · "+title);
      setStates(old=>({...old,[key]:"running"}));log("Executing "+key+" · "+title);
      try{const result=await api<{data:{score?:{total?:number}}}>("/api/runs/"+id+"/tasks/"+key,"POST",{});completed++;setStates(old=>({...old,[key]:"completed"}));log(key+" completed · score "+(result.data.score?.total??"not returned"),"success");}
      catch(e){failed++;setStates(old=>({...old,[key]:"failed"}));log(key+" failed · "+(e instanceof Error?e.message:String(e)),"error");}
      setProgress(v=>v+1);
    }
    const details=await api<{data:{status:string;aggregate_score:number|null}}>("/api/runs/"+id);
    const summary={mode,id,status:details.data.status,completed,failed,score:details.data.aggregate_score};setRuns(old=>[...old,summary]);log("Run finalized · "+completed+"/12 completed · "+failed+" failed","success");
  }
  async function start(){
    if(!token.trim()||running||!total)return;
    setRunning(true);setProgress(0);setEvents([]);sequence.current=0;setRuns([]);setError("");setStates({});log("Execution session opened · production API","success");
    try{if(baseline)await execute("baseline");if(research)await execute("research");setOperation("All selected runs finished");log("Selected workload finished","success");}
    catch(e){const message=e instanceof Error?e.message:String(e);setError(message);setOperation("Execution interrupted");log("Execution halted · "+message,"error");}
    finally{setRunning(false);}
  }
  const status=running?"RUNNING":error?"INTERRUPTED":runs.length?"COMPLETE":"READY";
  return <main className="runner-shell">
    <header className="runner-header"><a className="brand" href="/"><span className="brand-symbol">S<span>•</span>P</span><span className="brand-word">SPEC<span>PROOF</span></span></a><nav className="runner-nav"><a href="/">Overview</a><a className="selected" href="/benchmark">Benchmark runner</a></nav><div className="header-actions"><span className={"header-status health-"+health}><i/>{health==="checking"?"CHECKING API":health==="healthy"?"API OPERATIONAL":health==="degraded"?"API DEGRADED":"API UNKNOWN"}</span><a className="text-link" href="/">Exit runner ↗</a></div></header>
    <div className="runner-title"><div><div className="kicker"><span className="kicker-line"/> CONTROLLED EXPERIMENT / PRODUCTION</div><h1>Benchmark <em>runner</em></h1><p>Execute the fixed SPECProof task set against two controlled evidence conditions.</p></div><div className="runner-version"><span>BENCHMARK SUITE</span><b>v1.0.0</b><span>SCENARIOS</span><b>12</b><span>MAX TASK CALLS</span><b>24</b></div></div>
    <div className="runner-layout">
      <aside className="runner-sidebar">
        <section className="sidebar-section"><div className="sidebar-heading"><span>01</span> API AUTHENTICATION <b>REQUIRED</b></div><label htmlFor="api-token">Production API token</label><input id="api-token" type="password" value={token} onChange={e=>setToken(e.target.value)} placeholder="SPECPROOF_API_TOKEN" autoComplete="off" spellCheck={false} disabled={running}/><div className="privacy-note"><span>▣</span> TOKEN IN TAB MEMORY ONLY · HTTPS</div></section>
        <section className="sidebar-section"><div className="sidebar-heading"><span>02</span> EXPERIMENT MODES <b>{total} TASKS</b></div>
          <label className={"mode-card mode-blue "+(baseline?"chosen":"")}><input type="checkbox" checked={baseline} onChange={e=>setBaseline(e.target.checked)} disabled={running}/><span className="fake-check"/><span className="mode-detail"><b>Baseline</b><small>Direct model response</small><em>NO RETRIEVAL</em></span><strong>12</strong></label>
          <label className={"mode-card mode-purple "+(research?"chosen":"")}><input type="checkbox" checked={research} onChange={e=>setResearch(e.target.checked)} disabled={running}/><span className="fake-check"/><span className="mode-detail"><b>Research</b><small>Search + evidence extraction</small><em>TAVILY ENABLED</em></span><strong>12</strong></label>
          <div className="selected-total"><span>SELECTED TASK CALLS</span><b>{String(total).padStart(2,"0")} <small>/ 24</small></b></div>
          <button className="run-button" onClick={start} disabled={running||!token.trim()||total===0}>{running?"EXECUTING…":"Run selected experiments"} <span>{running?<i className="spinner"/>:"↗"}</span></button>
          <p className="write-note">! This action writes experiment records to the production Neon database.</p>
        </section>
        <div className="sidebar-foot"><span>EXECUTION ENDPOINT</span><b>POST /api/runs</b><span>MODEL ROUTING</span><b>OPENROUTER → TAVILY</b></div>
      </aside>
      <section className="runner-main">
        <div className="run-statusbar"><span><i className={running?"pulse-active":""}/> {status}</span><small>RUNNER ID / 001 <b>·</b> LIVE ENVIRONMENT</small></div>
        <div className="kpi-grid">
          <div className="kpi"><span>EXECUTION PROGRESS</span><strong>{String(progress).padStart(2,"0")}<small> / {String(total).padStart(2,"0")}</small></strong><div className="progress-track"><i style={{width:(total?progress/total*100:0)+"%"}}/></div><small>{total?Math.round(progress/total*100):0}% OF SELECTED WORKLOAD</small></div>
          <div className="kpi"><span>PERSISTED RUNS</span><strong>{String(runs.length).padStart(2,"0")}<small> / {selectedRuns}</small></strong><div className="kpi-foot">{runs.length?"DATABASE RECORDS CREATED":"AWAITING EXECUTION"}</div><div className="run-segments">{Array.from({length:selectedRuns},(_,i)=><i key={i} className={runs.length>i?"filled":""}/>)}</div></div>
          <div className="kpi"><span>AGGREGATE SCORE</span><strong>{latestScore===null?"—":latestScore.toFixed(1)}<small>{latestScore===null?" / N/A":" / 100"}</small></strong><div className="kpi-foot">{runs.length?"LATEST PERSISTED RESULT":"NO SCORE GENERATED"}</div></div>
        </div>
        <div className="operation-bar"><div><span>CURRENT OPERATION</span><b>{operation}</b></div><span className={"operation-pill "+(running?"is-running":"")}>{running?"IN PROGRESS":"IDLE"}</span></div>
        {error&&<div className="error-banner"><b>EXECUTION INTERRUPTED</b><span>{error}</span></div>}
        <section className="runner-panel"><div className="panel-heading"><div><small>01 / FIXED TASK SET</small><h2>Scenario manifest</h2></div><span>12 SCENARIOS <i/> 3 DOMAINS</span></div><div className="scenario-table"><div className="scenario-head"><span>KEY</span><span>SCENARIO</span><span>DOMAIN</span><span>STATUS</span></div>{scenarios.map(([key,title,domain])=>{const state=states[key]??"pending";return <div className={"scenario-row state-"+state} key={key}><code>{key}</code><b>{title}</b><span>{domain}</span><em>{state==="pending"?"PENDING":state.toUpperCase()}</em></div>;})}</div></section>
        <section className="runner-panel"><div className="panel-heading"><div><small>02 / LIVE TELEMETRY</small><h2>Execution trace</h2></div><span>{String(events.length).padStart(2,"0")} EVENTS <i/> {running?"STREAMING":"CAPTURED"}</span></div><div className="event-log" ref={logRef}>{events.length===0?<div className="log-empty"><span>⌁</span><div><b>No execution events yet</b><small>Initialization, task transitions and evaluator responses will appear here.</small></div></div>:events.map(e=><div className={"log-row log-"+e.level} key={e.id}><code>{String(e.id).padStart(3,"0")}</code><time>{e.time}</time><i/><span>{e.message}</span></div>)}</div></section>
        {runs.length>0&&<section className="runner-panel"><div className="panel-heading"><div><small>03 / DATABASE OUTPUT</small><h2>Persisted run results</h2></div><div className="results-actions"><span>{runs.length} RECORDS</span><button type="button" onClick={()=>{const blob=new Blob([JSON.stringify({suite:"specproof-core-v1",exportedAt:new Date().toISOString(),runs},null,2)],{type:"application/json"});const url=URL.createObjectURL(blob);const link=document.createElement("a");link.href=url;link.download="specproof-results.json";link.click();URL.revokeObjectURL(url);}}>Export JSON ↗</button></div></div><div className="results-table"><div className="results-head"><span>MODE</span><span>RUN ID</span><span>COMPLETED</span><span>FAILED</span><span>SCORE</span><span>STATUS</span></div>{runs.map(r=><div className="result-group" key={r.id}><div className="results-row"><b className={r.mode==="baseline"?"blue-text":"purple-text"}>{r.mode.toUpperCase()}</b><code title={r.id}>{r.id}</code><span>{r.completed}/12</span><span>{r.failed}</span><strong>{r.score===null?"—":r.score.toFixed(1)}</strong><em>{r.status}</em></div><div className="results-dimensions">{[["Correctness","correctness"],["Evidence","evidence"],["Freshness","freshness"],["Completeness","completeness"],["Efficiency","efficiency"],["Abstention","uncertainty"]].map(([label,key])=><div key={key}><span>{label}</span><b>{r.dimensions[key]??0}</b><i><u style={{width:(r.dimensions[key]??0)+"%"}}/></i></div>)}</div></div>)}</div></section>}
      </section>
    </div>
    <footer className="runner-footer"><span>SPECProof / EVALUATION LAB</span><span>ONE TASK · ONE TRACE · ONE RESULT</span><a href="/">RETURN TO OVERVIEW ↗</a></footer>
  </main>;
}
