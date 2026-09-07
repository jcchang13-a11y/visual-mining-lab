/* ZENOMORPH / NOSTROMO GUT foreign-capability admission v0.1
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
    for(const [key,v] of Object.entries(value||{})){
      if(String(key).toLowerCase()===name){
        const c=compact(v);
        if(c)return c;
      }
    }
  }
  return null;
}
function visibleIdentity(value){
  return firstScalar(value,['capabilityname','toolname','pluginname','adaptername','modulename','interfacename','capability','tool','plugin','adapter','module','interface','name']);
}

export function assessForeignCapability(candidate,context={}){
  const base={
    schema:'zenomorph-gut-capability-admission/v0.1',
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

  const keys=ownKeysLower(candidate);
  if(hasAny(keys,EXECUTABLE_KEYS)){
    return {
      ...base,
      status:'QUARANTINE',
      classification:'EXECUTABLE_PAYLOAD_PRESENT',
      reason:'admission-metadata-must-not-carry-executable-payload',
      identity:visibleIdentity(candidate)
    };
  }

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
  version:'0.1',
  executesForeignCode:false,
  grantsAuthorization:false,
  installsCapability:false,
  admissionRequires:['structured identity','provenance','permission boundary','interface or input/output contract'],
  nextStage:'isolated sandbox test with provenance and rollback evidence'
});
