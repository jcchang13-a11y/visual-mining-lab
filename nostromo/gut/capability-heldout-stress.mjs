/* ZENOMORPH / NOSTROMO held-out cross-organ capability stress gate v0.1
 * Proves an isolated foreign capability can alter a downstream organ decision under a host-controlled ephemeral trial.
 * This is NOT body admission, installation, or persistent mutation.
 */
import { runIsolatedCapabilityTrial } from './capability-sandbox.mjs';

function cleanId(value){
  return typeof value==='string'&&/^[a-z0-9][a-z0-9._-]{0,79}$/i.test(value)?value:null;
}

export function runHeldoutCrossOrganStress(candidate,input,{capabilityRegistry={},organRegistry={},downstreamOrganId,baselineSignal=null,context={}}={}){
  const isolated=runIsolatedCapabilityTrial(candidate,input,{registry:capabilityRegistry,context});
  const base={schema:'zenomorph-capability-heldout-stress/v0.1',organism:'ZENOMORPH',habitat:'NOSTROMO',bodyAdmission:false,installed:false,persistentMutation:false,isolatedTrial:isolated};
  if(isolated.status!=='PASS')return {...base,status:'BLOCKED',assimilationStage:'HELDOUT_STRESS_BLOCKED',reason:'isolated-trial-must-pass-first',downstreamExecuted:false};
  const organId=cleanId(downstreamOrganId);
  const organ=organId&&organRegistry[organId];
  if(typeof organ!=='function')return {...base,status:'BLOCKED',assimilationStage:'HELDOUT_STRESS_BLOCKED',reason:'host-registered-downstream-organ-required',downstreamExecuted:false};
  const capabilityId=cleanId(candidate?.adapterId||candidate?.capabilityId||candidate?.toolId||candidate?.moduleId);
  const adapter=capabilityId&&capabilityRegistry[capabilityId];
  if(typeof adapter!=='function')return {...base,status:'BLOCKED',assimilationStage:'HELDOUT_STRESS_BLOCKED',reason:'capability-adapter-disappeared-after-isolated-pass',downstreamExecuted:false};
  let augmentedSignal,baselineDecision,augmentedDecision;
  try{
    augmentedSignal=adapter(structuredClone(input));
    if(augmentedSignal&&typeof augmentedSignal.then==='function')return {...base,status:'QUARANTINE',assimilationStage:'HELDOUT_STRESS_BLOCKED',reason:'async-capability-not-supported',downstreamExecuted:false};
    baselineDecision=organ({input:structuredClone(input),foreignSignal:baselineSignal,trial:'baseline'});
    augmentedDecision=organ({input:structuredClone(input),foreignSignal:structuredClone(augmentedSignal),trial:'augmented'});
    if([baselineDecision,augmentedDecision].some(x=>x&&typeof x.then==='function'))return {...base,status:'QUARANTINE',assimilationStage:'HELDOUT_STRESS_BLOCKED',reason:'async-downstream-organ-not-supported',downstreamExecuted:true};
  }catch(error){
    return {...base,status:'FAILED',assimilationStage:'HELDOUT_STRESS_FAILED',reason:'heldout-cross-organ-execution-threw',downstreamExecuted:true,error:String(error?.message||error).slice(0,240)};
  }
  const before=JSON.stringify(baselineDecision);
  const after=JSON.stringify(augmentedDecision);
  const behaviorChanged=before!==after;
  return {...base,status:behaviorChanged?'PASS':'HOLD',assimilationStage:behaviorChanged?'HELDOUT_BEHAVIOR_CHANGE_VERIFIED':'HELDOUT_NO_BEHAVIOR_CHANGE',reason:behaviorChanged?'foreign-capability-changed-downstream-organ-behavior':'foreign-capability-produced-no-observed-downstream-change',downstreamOrganId:organId,downstreamExecuted:true,behaviorChanged,baselineDecision,augmentedDecision,provenanceFingerprint:isolated.provenanceFingerprint||null,rollbackEvidence:'ephemeral replay only; no registry, body, or persistent state mutation performed'};
}

export const heldoutStressBoundary=Object.freeze({version:'0.1',requiresIsolatedPass:true,hostRegisteredCapabilityOnly:true,hostRegisteredDownstreamOrganOnly:true,persistentMutation:false,bodyAdmissionOnPass:false,nextStage:'repeat across independent held-out inputs and explicit incorporation decision'});
