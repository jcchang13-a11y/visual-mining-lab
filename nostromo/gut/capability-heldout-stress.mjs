/* ZENOMORPH / NOSTROMO held-out cross-organ capability stress gate v0.2
 * Proves an isolated foreign capability can alter a downstream organ decision under a host-controlled ephemeral trial.
 * This is NOT body admission, installation, or persistent mutation.
 * Capability and organ registries are own-data-property only: inherited entries and accessors fail closed.
 */
import { runIsolatedCapabilityTrial } from './capability-sandbox.mjs';

function cleanId(value){
  return typeof value==='string'&&/^[a-z0-9][a-z0-9._-]{0,79}$/i.test(value)?value:null;
}

function registeredCallable(registry,id,kind){
  if(registry===null||(typeof registry!=='object'&&typeof registry!=='function')){
    return {ok:false,reason:`host-${kind}-registry-object-required`};
  }
  let descriptor;
  try{
    descriptor=Object.getOwnPropertyDescriptor(registry,id);
  }catch(error){
    return {ok:false,reason:`host-${kind}-registry-inspection-failed`,error:String(error?.message||error).slice(0,240)};
  }
  if(!descriptor)return {ok:false,reason:`host-registered-${kind}-own-data-property-required`};
  if(!Object.prototype.hasOwnProperty.call(descriptor,'value'))return {ok:false,reason:`host-registered-${kind}-accessor-not-allowed`};
  if(typeof descriptor.value!=='function')return {ok:false,reason:`host-registered-${kind}-must-be-callable`};
  return {ok:true,callable:descriptor.value};
}

export function runHeldoutCrossOrganStress(candidate,input,{capabilityRegistry={},organRegistry={},downstreamOrganId,baselineSignal=null,context={}}={}){
  const isolated=runIsolatedCapabilityTrial(candidate,input,{registry:capabilityRegistry,context});
  const base={schema:'zenomorph-capability-heldout-stress/v0.2',organism:'ZENOMORPH',habitat:'NOSTROMO',bodyAdmission:false,installed:false,persistentMutation:false,isolatedTrial:isolated,registryLookup:'OWN_DATA_PROPERTY_ONLY'};
  if(isolated.status!=='PASS')return {...base,status:'BLOCKED',assimilationStage:'HELDOUT_STRESS_BLOCKED',reason:'isolated-trial-must-pass-first',downstreamExecuted:false};

  const organId=cleanId(downstreamOrganId);
  if(!organId)return {...base,status:'BLOCKED',assimilationStage:'HELDOUT_STRESS_BLOCKED',reason:'host-registered-downstream-organ-id-required',downstreamExecuted:false};
  const organRegistration=registeredCallable(organRegistry,organId,'downstream-organ');
  if(!organRegistration.ok)return {...base,status:'BLOCKED',assimilationStage:'HELDOUT_STRESS_BLOCKED',reason:organRegistration.reason,downstreamExecuted:false,...(organRegistration.error?{registryError:organRegistration.error}:{})};
  const organ=organRegistration.callable;

  const capabilityId=cleanId(candidate?.adapterId||candidate?.capabilityId||candidate?.toolId||candidate?.moduleId);
  if(!capabilityId)return {...base,status:'BLOCKED',assimilationStage:'HELDOUT_STRESS_BLOCKED',reason:'host-registered-capability-id-required',downstreamExecuted:false};
  const capabilityRegistration=registeredCallable(capabilityRegistry,capabilityId,'capability');
  if(!capabilityRegistration.ok)return {...base,status:'BLOCKED',assimilationStage:'HELDOUT_STRESS_BLOCKED',reason:capabilityRegistration.reason,downstreamExecuted:false,...(capabilityRegistration.error?{registryError:capabilityRegistration.error}:{})};
  const adapter=capabilityRegistration.callable;

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

export const heldoutStressBoundary=Object.freeze({version:'0.2',requiresIsolatedPass:true,hostRegisteredCapabilityOnly:true,hostRegisteredDownstreamOrganOnly:true,registryLookup:'own data property only',inheritedRegistryEntries:false,accessorRegistryEntries:false,persistentMutation:false,bodyAdmissionOnPass:false,nextStage:'repeat across independent held-out inputs and explicit incorporation decision'});
