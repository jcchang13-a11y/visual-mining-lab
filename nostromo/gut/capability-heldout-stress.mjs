/* ZENOMORPH / NOSTROMO held-out cross-organ capability stress gate v0.4
 * Proves an isolated foreign capability can alter a downstream organ decision under a host-controlled ephemeral trial.
 * This is NOT body admission, installation, or persistent mutation.
 * Capability and organ registries are own-data-property only: inherited entries and accessors fail closed.
 * Decision comparison is canonical and fail-closed: BigInt/non-finite/nullish values are representable;
 * cycles, accessors, functions, symbols and exotic object prototypes quarantine instead of escaping
 * or collapsing into false equality.
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

function canonicalDecision(value){
  const seen=new WeakSet();
  function walk(node,path='$'){
    if(node===null)return ['null'];
    if(node===undefined)return ['undefined'];
    const type=typeof node;
    if(type==='string'||type==='boolean')return [type,node];
    if(type==='number'){
      if(Number.isNaN(node))return ['number','NaN'];
      if(node===Infinity)return ['number','Infinity'];
      if(node===-Infinity)return ['number','-Infinity'];
      if(Object.is(node,-0))return ['number','-0'];
      return ['number',node];
    }
    if(type==='bigint')return ['bigint',node.toString()];
    if(type==='function'||type==='symbol')throw new Error(`unsupported-decision-${type}-at-${path}`);
    if(type!=='object')return [type,String(node)];
    if(seen.has(node))throw new Error(`cyclic-decision-at-${path}`);
    seen.add(node);
    if(Array.isArray(node)){
      const out=['array',node.map((item,index)=>walk(item,`${path}[${index}]`))];
      seen.delete(node);
      return out;
    }
    let proto;
    try{
      proto=Object.getPrototypeOf(node);
    }catch(error){
      throw new Error(`decision-prototype-inspection-failed-at-${path}`);
    }
    if(proto!==Object.prototype&&proto!==null){
      const name=typeof proto?.constructor?.name==='string'?proto.constructor.name:'unknown';
      throw new Error(`exotic-decision-object-${name}-at-${path}`);
    }
    const descriptors=Object.getOwnPropertyDescriptors(node);
    const keys=Reflect.ownKeys(descriptors);
    if(keys.some(key=>typeof key==='symbol'))throw new Error(`symbol-keyed-decision-at-${path}`);
    const entries=[];
    for(const key of keys.sort()){
      const descriptor=descriptors[key];
      if(!Object.prototype.hasOwnProperty.call(descriptor,'value'))throw new Error(`accessor-decision-at-${path}.${key}`);
      entries.push([key,walk(descriptor.value,`${path}.${key}`)]);
    }
    seen.delete(node);
    return ['object',entries];
  }
  return JSON.stringify(walk(value));
}

export function runHeldoutCrossOrganStress(candidate,input,{capabilityRegistry={},organRegistry={},downstreamOrganId,baselineSignal=null,context={}}={}){
  const isolated=runIsolatedCapabilityTrial(candidate,input,{registry:capabilityRegistry,context});
  const base={schema:'zenomorph-capability-heldout-stress/v0.4',organism:'ZENOMORPH',habitat:'NOSTROMO',bodyAdmission:false,installed:false,persistentMutation:false,isolatedTrial:isolated,registryLookup:'OWN_DATA_PROPERTY_ONLY',decisionComparison:'CANONICAL_FAIL_CLOSED'};
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

  let before,after;
  try{
    before=canonicalDecision(baselineDecision);
    after=canonicalDecision(augmentedDecision);
  }catch(error){
    return {...base,status:'QUARANTINE',assimilationStage:'HELDOUT_STRESS_BLOCKED',reason:'downstream-decision-not-safely-comparable',downstreamOrganId:organId,downstreamExecuted:true,error:String(error?.message||error).slice(0,240),provenanceFingerprint:isolated.provenanceFingerprint||null,rollbackEvidence:'ephemeral replay only; malformed or unsupported decision was quarantined before evidence comparison or body mutation'};
  }
  const behaviorChanged=before!==after;
  return {...base,status:behaviorChanged?'PASS':'HOLD',assimilationStage:behaviorChanged?'HELDOUT_BEHAVIOR_CHANGE_VERIFIED':'HELDOUT_NO_BEHAVIOR_CHANGE',reason:behaviorChanged?'foreign-capability-changed-downstream-organ-behavior':'foreign-capability-produced-no-observed-downstream-change',downstreamOrganId:organId,downstreamExecuted:true,behaviorChanged,baselineDecision,augmentedDecision,decisionFingerprintBefore:before,decisionFingerprintAfter:after,provenanceFingerprint:isolated.provenanceFingerprint||null,rollbackEvidence:'ephemeral replay only; no registry, body, or persistent state mutation performed'};
}

export const heldoutStressBoundary=Object.freeze({version:'0.4',requiresIsolatedPass:true,hostRegisteredCapabilityOnly:true,hostRegisteredDownstreamOrganOnly:true,registryLookup:'own data property only',decisionComparison:'canonical fail-closed',supportsComparableDecisionTypes:['null','undefined','string','boolean','finite/non-finite number','bigint','arrays','plain data objects','null-prototype data objects'],quarantinesDecisionTypes:['cycles','functions','symbols','symbol keys','accessors','Date','Map','Set','RegExp','typed arrays','class instances','other exotic object prototypes'],inheritedRegistryEntries:false,accessorRegistryEntries:false,persistentMutation:false,bodyAdmissionOnPass:false,nextStage:'repeat across independent held-out inputs and explicit incorporation decision'});
