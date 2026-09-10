/* ZENOMORPH / NOSTROMO reversible capability incorporation candidate gate v0.1
 * A repeated-heldout PASS may enter a host-controlled reversible body-state trial.
 * This module never mutates the supplied body. It returns a candidate body copy plus
 * explicit rollback evidence. Permanent admission remains a separate decision.
 */
import { runRepeatedHeldoutStress } from './capability-repeated-stress.mjs';

function cleanId(value){
  return typeof value==='string'&&/^[a-z0-9][a-z0-9._-]{0,79}$/i.test(value)?value:null;
}
function plainBody(value){
  return value&&typeof value==='object'&&!Array.isArray(value)?value:null;
}
function fingerprint(value){
  const text=JSON.stringify(value,Object.keys(value||{}).sort());
  let h=2166136261;
  for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619);}
  return `fnv1a32:${(h>>>0).toString(16).padStart(8,'0')}`;
}

export function runReversibleIncorporationCandidate(candidate,cases,bodyState,{capabilityRegistry={},organRegistry={},downstreamOrganId,context={}}={}){
  const base={schema:'zenomorph-capability-incorporation/v0.1',organism:'ZENOMORPH',habitat:'NOSTROMO',installed:false,persistentMutation:false,bodyAdmission:false};
  const body=plainBody(bodyState);
  if(!body)return {...base,status:'BLOCKED',assimilationStage:'INCORPORATION_BLOCKED',reason:'plain-host-body-state-required'};
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
  const beforeFingerprint=fingerprint(before),candidateFingerprint=fingerprint(candidateBody);
  return {...base,status:'PASS',assimilationStage:'REVERSIBLE_BODY_CANDIDATE_CREATED',reason:'heldout-profile-verified-and-reversible-copy-created',capabilityId,stress,originalBodyUnchanged:fingerprint(body)===beforeFingerprint,beforeFingerprint,candidateFingerprint,candidateBody,rollback:{method:'discard-candidate-body-copy',restoresFingerprint:beforeFingerprint},nextStage:'run whole-body regression against candidateBody; permanent admission requires separate explicit gate'};
}

export const incorporationBoundary=Object.freeze({version:'0.1',requiresRepeatedHeldoutPass:true,mutatesSuppliedBody:false,persistentMutation:false,permanentAdmissionOnPass:false,rollbackRequired:true,nextStage:'whole-body regression on reversible candidate copy'});
