/* ZENOMORPH / NOSTROMO GUT capability evidence role-separation gate v0.4
 * Prevents semantic evidence laundering by reusing the same substantive token
 * as provenance, permission, and interface/contract evidence, including trivial
 * wrapper/prefix/suffix laundering, separator/punctuation fragmentation, and
 * Unicode format-control fragmentation.
 * This gate is additive: evidence-quality, admission, sandbox, and incorporation
 * remain authoritative. Passing this gate grants no execution or body admission.
 */
import {assessCapabilityEvidenceQuality} from './capability-evidence-quality.mjs';

const SOURCE_KEYS=new Set(['source','provider','publisher','provenance','sourcefingerprint','provenancefingerprint','origin']);
const PERMISSION_KEYS=new Set(['permissions','permission','scopes','scope','access','authorization','authorisation']);
const INTERFACE_KEYS=new Set(['interface','interfacename','inputschema','outputschema','inputs','outputs','contract','api']);
const MIN_SUBSTANTIVE_LENGTH=12;
const MIN_SKELETON_LENGTH=12;

function normalizeText(value){
  return typeof value==='string'?value.normalize('NFKC').replace(/\s+/g,' ').trim().toLowerCase():null;
}

function containsFormatControl(value){
  return typeof value==='string'&&/\p{Cf}/u.test(value);
}

function semanticSkeleton(value){
  const normalized=normalizeText(value);
  if(!normalized)return null;
  const skeleton=normalized.replace(/[\p{P}\p{S}\p{Cf}\s]+/gu,'');
  return skeleton.length>=MIN_SKELETON_LENGTH?skeleton:null;
}

function collectAtoms(value,seen=new WeakSet(),depth=0,out=new Set()){
  if(depth>8||value===null||value===undefined)return out;
  if(typeof value==='string'){
    const atom=normalizeText(value);
    if(atom)out.add(atom);
    return out;
  }
  if(typeof value!=='object')return out;
  if(seen.has(value))return out;
  seen.add(value);
  try{
    if(Array.isArray(value)){
      for(const item of value)collectAtoms(item,seen,depth+1,out);
      return out;
    }
    const descriptors=Object.getOwnPropertyDescriptors(value);
    for(const key of Reflect.ownKeys(descriptors)){
      if(typeof key==='symbol')continue;
      const descriptor=descriptors[key];
      if(Object.prototype.hasOwnProperty.call(descriptor,'value'))collectAtoms(descriptor.value,seen,depth+1,out);
    }
    return out;
  } finally { seen.delete(value); }
}

function roleFor(key){
  const k=key.toLowerCase();
  if(SOURCE_KEYS.has(k))return 'source';
  if(PERMISSION_KEYS.has(k))return 'permission';
  if(INTERFACE_KEYS.has(k))return 'interface';
  return null;
}

function collisionBetween(atomsA,atomsB){
  for(const atomA of atomsA){
    for(const atomB of atomsB){
      if(atomA===atomB)return {kind:'exact',substantive:atomA,atomA,atomB};
      const shorter=atomA.length<=atomB.length?atomA:atomB;
      const longer=atomA.length<=atomB.length?atomB:atomA;
      if(shorter.length>=MIN_SUBSTANTIVE_LENGTH&&longer.includes(shorter)){
        return {kind:'wrapped',substantive:shorter,atomA,atomB};
      }
      const skeletonA=semanticSkeleton(atomA);
      const skeletonB=semanticSkeleton(atomB);
      if(skeletonA&&skeletonB){
        const formatControlled=containsFormatControl(atomA)||containsFormatControl(atomB);
        if(skeletonA===skeletonB){
          return {kind:formatControlled?'format-control-fragmented':'separator-fragmented',substantive:skeletonA,atomA,atomB};
        }
        const skeletonShorter=skeletonA.length<=skeletonB.length?skeletonA:skeletonB;
        const skeletonLonger=skeletonA.length<=skeletonB.length?skeletonB:skeletonA;
        if(skeletonShorter.length>=MIN_SKELETON_LENGTH&&skeletonLonger.includes(skeletonShorter)){
          return {kind:formatControlled?'format-control-wrapped':'separator-wrapped',substantive:skeletonShorter,atomA,atomB};
        }
      }
    }
  }
  return null;
}

