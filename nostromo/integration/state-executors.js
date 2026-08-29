/* NOSTROMO published-state executors v0.3.1 — real computation, explicitly not remote organ execution */
(function(root){
  const PATHS={
    shrooming:'../../mycelium/state.json',
    muther:'../../mother-latest.json',
    droplet:'../droplet-state.json'
  };
  const cache=new Map();
  async function load(organ){
    const path=PATHS[organ];
    if(!path)throw new Error('NO_STATE_PATH');
    const r=await fetch(path,{cache:'no-store'});
    if(!r.ok)throw new Error(`${organ}: HTTP ${r.status}`);
    const data=await r.json();
    cache.set(organ,{loadedAt:new Date().toISOString(),data});
    return data;
  }
  function compact(text,n=700){return String(text??'').replace(/\s+/g,' ').trim().slice(0,n);}
  function shroomInspect(state,payload={}){
    const hotspots=Array.isArray(state.hotspots)?state.hotspots:[];
    const ranked=hotspots.map((h,i)=>({index:i,id:h.id||null,role:h.role||null,text:compact(h.text,420),life:h.life||null}));
    return {
      executor:'SHROOMING_PUBLISHED_STATE',
      boundary:'INSPECTS_PUBLISHED_STATE_ONLY; DOES_NOT RUN AGENTS',
      stateVersion:state.metrics?.version||state.day||null,
      updatedAt:state.updatedAt||null,
      question:compact(payload.question,300)||null,
      headline:compact(state.report?.headline,500)||null,
      summary:compact(state.report?.summary,900)||null,
      candidate:ranked[0]||null,
      hotspots:ranked.slice(0,4),
      releaseDecision:state.metrics?.releaseDecision||null
    };
  }
  function mutherAudit(state,payload={}){
    return {
      executor:'MUTHER_PUBLISHED_STATE',
      boundary:'AUDITS_PUBLISHED_MINING_STATE_ONLY; DOES_NOT START A NEW MINE RUN',
      updatedAt:state.updatedAt||null,
      phase:state.phase||null,
      requestedCandidate:compact(payload.candidate,700)||null,
      terminus:{status:state.terminus?.status||null,finding:compact(state.terminus?.finding,900)||null,candidate:compact(state.terminus?.candidate,900)||null,next:compact(state.terminus?.next,500)||null},
      uncultured:{status:state.uncultured?.status||null,finding:compact(state.uncultured?.finding,700)||null,next:compact(state.uncultured?.next,500)||null}
    };
  }
  function dropletAudit(state,payload={}){
    const results=Array.isArray(state.results)?state.results:[];
    return {
      executor:'DROPLET_PUBLISHED_EVIDENCE',
      boundary:'AUDITS_PUBLISHED_EVIDENCE_ONLY; DOES NOT PERFORM A NEW WEB SEARCH',
      updatedAt:state.updatedAt||null,
      mission:state.currentMission||null,
      claim:compact(payload.claim,800)||null,
      summary:compact(state.summary,1000)||null,
      evidenceCount:results.length,
      evidence:results.slice(0,8).map(x=>({title:x.title||null,source:x.source||null,date:x.date||null,note:compact(x.note,500),url:x.url||null}))
    };
  }
  async function execute(organ,action,payload){
    const state=await load(organ);
    if(organ==='shrooming'&&action==='INSPECT_STATE')return shroomInspect(state,payload);
    if(organ==='muther'&&action==='AUDIT_STATE')return mutherAudit(state,payload);
    if(organ==='droplet'&&action==='AUDIT_EVIDENCE')return dropletAudit(state,payload);
    if(action==='READ_STATE')return {executor:'PUBLISHED_STATE_READ',boundary:'READ_ONLY',organ,updatedAt:state.updatedAt||null,state};
    throw new Error('UNSUPPORTED_STATE_EXECUTION');
  }
  root.NostromoStateExecutors={execute,load,cache,paths:PATHS};
})(typeof window!=='undefined'?window:globalThis);
