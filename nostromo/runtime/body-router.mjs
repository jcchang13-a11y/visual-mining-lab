// ZENOMORPH three-body runtime boundary v0.1.4
// Stable body may answer. Growing body may mutate. Shadow body may compare but never control output.
// Ingestion law: edible != absorbable. A candidate must transfer across unlike foods before promotion.
import crypto from 'node:crypto';
import {createRequire} from 'node:module';

const require=createRequire(import.meta.url);
const stableRegistry=require('./stable-structural-capabilities.json');
const hash=value=>crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
const clone=value=>JSON.parse(JSON.stringify(value));

export function getRegisteredStableCapabilities(){
  const caps=Array.isArray(stableRegistry?.capabilities)?stableRegistry.capabilities:[];
  return clone(caps);
}

export function createRuntimeState({stableCapabilities=null,candidates=[]}={}){
  const authoritativeStable=stableCapabilities===null?getRegisteredStableCapabilities():stableCapabilities;
  return {
    schema:'zenomorph-three-body-runtime/v0.1.4',
    policy:'DISPLAYED STATE MUST FOLLOW EVIDENCE',
    ingestionPolicy:{
      rule:'EDIBLE_DOES_NOT_IMPLY_ABSORBABLE',
      meaning:'DROPLET may acquire and MUTHER may decompose unfamiliar material; GUT/VAJRA must prevent admission unless effects survive provenance, counterexample, cross-food, held-out and delayed tests.'
    },
    stable:{capabilities:clone(authoritativeStable),revision:Number(stableRegistry?.revision||1)},
    growing:{candidates:clone(candidates),revision:1},
    shadow:{observations:[],ablationReceipts:[],revision:1},
    promotionGate:{required:['isolated_generation','stress','provenance','cross_organ','regression','held_out','cross_food_transfer','delayed_retest']}
  };
}

export async function runTask({task,state,stableExecutor,growingExecutor}={}){
  if(!state||state.schema!=='zenomorph-three-body-runtime/v0.1.4') throw new Error('INVALID_RUNTIME_STATE');
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

// Causal transfer probe: same held-out task, same executor family, candidate absent vs present.
// This measures whether a retained candidate changes behavior; a mere difference is evidence of effect,
// not proof that the effect is useful or promotable.
export async function runAblationPair({task,state,candidateId,executor}={}){
  if(!state||state.schema!=='zenomorph-three-body-runtime/v0.1.4') throw new Error('INVALID_RUNTIME_STATE');
  if(typeof executor!=='function') throw new Error('EXECUTOR_REQUIRED');
  const candidate=state.growing.candidates.find(x=>x.id===candidateId);
  if(!candidate) throw new Error('CANDIDATE_NOT_FOUND');

  const controlBody=clone(state.growing);
  controlBody.candidates=controlBody.candidates.filter(x=>x.id!==candidateId);
  const exposedBody=clone(state.growing);
  const taskSnapshot=clone(task);

  const control=await executor({task:clone(taskSnapshot),body:controlBody,mode:'ablation-control',candidate:null});
  const exposed=await executor({task:clone(taskSnapshot),body:exposedBody,mode:'ablation-exposed',candidate:clone(candidate)});
  const controlFingerprint=hash(control);
  const exposedFingerprint=hash(exposed);
  const receipt={
    taskId:hash(taskSnapshot).slice(0,16),
    candidateId,
    candidateFingerprint:hash(candidate),
    controlFingerprint,
    exposedFingerprint,
    causalEffectObserved:controlFingerprint!==exposedFingerprint,
    interpretation:'DIFFERENCE_IS_CAUSAL_EFFECT_EVIDENCE_NOT_PROMOTION_EVIDENCE',
    authority:'ABLATION_HAS_NO_STABLE_OUTPUT_AUTHORITY',
    observedAt:new Date().toISOString()
  };
  state.shadow.ablationReceipts.push(receipt);
  state.shadow.revision+=1;
  return {control,exposed,receipt,state};
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

// Legacy in-memory promotion is deliberately disabled. Passing eight boolean gates is qualification
// evidence only; it is not repository authority. Stable incorporation must go through the guarded
// incorporation path, which binds a fresh promotion receipt, canonical registry identity and
// post-incorporation regression before persistence to main.
export function promoteCandidate(){
  throw new Error('DIRECT_PROMOTION_DISABLED:USE_GUARDED_INCORPORATION');
}
