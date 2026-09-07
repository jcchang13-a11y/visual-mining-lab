/* ZENOMORPH / NOSTROMO GUT controlled capability sandbox v0.1
 * Executes only host-registered adapters selected by inert candidate metadata.
 * Candidate descriptors may not carry code/callbacks/commands. Passing this stage is NOT body admission.
 */
import crypto from 'node:crypto';
import { assessForeignCapability } from './capability-admission.mjs';

function stable(value){
  if(value===undefined)return 'undefined';
  if(typeof value==='bigint')return JSON.stringify({$bigint:String(value)});
  if(value===null||typeof value!=='object')return JSON.stringify(value);
  if(Array.isArray(value))return '['+value.map(stable).join(',')+']';
  const keys=Object.keys(value).sort();
  return '{'+keys.map(k=>JSON.stringify(k)+':'+stable(value[k])).join(',')+'}';
}
function fingerprint(value){
  return crypto.createHash('sha256').update(stable(value)).digest('hex');
}
function clone(value){
  return structuredClone(value);
}
function deepFreeze(value,seen=new WeakSet()){
  if(!value||typeof value!=='object'||seen.has(value))return value;
  seen.add(value);
  for(const key of Object.keys(value))deepFreeze(value[key],seen);
  return Object.freeze(value);
}
function scalar(value,max=160){
  if(value===null||value===undefined)return null;
  if(['string','number','boolean','bigint'].includes(typeof value))return String(value).replace(/\s+/g,' ').trim().slice(0,max)||null;
  return null;
}
function first(value,names){
  for(const wanted of names){
    for(const [key,v] of Object.entries(value||{})){
      if(String(key).toLowerCase()===wanted){const s=scalar(v);if(s)return s;}
    }
  }
  return null;
}
function outputMatches(contract,output){
  const expected=first(contract||{},['outputtype','outputkind']);
  if(!expected)return {checked:false,ok:true};
  const actual=Array.isArray(output)?'array':output===null?'null':typeof output;
  return {checked:true,ok:String(expected).toLowerCase()===actual,expected:String(expected).toLowerCase(),actual};
}

export function runIsolatedCapabilityTrial(candidate,input,{registry={},context={}}={}){
  const admission=assessForeignCapability(candidate,context);
  const base={
    schema:'zenomorph-gut-capability-sandbox/v0.1',
    organism:'ZENOMORPH',
    habitat:'NOSTROMO',
    bodyAdmission:false,
    installed:false,
    persistentMutation:false,
    candidateAdmission:admission,
    assimilationStage:'ISOLATED_TEST_BLOCKED'
  };
  if(admission.assimilationStage!=='CANDIDATE_FOR_ISOLATED_TEST'){
    return {...base,status:'BLOCKED',reason:'candidate-not-admitted-to-isolated-test',executed:false};
  }
  const adapterId=first(candidate,['adapterid','capabilityid','toolid','moduleid']);
  if(!adapterId){
    return {...base,status:'BLOCKED',reason:'host-registered-adapter-id-required',executed:false};
  }
  const adapter=registry[adapterId];
  if(typeof adapter!=='function'){
    return {...base,status:'BLOCKED',reason:'adapter-not-present-in-host-registry',adapterId,executed:false};
  }

  const inputBefore=fingerprint(input);
  let firstOutput,secondOutput;
  try{
    const one=deepFreeze(clone(input));
    const two=deepFreeze(clone(input));
    firstOutput=adapter(one);
    if(firstOutput&&typeof firstOutput.then==='function'){
      return {...base,status:'QUARANTINE',reason:'async-adapter-not-supported-by-v0.1-sandbox',adapterId,executed:true};
    }
    secondOutput=adapter(two);
    if(secondOutput&&typeof secondOutput.then==='function'){
      return {...base,status:'QUARANTINE',reason:'async-adapter-not-supported-by-v0.1-sandbox',adapterId,executed:true};
    }
  }catch(error){
    return {...base,status:'FAILED',reason:'isolated-adapter-threw',adapterId,executed:true,error:String(error?.message||error).slice(0,240)};
  }

  const inputAfter=fingerprint(input);
  const firstFingerprint=fingerprint(firstOutput);
  const secondFingerprint=fingerprint(secondOutput);
  const deterministic=firstFingerprint===secondFingerprint;
  const inputStable=inputBefore===inputAfter;
  const contract=candidate?.contract&&typeof candidate.contract==='object'?candidate.contract:candidate;
  const contractCheck=outputMatches(contract,firstOutput);
  const passed=deterministic&&inputStable&&contractCheck.ok;

  return {
    ...base,
    status:passed?'PASS':'HOLD',
    reason:passed?'isolated-host-registered-trial-passed':'isolated-trial-evidence-insufficient',
    adapterId,
    executed:true,
    executionBoundary:'HOST_REGISTERED_ONLY',
    assimilationStage:passed?'ISOLATED_TEST_PASSED':'ISOLATED_TEST_INCONCLUSIVE',
    deterministic,
    inputStable,
    contractCheck,
    inputFingerprint:inputBefore,
    outputFingerprint:firstFingerprint,
    replayOutputFingerprint:secondFingerprint,
    provenanceFingerprint:scalar(context.provenanceFingerprint)||scalar(candidate?.provenanceFingerprint)||null,
    rollbackEvidence:'no installation; cloned frozen inputs; no body state mutation performed by sandbox'
  };
}

export const capabilitySandboxBoundary=Object.freeze({
  version:'0.1',
  candidateCodeExecution:false,
  hostRegisteredAdapterExecution:true,
  asyncAdapters:false,
  installsCapability:false,
  mutatesBody:false,
  admissionOnPass:false,
  nextStage:'cross-organ held-out stress test and explicit incorporation decision'
});
