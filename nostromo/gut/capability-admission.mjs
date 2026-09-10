/* ZENOMORPH / NOSTROMO GUT foreign-capability admission v0.3
 * Deterministic, non-executing pre-assimilation boundary.
 * This module does not install, import, invoke, fetch, eval, or authorize foreign capabilities.
 */

const EXECUTABLE_KEYS = new Set([
  'code','script','command','cmd','eval','function','handler','callback','executable','binary'
]);
const IDENTITY_KEYS = new Set([
  'capability','capabilityname','tool','toolname','plugin','pluginname','adapter','adaptername','module','modulename','interface','interfacename'
]);
const PROVENANCE_KEYS = new Set([
  'source','provider','publisher','provenance','sourcefingerprint','provenancefingerprint','origin'
]);
const PERMISSION_KEYS = new Set([
  'permissions','permission','scopes','scope','access','authorization','authorisation'
]);
const CONTRACT_KEYS = new Set([
  'interface','interfacename','inputschema','outputschema','inputs','outputs','contract','api'
]);

function ownKeysLower(value){
  return Object.keys(value||{}).map(k=>String(k).toLowerCase());
}
function hasAny(keys,set){
  return keys.some(k=>set.has(k));
}
function compact(value,max=240){
  if(value===null||value===undefined)return null;
  if(typeof value==='string'||typeof value==='number'||typeof value==='boolean'||typeof value==='bigint'){
    return String(value).replace(/\s+/g,' ').trim().slice(0,max)||null;
  }
  return null;
}
function firstScalar(value,names){
  for(const name of names){
    const descriptors=Object.getOwnPropertyDescriptors(value||{});
    for(const key of Reflect.ownKeys(descriptors)){
      if(typeof key!=='string')continue;
      const descriptor=descriptors[key];
      if(String(key).toLowerCase()===name&&Object.prototype.hasOwnProperty.call(descriptor,'value')){
        const c=compact(descriptor.value);
        if(c)return c;
      }
    }
  }
  return null;
}
function visibleIdentity(value){
  return firstScalar(value,['capabilityname','toolname','pluginname','adaptername','modulename','interfacename','capability','tool','plugin','adapter','module','interface','name']);
}
function safePathKey(key){
  if(typeof key==='symbol'){
    const description=key.description===undefined?'':String(key.description).slice(0,80);
    return `[Symbol(${description})]`;
  }
  return String(key).slice(0,80);
}
function findUnsafeDescriptor(root,{maxDepth=8,maxNodes=256}={}){
  const seen=new WeakSet();
  const queue=[{value:root,path:'$',depth:0}];
  let nodes=0;
  while(queue.length){
    const current=queue.shift();
    const value=current.value;
    if(value===null||(typeof value!=='object'&&typeof value!=='function'))continue;
    if(typeof value==='function')return {classification:'CALLABLE_PAYLOAD_PRESENT',reason:'callable-values-are-never-admission-metadata',path:current.path};
    if(seen.has(value))continue;
    seen.add(value);
    nodes++;
    if(nodes>maxNodes)return {classification:'DESCRIPTOR_COMPLEXITY_LIMIT',reason:'descriptor-node-limit-exceeded',path:current.path};
    if(current.depth>maxDepth)return {classification:'DESCRIPTOR_COMPLEXITY_LIMIT',reason:'descriptor-depth-limit-exceeded',path:current.path};
    const descriptors=Object.getOwnPropertyDescriptors(value);
    for(const key of Reflect.ownKeys(descriptors)){
      const descriptor=descriptors[key];
      const path=`${current.path}.${safePathKey(key)}`;
      if(typeof key==='symbol'){
        return {classification:'SYMBOL_KEY_METADATA_PRESENT',reason:'symbol-keyed-properties-are-not-admission-metadata',path};
      }
      const lower=String(key).toLowerCase();
      if(!Object.prototype.hasOwnProperty.call(descriptor,'value')){
        return {classification:'ACCESSOR_PAYLOAD_PRESENT',reason:'accessor-properties-are-never-admission-metadata',path};
      }
      if(EXECUTABLE_KEYS.has(lower)){
        return {classification:'EXECUTABLE_PAYLOAD_PRESENT',reason:'admission-metadata-must-not-carry-executable-payload',path};
      }
      const child=descriptor.value;
      if(typeof child==='function')return {classification:'CALLABLE_PAYLOAD_PRESENT',reason:'callable-values-are-never-admission-metadata',path};
      if(child&&typeof child==='object')queue.push({value:child,path,depth:current.depth+1});
    }
  }
  return null;
}

