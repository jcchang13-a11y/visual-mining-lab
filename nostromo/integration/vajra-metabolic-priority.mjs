// VAJRA metabolic-priority bridge v0.1.0
// Deterministic, auditable reprioritization only: GUT signals may change which open VAJRA branch is inspected next, never close or validate a branch.

const LENS_SIGNAL_WEIGHTS={
  CONTRADICTION:{counterexample:7,evidence:6,alternative_cause:5,scope:3,category_error:2},
  RISK_OR_FAILURE:{evidence:6,scope:5,source_quality:4,counterexample:4,criterion:2},
  UNCERTAINTY:{scope:7,criterion:6,measurement:5,definition_boundary:5,evidence:3},
  EVIDENCE_OR_PROVENANCE:{source_quality:7,evidence:6,measurement:5,scope:2},
  QUESTION:{definition_boundary:6,scope:6,counterfactual:5,criterion:4},
  CLAIM:{evidence:7,counterexample:6,scope:4,excluded_alternative:3},
  HISTORY:{self_reference:6,scope:5,criterion:2},
  ACTION:{criterion:4,scope:3,evidence:2},
  MATERIAL:{scope:2,criterion:1}
};

function clean(v){return String(v??'').replace(/\s+/g,' ').trim();}
function fnv(text){let h=2166136261;for(const ch of clean(text)){h^=ch.codePointAt(0);h=Math.imul(h,16777619)>>>0;}return h.toString(16).padStart(8,'0');}
function openBranches(vajraResult){return (vajraResult?.unresolved||[]).filter(b=>b&&b.status!=='RESOLVED_BY_RECEIPT');}
function metabolicSignals(metabolic){
  const signals=[];
  for(const item of metabolic?.items||[]){
    const type=clean(item?.type||'MATERIAL').toUpperCase();
    if(type==='LOW_SIGNAL'||type==='DUPLICATE')continue;
    signals.push({
      type,
      priority:Number.isFinite(Number(item?.priority))?Number(item.priority):0,
      route:clean(item?.route||'HOLD').toUpperCase(),
      path:clean(item?.path),
      provenance:{...(item?.provenance||{})}
    });
  }
  return signals;
}
function signalFingerprint(signals){return fnv(JSON.stringify(signals.map(s=>({type:s.type,priority:s.priority,route:s.route,path:s.path,provenance:s.provenance}))));}
function scoreBranch(branch,signals,index){
  let score=0;const reasons=[];
  for(const signal of signals){
    const weights=LENS_SIGNAL_WEIGHTS[signal.type]||LENS_SIGNAL_WEIGHTS.MATERIAL;
    const w=Number(weights[branch.lens]||0);
    if(w>0){const contribution=w+Math.min(3,Math.max(0,signal.priority));score+=contribution;reasons.push({signalType:signal.type,route:signal.route,contribution});}
    if(signal.route==='DROPLET'&&['evidence','counterexample','source_quality','measurement','alternative_cause'].includes(branch.lens)){score+=2;reasons.push({signalType:'ROUTE_DROPLET',route:signal.route,contribution:2});}
    if(signal.route==='SHROOMING'&&['scope','criterion','definition_boundary','counterfactual','self_reference'].includes(branch.lens)){score+=2;reasons.push({signalType:'ROUTE_SHROOMING',route:signal.route,contribution:2});}
    if(signal.route==='MUTHER'&&['excluded_alternative','causal_mechanism','definition_boundary','evidence'].includes(branch.lens)){score+=2;reasons.push({signalType:'ROUTE_MUTHER',route:signal.route,contribution:2});}
    if(signal.route==='VAJRA'&&['counterexample','category_error','scope','evidence'].includes(branch.lens)){score+=2;reasons.push({signalType:'ROUTE_VAJRA',route:signal.route,contribution:2});}
  }
  return {index,lens:branch.lens,targetRef:branch.targetRef,clauseRef:branch.clauseRef,status:branch.status,score,reasons};
}

export function prioritizeVajraBranches(vajraResult,metabolic){
  const branches=openBranches(vajraResult);
  const signals=metabolicSignals(metabolic);
  const feedbackFingerprint=signalFingerprint(signals);
  if(!vajraResult||!vajraResult.targetRef)return {status:'INVALID_VAJRA_RESULT',selected:null,ranked:[],signals,feedbackFingerprint,boundary:'No reprioritization performed.'};
  if(!branches.length)return {status:'NO_OPEN_BRANCH',targetRef:vajraResult.targetRef,selected:null,ranked:[],signals,feedbackFingerprint,boundary:'No open VAJRA branch exists; this bridge never reopens or closes branches.'};
  const ranked=branches.map((b,i)=>scoreBranch(b,signals,i)).sort((a,b)=>b.score-a.score||a.index-b.index);
  if(!signals.length||ranked[0].score<=0)return {status:'NO_METABOLIC_PRIORITY_SIGNAL',targetRef:vajraResult.targetRef,selected:null,ranked,signals,feedbackFingerprint,closureAuthority:'NONE',boundary:'GUT supplied no recognized prioritization signal. Original VAJRA ordering remains authoritative; no branch state changed.'};
  const selected=ranked[0];
  return {
    status:'PRIORITIZED_BY_GUT_SIGNAL',
    targetRef:vajraResult.targetRef,
    selected:{lens:selected.lens,clauseRef:selected.clauseRef,score:selected.score,reason:selected.reasons},
    ranked,
    signals,
    feedbackFingerprint,
    closureAuthority:'NONE',
    branchStateMutated:false,
    boundary:'Deterministic lexical/type routing bridge. GUT output may change which unresolved VAJRA branch is inspected next, but cannot resolve, validate, suppress or create evidence for any branch. Scores are auditable heuristics, not semantic importance or truth judgments; provenance is carried only as source metadata and the feedback fingerprint is not evidence.'
  };
}
