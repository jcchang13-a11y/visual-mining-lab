/* ZENOMORPH / NOSTROMO GUT controlled capability sandbox v0.3
 * Executes only host-registered adapters selected by inert candidate metadata.
 * Candidate descriptors may not carry code/callbacks/commands. Passing this stage is NOT body admission.
 * Registry lookup is own-data-property only: prototype inheritance and accessors never count as registration.
 * Fingerprinting is canonical/fail-closed: exotic values may not collapse into false deterministic equality.
 */
import crypto from 'node:crypto';
import { assessForeignCapability } from './capability-admission.mjs';

function stable(value,seen=new WeakSet(),path='$'){
  if(value===undefined)return '["undefined"]';
  if(value===null)return 'null';
  const type=typeof value;
  if(type==='string'||type==='boolean')return JSON.stringify(value);
  if(type==='number'){
    if(Number.isNaN(value))return '["number","NaN"]';
    if(value===Infinity)return '["number","Infinity"]';
    if(value===-Infinity)return '["number","-Infinity"]';
    if(Object.is(value,-0))return '["number","-0"]';
    return JSON.stringify(value);
  }
  if(type==='bigint')return JSON.stringify({$bigint:String(value)});
  if(type==='function'||type==='symbol')throw new Error(`unsupported-fingerprint-${type}-at-${path}`);
  if(type!=='object')return JSON.stringify([type,String(value)]);
  if(seen.has(value))throw new Error(`cyclic-fingerprint-at-${path}`);
  seen.add(value);
  try{
    if(value instanceof Date){
      const ms=value.getTime();
      if(!Number.isFinite(ms))throw new Error(`invalid-date-at-${path}`);
      return JSON.stringify({$date:value.toISOString()});
    }
    if(value instanceof RegExp)return JSON.stringify({$regexp:value.source,$flags:value.flags});
    if(value instanceof Map){
      const entries=[];
      let i=0;
      for(const [key,item] of value.entries())entries.push([stable(key,seen,`${path}{${i}}.key`),stable(item,seen,`${path}{${i}}.value`)]),i++;
      entries.sort((a,b)=>a[0].localeCompare(b[0])||a[1].localeCompare(b[1]));
      return JSON.stringify({$map:entries});
    }
    if(value instanceof Set){
      const items=[];
      let i=0;
      for(const item of value.values())items.push(stable(item,seen,`${path}<${i++}>`));
      items.sort();
      return JSON.stringify({$set:items});
    }
    if(ArrayBuffer.isView(value))return JSON.stringify({$view:value.constructor?.name||'TypedArray',$values:Array.from(new Uint8Array(value.buffer,value.byteOffset,value.byteLength))});
    if(value instanceof ArrayBuffer)return JSON.stringify({$arrayBuffer:Array.from(new Uint8Array(value))});
    if(Array.isArray(value))return '['+value.map((item,index)=>stable(item,seen,`${path}[${index}]`)).join(',')+']';
    const proto=Object.getPrototypeOf(value);
    if(proto!==Object.prototype&&proto!==null){
      const name=typeof proto?.constructor?.name==='string'?proto.constructor.name:'unknown';
      throw new Error(`unsupported-fingerprint-object-${name}-at-${path}`);
    }
    const descriptors=Object.getOwnPropertyDescriptors(value);
    const keys=Reflect.ownKeys(descriptors);
    if(keys.some(key=>typeof key==='symbol'))throw new Error(`symbol-keyed-fingerprint-at-${path}`);
    return '{'+keys.sort().map(key=>{
      const descriptor=descriptors[key];
      if(!Object.prototype.hasOwnProperty.call(descriptor,'value'))throw new Error(`accessor-fingerprint-at-${path}.${key}`);
      return JSON.stringify(key)+':'+stable(descriptor.value,seen,`${path}.${key}`);
    }).join(',')+'}';
  }finally{
    seen.delete(value);
  }
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
function registeredAdapter(registry,adapterId){
  if(registry===null||(typeof registry!=='object'&&typeof registry!=='function')){
    return {ok:false,reason:'host-registry-object-required'};
  }
  let descriptor;
  try{
    descriptor=Object.getOwnPropertyDescriptor(registry,adapterId);
  }catch(error){
    return {ok:false,reason:'host-registry-inspection-failed',error:String(error?.message||error).slice(0,240)};
  }
  if(!descriptor){
    return {ok:false,reason:'adapter-not-present-as-own-host-registration'};
  }
  if(!Object.prototype.hasOwnProperty.call(descriptor,'value')){
    return {ok:false,reason:'host-registry-accessor-not-executable-registration'};
  }
  if(typeof descriptor.value!=='function'){
    return {ok:false,reason:'host-registered-adapter-must-be-callable'};
  }
  return {ok:true,adapter:descriptor.value};
}

export function runIsolatedCapabilityTrial(candidate,input,{registry={},context={}}={}){
  const admission=assessForeignCapability(candidate,context);
  const base={
    schema:'zenomorph-gut-capability-sandbox/v0.3',
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
  const registration=registeredAdapter(registry,adapterId);
  if(!registration.ok){
    return {
      ...base,
      status:'BLOCKED',
      reason:registration.reason,
      adapterId,
      executed:false,
      registryLookup:'OWN_DATA_PROPERTY_ONLY',
      ...(registration.error?{registryError:registration.error}:{})
    };
  }
  const adapter=registration.adapter;

  let inputBefore;
  try{
    inputBefore=fingerprint(input);
  }catch(error){
    return {...base,status:'QUARANTINE',reason:'input-not-safely-fingerprintable',adapterId,executed:false,error:String(error?.message||error).slice(0,240)};
  }

  let firstOutput,secondOutput;
  try{
    const one=deepFreeze(clone(input));
    const two=deepFreeze(clone(input));
    firstOutput=adapter(one);
    if(firstOutput&&typeof firstOutput.then==='function'){
      return {...base,status:'QUARANTINE',reason:'async-adapter-not-supported-by-v0.3-sandbox',adapterId,executed:true};
    }
    secondOutput=adapter(two);
    if(secondOutput&&typeof secondOutput.then==='function'){
      return {...base,status:'QUARANTINE',reason:'async-adapter-not-supported-by-v0.3-sandbox',adapterId,executed:true};
    }
  }catch(error){
    return {...base,status:'FAILED',reason:'isolated-adapter-threw',adapterId,executed:true,error:String(error?.message||error).slice(0,240)};
  }

  let inputAfter,firstFingerprint,secondFingerprint;
  try{
    inputAfter=fingerprint(input);
    firstFingerprint=fingerprint(firstOutput);
    secondFingerprint=fingerprint(secondOutput);
  }catch(error){
    return {...base,status:'QUARANTINE',reason:'trial-material-not-safely-fingerprintable',adapterId,executed:true,error:String(error?.message||error).slice(0,240),rollbackEvidence:'no installation; unsafe fingerprint material quarantined before any body admission'};
  }
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
    executionBoundary:'HOST_REGISTERED_OWN_DATA_PROPERTY_ONLY',
    registryLookup:'OWN_DATA_PROPERTY_ONLY',
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
  version:'0.3',
  candidateCodeExecution:false,
  hostRegisteredAdapterExecution:true,
  registryLookup:'own data property only',
  fingerprinting:'canonical fail-closed across maps/sets/dates/regexps/buffers and plain data; unsafe accessors/functions/symbols/cycles/exotic objects quarantine',
  inheritedRegistryEntries:false,
  accessorRegistryEntries:false,
  asyncAdapters:false,
  installsCapability:false,
  mutatesBody:false,
  admissionOnPass:false,
  nextStage:'cross-organ held-out stress test and explicit incorporation decision'
});