export function assessForeignCapability(candidate,context={}){
  const base={
    schema:'zenomorph-gut-capability-admission/v0.3',
    organism:'ZENOMORPH',
    habitat:'NOSTROMO',
    executed:false,
    authorized:false,
    assimilationStage:'NONE',
    route:'HOLD'
  };

  if(typeof candidate==='function'){
    return {...base,status:'QUARANTINE',classification:'OPAQUE_CALLABLE',reason:'callable-values-are-never-admission-descriptors'};
  }
  if(candidate===null||typeof candidate!=='object'||Array.isArray(candidate)){
    return {...base,status:'IGNORE',classification:'NOT_CAPABILITY_DESCRIPTOR',reason:'structured-object-required'};
  }

  const unsafe=findUnsafeDescriptor(candidate);
  if(unsafe){
    return {
      ...base,
      status:'QUARANTINE',
      classification:unsafe.classification,
      reason:unsafe.reason,
      unsafePath:unsafe.path,
      identity:visibleIdentity(candidate)
    };
  }

  const keys=ownKeysLower(candidate);
  const explicitKind=firstScalar(candidate,['kind','type','class']);
  const kindLooksCapability=!!explicitKind&&/(capabilit|tool|plugin|adapter|module|interface|connector)/i.test(explicitKind);
  const identityMarked=hasAny(keys,IDENTITY_KEYS);
  if(!identityMarked&&!kindLooksCapability){
    return {...base,status:'IGNORE',classification:'NOT_CAPABILITY_DESCRIPTOR',reason:'no-structured-capability-identity'};
  }

  const identity=visibleIdentity(candidate);
  const hasProvenance=hasAny(keys,PROVENANCE_KEYS)||!!compact(context.source)||!!compact(context.provenanceFingerprint);
  const hasPermissionBoundary=hasAny(keys,PERMISSION_KEYS);
  const hasContract=hasAny(keys,CONTRACT_KEYS);

  const audit={identity:identity||null,hasProvenance,hasPermissionBoundary,hasContract};
  if(!hasProvenance){
    return {...base,...audit,status:'HOLD',classification:'FOREIGN_CAPABILITY',assimilationStage:'CANDIDATE_UNVERIFIED',reason:'provenance-required-before-assimilation'};
  }
  if(!hasPermissionBoundary){
    return {...base,...audit,status:'HOLD',classification:'FOREIGN_CAPABILITY',assimilationStage:'CANDIDATE_UNVERIFIED',reason:'permission-boundary-required-before-assimilation'};
  }
  if(!hasContract){
    return {...base,...audit,status:'HOLD',classification:'FOREIGN_CAPABILITY',assimilationStage:'CANDIDATE_UNVERIFIED',reason:'input-output-or-interface-contract-required-before-assimilation'};
  }

  return {
    ...base,
    ...audit,
    status:'HOLD',
    classification:'FOREIGN_CAPABILITY',
    assimilationStage:'CANDIDATE_FOR_ISOLATED_TEST',
    reason:'metadata-complete-enough-for-sandbox-evaluation-not-body-admission'
  };
}

export const capabilityAdmissionBoundary = Object.freeze({
  version:'0.3',
  executesForeignCode:false,
  grantsAuthorization:false,
  installsCapability:false,
  recursivelyRejectsExecutableMetadata:true,
  rejectsAccessorPropertiesWithoutInvokingThem:true,
  rejectsSymbolKeyedMetadata:true,
  descriptorScanLimits:{maxDepth:8,maxNodes:256},
  admissionRequires:['structured identity','provenance','permission boundary','interface or input/output contract'],
  nextStage:'isolated sandbox test with provenance and rollback evidence'
});
