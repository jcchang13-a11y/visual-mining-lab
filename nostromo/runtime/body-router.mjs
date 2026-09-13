// ZENOMORPH three-body runtime boundary v0.1.1
// Stable body may answer. Growing body may mutate. Shadow body may compare but never control output.
// Ingestion law: edible != absorbable. A candidate must transfer across unlike foods before promotion.
import crypto from 'node:crypto';

const hash=value=>crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
const clone=value=>JSON.parse(JSON.stringify(value));

export function createRuntimeState({stableCapabilities=[],candidates=[]}={}){
  return {
    schema:'zenomorph-three-body-runtime/v0.1.1',
    policy:'DISPLAYED STATE MUST FOLLOW EVIDENCE',
    ingestionPolicy:{
      rule:'EDIBLE_DOES_NOT_IMPLY_ABSORBABLE',
      meaning:'DROPLET may acquire and MUTHER may decompose unfamiliar material; GUT/VAJRA must prevent admission unless effects survive provenance, counterexample, cross-food, held-out and delayed tests.'
    },
    stable:{capabilities:[...stableCapabilities],revision:1},
    growing:{candidates:clone(candidates),revision:1},
    shadow:{observations:[],revision:1},
    promotionGate:{required:['isolated_generation','stress','provenance','cross_organ','regression','held_out','cross_food_transfer','delayed_retest']}
  };
}

export async function runTask({task,state,stableExecutor,growingExecutor}={}){
  if(!state||state.schema!=='zenomorph-three-body-runtime/v0.1.1') throw new Error('INVALID_RUNTIME_STATE');
  if(typeof stableExecutor!=='function'||typeof growingExecutor!=='function') throw new Error('EXECUTOR_REQUIRED');

  const taskId=hash(task).slice(0,16);
  const stableSnapshot=clone(state.stable);
  const stableResult=await stableExecutor({task,body:stableSnapshot,mode:'stable'});

  // Growing receives the same task but cannot mutate stableSnapshot or control the official answer.
  const growingSnapshot=clone(state.growing);
  const shadowResult=await growingExecutor({task,body:growingSnapshot,mode:'shadow'});
  const comparison={
    taskId,
    stableFingerprint:hash(stableResult),
    shadowFingerprint:hash(shadowResult),
    differs:hash(stableResult)!==hash(shadowResult),
    observedAt:new Date().toISOString(),
    authority:'SHADOW_HAS_NO_OUTPUT_AUTHORITY'
  };

  state.shadow.observations.push(comparison);
  state.shadow.revision+=1;
  return {official:stableResult,shadow:shadowResult,comparison,state};
}

export function registerCandidate(state,candidate){
  if(!candidate?.id) throw new Error('CANDIDATE_ID_REQUIRED');
  const entry={...clone(candidate),status:'candidate',admittedAt:new Date().toISOString(),evidence:clone(candidate.evidence||{})};
  state.growing.candidates.push(entry);
  state.growing.revision+=1;
  return state;
}

export function evaluatePromotion(state,candidateId){
  const candidate=state.growing.candidates.find(x=>x.id===candidateId);
  if(!candidate) return {promotable:false,reason:'CANDIDATE_NOT_FOUND'};
  const missing=state.promotionGate.required.filter(k=>candidate.evidence?.[k]!==true);
  return {promotable:missing.length===0,missing,candidateId,rule:state.ingestionPolicy.rule};
}

export function promoteCandidate(state,candidateId){
  const gate=evaluatePromotion(state,candidateId);
  if(!gate.promotable) throw new Error(`PROMOTION_BLOCKED:${gate.missing.join(',')}`);
  const idx=state.growing.candidates.findIndex(x=>x.id===candidateId);
  const candidate=state.growing.candidates[idx];
  state.stable.capabilities.push({id:candidate.id,kind:candidate.kind||'unknown',promotedAt:new Date().toISOString(),sourceCandidateFingerprint:hash(candidate)});
  state.stable.revision+=1;
  state.growing.candidates[idx]={...candidate,status:'incorporated'};
  state.growing.revision+=1;
  return state;
}
