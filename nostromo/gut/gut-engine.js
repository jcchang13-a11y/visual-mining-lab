/* NOSTROMO GUT v0.2 — deterministic auditable metabolic router */
(function(root){
  const DESTINATIONS=['SHROOMING','MUTHER','DROPLET','VAJRA','HOLD'];
  function flatten(value,out,path,provenance){
    out=out||[]; path=path||'root'; provenance=provenance||{};
    if(value===null||value===undefined){out.push({path,value:null,provenance});return out;}
    if(typeof value==='string'||typeof value==='number'||typeof value==='boolean'){out.push({path,value,provenance});return out;}
    if(Array.isArray(value)){value.forEach((v,i)=>flatten(v,out,`${path}[${i}]`,provenance));return out;}
    if(typeof value==='object'){
      const nextProv={...provenance};
      for(const k of ['source','executor','organ','action','status','url','sourceClass','fingerprint','sourceFingerprint','provenanceFingerprint']){
        if(value[k]!==undefined&&value[k]!==null)nextProv[k]=String(value[k]).slice(0,240);
      }
      Object.keys(value).forEach(k=>flatten(value[k],out,`${path}.${k}`,nextProv));return out;
    }
    return out;
  }
  function textOf(atom){return String(atom.value??'').trim();}
  function classify(atom){
    const text=textOf(atom), lower=text.toLowerCase(), path=atom.path.toLowerCase();
    if(text.length<3||/^(none|—|-|null|undefined)$/i.test(text))return {type:'LOW_SIGNAL',status:'EXCRETE',route:'HOLD',priority:0,reason:'low-signal'};
    if(/failed|error|rejected|invalid|poison|corrupt|quarantine|untrusted/i.test(lower+path))return {type:'RISK_OR_FAILURE',status:'QUARANTINE',route:'HOLD',priority:5,reason:'failure-or-risk-marker'};
    if(/contradict|counterevidence|refut|conflict|disagree|反例|矛盾|衝突|反證/i.test(lower+path))return {type:'CONTRADICTION',status:'ROUTE',route:'VAJRA',priority:5,reason:'counterevidence-or-conflict'};
    if(/question|unresolved|why|how|what|誰|什麼|為何|如何|問題/i.test(lower+path)||/[?？]$/.test(text))return {type:'QUESTION',status:'ROUTE',route:'SHROOMING',priority:4,reason:'question-or-unresolved'};
    if(/claim|hypothesis|position|assert|finding|判斷|命題|假設|主張/i.test(lower+path))return {type:'CLAIM',status:'ROUTE',route:'DROPLET',priority:4,reason:'claim-needs-evidence'};
    if(/evidence|source|citation|provenance|statuscode|returnedcount|hitcount|證據|來源/i.test(lower+path))return {type:'EVIDENCE_OR_PROVENANCE',status:'ABSORB',route:'MUTHER',priority:4,reason:'evidence-or-provenance'};
    if(/uncertain|indeterminate|unknown|partial|ambiguous|不確定|未知|部分/i.test(lower+path))return {type:'UNCERTAINTY',status:'HOLD',route:'HOLD',priority:3,reason:'uncertainty-preserved'};
    if(/memory|history|previousround|carry|trace|round/i.test(lower+path))return {type:'HISTORY',status:'ABSORB',route:'SHROOMING',priority:2,reason:'history-or-memory'};
    if(/request|action|execute|task|directive|next/i.test(lower+path))return {type:'ACTION',status:'ROUTE',route:'MUTHER',priority:3,reason:'actionable-material'};
    return {type:'MATERIAL',status:'ABSORB',route:'HOLD',priority:1,reason:'general-material'};
  }
  function digest(input,options){
    options=options||{};
    const source=options.source||'unknown';
    const atoms=flatten(input,[],'root',{inputSource:source}).filter(x=>textOf(x)!=='');
    const seen=new Set(),items=[],waste=[],quarantine=[],hold=[],nutrients=[];
    const routes=Object.fromEntries(DESTINATIONS.map(k=>[k,[]]));
    for(const atom of atoms){
      const text=textOf(atom), key=text.toLowerCase();
      if(seen.has(key)){
        const item={...atom,text,type:'DUPLICATE',status:'EXCRETE',route:'HOLD',priority:0,reason:'duplicate'};
        waste.push(item); items.push(item); continue;
      }
      seen.add(key);
      const meta=classify(atom); const item={...atom,text,...meta}; items.push(item);
      if(meta.status==='EXCRETE')waste.push(item);
      else if(meta.status==='QUARANTINE'){quarantine.push(item);routes.HOLD.push(item);}
      else if(meta.status==='HOLD'){hold.push(item);routes.HOLD.push(item);nutrients.push(item);}
      else {nutrients.push(item);routes[meta.route].push(item);}
    }
    const ranked=[...nutrients].sort((a,b)=>b.priority-a.priority||a.path.localeCompare(b.path));
    const summary=ranked.slice(0,12).map(x=>`[${x.type}->${x.route}] ${x.text}`).join(' · ');
    const counts={}; for(const item of items)counts[item.type]=(counts[item.type]||0)+1;
    return {
      organ:'GUT',version:'0.2',source,
      mode:'DETERMINISTIC_HEURISTIC_ROUTER',
      ingested:atoms.length,absorbed:nutrients.length,excreted:waste.length,quarantined:quarantine.length,held:hold.length,
      typeCounts:counts,
      routes:Object.fromEntries(Object.entries(routes).map(([k,v])=>[k,{count:v.length,items:v.slice(0,24)}])),
      nutrients:ranked.slice(0,80),waste:waste.slice(0,80),quarantine:quarantine.slice(0,80),hold:hold.slice(0,80),
      summary,
      boundary:'Deterministic heuristic metabolism only. Classification/routing is auditable but not semantic truth. Provenance-bearing fields are propagated into atom records; suspected failures are quarantined; uncertainty is held rather than upgraded to truth.'
    };
  }
  root.GutEngine={digest};
})(typeof window!=='undefined'?window:globalThis);