function reasonForCollision(kind){
  if(kind==='exact')return 'cross-role-evidence-reuse';
  if(kind==='wrapped')return 'cross-role-evidence-wrapped-reuse';
  if(kind.startsWith('format-control-'))return 'cross-role-evidence-format-control-laundering';
  return 'cross-role-evidence-separator-laundering';
}

export function assessCapabilityEvidenceRoleSeparation(candidate){
  const base={
    schema:'zenomorph-gut-capability-evidence-role-separation/v0.4',
    organism:'ZENOMORPH',habitat:'NOSTROMO',authorized:false,executed:false,installed:false,bodyAdmission:false,route:'HOLD'
  };
  const quality=assessCapabilityEvidenceQuality(candidate);
  if(quality.status!=='PASS'){
    return {...base,status:'HOLD',classification:'UPSTREAM_EVIDENCE_QUALITY_NOT_PASSED',reason:'evidence-quality-gate-must-pass-first',upstream:{status:quality.status,reason:quality.reason}};
  }
  let descriptors;
  try{descriptors=Object.getOwnPropertyDescriptors(candidate);}catch{
    return {...base,status:'QUARANTINE',classification:'UNSAFE_METADATA',reason:'descriptor-inspection-failed'};
  }
  const roles={source:new Set(),permission:new Set(),interface:new Set()};
  for(const key of Reflect.ownKeys(descriptors)){
    if(typeof key!=='string')continue;
    const role=roleFor(key);
    if(!role)continue;
    const descriptor=descriptors[key];
    if(!Object.prototype.hasOwnProperty.call(descriptor,'value'))continue;
    collectAtoms(descriptor.value,new WeakSet(),0,roles[role]);
  }
  const active=Object.entries(roles).filter(([,atoms])=>atoms.size>0);
  for(let i=0;i<active.length;i++){
    for(let j=i+1;j<active.length;j++){
      const [roleA,atomsA]=active[i], [roleB,atomsB]=active[j];
      const collision=collisionBetween(atomsA,atomsB);
      if(collision){
        return {...base,status:'HOLD',classification:'EVIDENCE_ROLE_COLLISION',reason:reasonForCollision(collision.kind),roles:[roleA,roleB],collisionKind:collision.kind,reusedAtom:collision.substantive.slice(0,160),observedAtoms:[collision.atomA.slice(0,160),collision.atomB.slice(0,160)]};
      }
    }
  }
  return {...base,status:'PASS',classification:'EVIDENCE_ROLES_SEPARATED',reason:'no-substantive-evidence-token-is-reused, trivially wrapped, separator-laundered, or format-control-laundered across source-permission-interface roles',roleAtomCounts:Object.fromEntries(Object.entries(roles).map(([k,v])=>[k,v.size])),nextStage:'capability admission / sandbox gates remain authoritative'};
}

export const capabilityEvidenceRoleSeparationBoundary=Object.freeze({
  version:'0.4',normalization:'Unicode NFKC + whitespace collapse + lowercase',separatorSkeleton:'strip Unicode punctuation, symbols, format controls (General_Category=Cf), and whitespace for bounded cross-role collision checks',rejectsCrossRoleTokenReuse:true,rejectsTrivialWrappedReuse:true,rejectsSeparatorLaundering:true,rejectsFormatControlLaundering:true,minWrappedReuseLength:MIN_SUBSTANTIVE_LENGTH,minSkeletonLength:MIN_SKELETON_LENGTH,authorizationGranted:false,executionGranted:false,installationGranted:false,bodyAdmissionGranted:false
});
