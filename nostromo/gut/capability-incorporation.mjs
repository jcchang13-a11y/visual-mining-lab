/* ZENOMORPH / NOSTROMO reversible capability incorporation candidate gate v0.2
 * A repeated-heldout PASS may enter a host-controlled reversible body-state trial.
 * This module never mutates the supplied body. It returns a candidate body copy plus
 * explicit rollback evidence. Permanent admission remains a separate decision.
 * v0.2 binds rollback evidence to a recursively canonicalized body fingerprint so
 * nested organ/capability state changes cannot disappear from identity evidence.
 */
import { runRepeatedHeldoutStress } from './capability-repeated-stress.mjs';

function cleanId(value){
  return typeof value==='string'&&/^[a-z0-9][a-z0-9._-]{0,79}$/i.test(value)?value:null;
}
function plainBody(value){
  return value&&typeof value==='object'&&!Array.isArray(value)?value:null;
}
function stableStructure(value,seen=new WeakSet()){
  if(value===null||typeof value!=='object')return value;
  if(seen.has(value))throw new TypeError('cyclic-body-state-not-supported');
  seen.add(value);
  try{
    if(Array.isArray(value))return value.map(item=>stableStructure(item,seen));
    const out={};
    for(const key of Object.keys(value).sort())out[key]=stableStructure(value[key],seen);
    return out;
  } finally {
    seen.delete(value);
  }
}
function fingerprint(value){
  const text=JSON.stringify(stableStructure(value));
  let h=2166136261;
  for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619);}
  return `fnv1a32:${(h>>>0).toString(16).padStart(8,'0')}`;
}

export function runReversibleIncorporationCandidate(candidate,cases,bodyState,{capabilityRegistry={},organRegistry={},downstreamOrganId,context={}}={}){
  const base={schema:'zenomorph-capability-incorporation/v0.2',organism:'ZENOMORPH',habitat:'NOSTROMO',installed:false,persistentMutation:false,bodyAdmission:false};
  const body=plainBody(bodyState);
  if(!body)return {...base,status:'BLOCKED',assimilationStage:'INCORPORATION_BLOCKED',reason:'plain-host-body-state-required'};
  let beforeFingerprint;
  try{beforeFingerprint=fingerprint(body);}catch(error){return {...base,status:'BLOCKED',assimilationStage:'INCORPORATION_BLOCKED',reason:'fingerprintable-acyclic-host-body-state-required',error:String(error?.message||error)};}
  const stress=runRepeatedHeldoutStress(candidate,cases,{capabilityRegistry,organRegistry,downstreamOrganId,context});
  if(stress.status!=='PASS')return {...base,status:'HOLD',assimilationStage:'INCORPORATION_BLOCKED',reason:'repeated-heldout-pass-required',stress};
  const capabilityId=cleanId(candidate?.adapterId||candidate?.capabilityId||candidate?.toolId||candidate?.moduleId);
  if(!capabilityId||typeof capabilityRegistry[capabilityId]!=='function')return {...base,status:'BLOCKED',assimilationStage:'INCORPORATION_BLOCKED',reason:'host-registered-capability-required',stress};
  const before=structuredClone(body);
  const candidateBody=structuredClone(body);
  const organs=plainBody(candidateBody.organs)?candidateBody.organs:{};
  candidateBody.organs={...organs};
  const existing=plainBody(candidateBody.capabilities)?candidateBody.capabilities:{};
  candidateBody.capabilities={...existing,[capabilityId]:{status:'REVERSIBLE_TRIAL_ONLY',provenanceFingerprint:stress.provenanceFingerprint||null,downstreamOrganId:cleanId(downstreamOrganId),admittedAt:null}};
  const candidateFingerprint=fingerprint(candidateBody);
  return {...base,status:'PASS',assimilationStage:'REVERSIBLE_BODY_CANDIDATE_CREATED',reason:'heldout-profile-verified-and-reversible-copy-created',capabilityId,stress,originalBodyUnchanged:fingerprint(body)===beforeFingerprint,beforeFingerprint,candidateFingerprint,candidateBody,rollback:{method:'discard-candidate-body-copy',restoresFingerprint:beforeFingerprint},fingerprintBoundary:{canonicalization:'recursive-object-key-sort-array-order-preserved',nestedStateBound:true,cyclicStateAccepted:false},nextStage:'run whole-body regression against candidateBody; permanent admission requires separate explicit gate'};
}

export const incorporationBoundary=Object.freeze({version:'0.2',requiresRepeatedHeldoutPass:true,mutatesSuppliedBody:false,persistentMutation:false,permanentAdmissionOnPass:false,rollbackRequired:true,recursiveCanonicalFingerprint:true,cyclicBodyStateAccepted:false,nextStage:'whole-body regression on reversible candidate copy'});
