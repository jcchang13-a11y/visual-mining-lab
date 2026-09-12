/* ZENOMORPH / NOSTROMO GUT capability evidence-quality gate v0.1
 * Semantic anti-laundering layer for foreign-capability metadata.
 * This does not replace capability-admission.mjs and does not authorize, install,
 * execute, or incorporate anything. It only asks whether fields that claim to be
 * provenance / permission / contract evidence contain substantive text rather
 * than conventional placeholder tokens.
 */

const EVIDENCE_KEYS = new Set([
  'source','provider','publisher','provenance','sourcefingerprint','provenancefingerprint','origin',
  'permissions','permission','scopes','scope','access','authorization','authorisation',
  'interface','interfacename','inputschema','outputschema','inputs','outputs','contract','api'
]);

const PLACEHOLDER_TOKENS = new Set([
  'unknown','n/a','na','none','null','undefined','todo','tbd','pending','unspecified',
  'not provided','not applicable','changeme','placeholder'
]);

function normalizeText(value){
  return typeof value==='string'
    ? value.normalize('NFKC').replace(/\s+/g,' ').trim().toLowerCase()
    : null;
}

function isPlaceholderText(value){
  const normalized=normalizeText(value);
  if(normalized===null)return false;
  return normalized===''||PLACEHOLDER_TOKENS.has(normalized);
}

function scanEvidenceValue(value,path,seen,depth){
  if(depth>8)return {ok:false,reason:'evidence-depth-limit-exceeded',path};
  if(value===null||value===undefined)return {ok:false,reason:'nullish-evidence',path};
  if(typeof value==='string'){
    return isPlaceholderText(value)
      ? {ok:false,reason:'semantic-placeholder-evidence',path,value:value.slice(0,120)}
      : {ok:true};
  }
  if(typeof value==='number'||typeof value==='boolean'||typeof value==='bigint'){
    return {ok:false,reason:'scalar-placeholder-evidence',path};
  }
  if(typeof value==='function'||typeof value==='symbol'){
    return {ok:false,reason:'non-data-evidence',path};
  }
  if(typeof value!=='object')return {ok:false,reason:'unsupported-evidence-type',path};
  if(seen.has(value))return {ok:false,reason:'cyclic-evidence',path};
  seen.add(value);
  try{
    if(Array.isArray(value)){
      if(value.length===0)return {ok:false,reason:'empty-evidence-container',path};
      let substantive=false;
      for(let i=0;i<value.length;i++){
        const result=scanEvidenceValue(value[i],`${path}[${i}]`,seen,depth+1);
        if(result.ok)substantive=true;
        else if(result.reason==='semantic-placeholder-evidence'||result.reason==='scalar-placeholder-evidence')return result;
      }
      return substantive?{ok:true}:{ok:false,reason:'no-substantive-evidence',path};
    }
    const proto=Object.getPrototypeOf(value);
    if(proto!==Object.prototype&&proto!==null)return {ok:false,reason:'exotic-evidence-container',path};
    const descriptors=Object.getOwnPropertyDescriptors(value);
    const keys=Reflect.ownKeys(descriptors);
    if(keys.length===0)return {ok:false,reason:'empty-evidence-container',path};
    if(keys.some(key=>typeof key==='symbol'))return {ok:false,reason:'symbol-keyed-evidence',path};
    let substantive=false;
    for(const key of keys){
      const descriptor=descriptors[key];
      const childPath=`${path}.${String(key).slice(0,80)}`;
      if(!Object.prototype.hasOwnProperty.call(descriptor,'value'))return {ok:false,reason:'accessor-evidence',path:childPath};
      const result=scanEvidenceValue(descriptor.value,childPath,seen,depth+1);
      if(result.ok)substantive=true;
      else if(result.reason==='semantic-placeholder-evidence'||result.reason==='scalar-placeholder-evidence')return result;
    }
    return substantive?{ok:true}:{ok:false,reason:'no-substantive-evidence',path};
  } finally {
    seen.delete(value);
  }
}

export function assessCapabilityEvidenceQuality(candidate){
  const base={
    schema:'zenomorph-gut-capability-evidence-quality/v0.1',
    organism:'ZENOMORPH',
    habitat:'NOSTROMO',
    authorized:false,
    executed:false,
    installed:false,
    bodyAdmission:false,
    route:'HOLD'
  };
  if(candidate===null||typeof candidate!=='object'||Array.isArray(candidate)){
    return {...base,status:'BLOCKED',classification:'NOT_CAPABILITY_METADATA',reason:'structured-object-required'};
  }
  let descriptors;
  try{descriptors=Object.getOwnPropertyDescriptors(candidate);}catch{
    return {...base,status:'QUARANTINE',classification:'UNSAFE_METADATA',reason:'descriptor-inspection-failed'};
  }
  const checked=[];
  for(const key of Reflect.ownKeys(descriptors)){
    if(typeof key!=='string')continue;
    if(!EVIDENCE_KEYS.has(key.toLowerCase()))continue;
    const descriptor=descriptors[key];
    if(!Object.prototype.hasOwnProperty.call(descriptor,'value')){
      return {...base,status:'QUARANTINE',classification:'UNSAFE_EVIDENCE',reason:'accessor-evidence',unsafePath:`$.${key}`};
    }
    const result=scanEvidenceValue(descriptor.value,`$.${key}`,new WeakSet(),0);
    checked.push({field:key,ok:result.ok});
    if(!result.ok){
      return {
        ...base,
        status:'HOLD',
        classification:'EVIDENCE_QUALITY_INSUFFICIENT',
        reason:result.reason,
        evidencePath:result.path,
        ...(result.value!==undefined?{placeholderValue:result.value}:{}),
        checkedFields:checked
      };
    }
  }
  if(checked.length===0){
    return {...base,status:'HOLD',classification:'EVIDENCE_QUALITY_INSUFFICIENT',reason:'no-recognized-evidence-fields',checkedFields:[]};
  }
  return {
    ...base,
    status:'PASS',
    classification:'EVIDENCE_TEXT_SUBSTANTIVE',
    reason:'recognized-evidence-fields-contain-no-conventional-placeholders',
    checkedFields:checked,
    nextStage:'capability admission / sandbox gates remain authoritative'
  };
}

export const capabilityEvidenceQualityBoundary=Object.freeze({
  version:'0.1',
  placeholderNormalization:'Unicode NFKC + whitespace collapse + lowercase',
  rejectsSemanticPlaceholders:[...PLACEHOLDER_TOKENS],
  rejectsScalarPlaceholders:true,
  recursivelyChecksRecognizedEvidenceContainers:true,
  authorizationGranted:false,
  executionGranted:false,
  installationGranted:false,
  bodyAdmissionGranted:false
});
