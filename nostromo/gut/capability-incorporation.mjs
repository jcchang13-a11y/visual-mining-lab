/* ZENOMORPH / NOSTROMO reversible capability incorporation candidate gate v0.7
 * A repeated-heldout PASS may enter a host-controlled reversible body-state trial.
 * This module never mutates the supplied body. It returns a candidate body copy plus
 * explicit rollback evidence. Permanent admission remains a separate decision.
 * v0.2 binds rollback evidence to a recursively canonicalized body fingerprint so
 * nested organ/capability state changes cannot disappear from identity evidence.
 * v0.3 keeps incorporation registry lookup aligned with the held-out boundary:
 * inherited entries and accessors fail closed and are never executed.
 * v0.4 makes body-copy failure an explicit fail-closed incorporation boundary rather
 * than allowing an uncloneable host state to escape as an uncaught exception.
 * v0.5 makes body fingerprinting descriptor-safe: enumerable accessors in host body
 * state fail closed without executing getters before reversible trial creation.
 * v0.6 closes hidden-state fingerprint gaps: symbols, non-enumerable object fields,
 * exotic nested objects, and custom array properties fail closed instead of being
 * omitted from rollback identity evidence or silently changed by structuredClone.
 * v0.7 makes rollback identity scalar-lossless: undefined, sparse-array holes, NaN,
 * infinities, negative zero, bigint, null, and ordinary JSON scalars remain distinct.
 */
import { runRepeatedHeldoutStress } from './capability-repeated-stress.mjs';

function cleanId(value){
  return typeof value==='string'&&/^[a-z0-9][a-z0-9._-]{0,79}$/i.test(value)?value:null;
}
function plainBody(value){
  if(!value||typeof value!=='object'||Array.isArray(value))return null;
  const proto=Object.getPrototypeOf(value);
  return proto===Object.prototype||proto===null?value:null;
}
function registeredCapability(registry,id){
  if(registry===null||(typeof registry!=='object'&&typeof registry!=='function')){
    return {ok:false,reason:'host-capability-registry-object-required'};
  }
  let descriptor;
  try{
    descriptor=Object.getOwnPropertyDescriptor(registry,id);
  }catch(error){
    return {ok:false,reason:'host-capability-registry-inspection-failed',error:String(error?.message||error).slice(0,240)};
  }
  if(!descriptor)return {ok:false,reason:'host-registered-capability-own-data-property-required'};
  if(!Object.prototype.hasOwnProperty.call(descriptor,'value'))return {ok:false,reason:'host-registered-capability-accessor-not-allowed'};
  if(typeof descriptor.value!=='function')return {ok:false,reason:'host-registered-capability-must-be-callable'};
  return {ok:true,callable:descriptor.value};
}
function stableStructure(value,seen=new WeakSet()){
  if(value===null)return ['null'];
  const type=typeof value;
  if(type==='undefined')return ['undefined'];
  if(type==='string')return ['string',value];
  if(type==='boolean')return ['boolean',value];
  if(type==='bigint')return ['bigint',value.toString(10)];
  if(type==='number'){
    if(Number.isNaN(value))return ['number','NaN'];
    if(value===Infinity)return ['number','Infinity'];
    if(value===-Infinity)return ['number','-Infinity'];
    if(Object.is(value,-0))return ['number','-0'];
    return ['number',value];
  }
  if(type==='symbol')throw new TypeError('body-state-symbol-value-not-supported');
  if(type==='function')throw new TypeError('body-state-function-value-not-supported');
  if(type!=='object')throw new TypeError('body-state-primitive-not-supported');
  if(seen.has(value))throw new TypeError('cyclic-body-state-not-supported');
  seen.add(value);
  try{
    if(Array.isArray(value)){
      const keys=Reflect.ownKeys(value);
      if(keys.some(key=>typeof key==='symbol'))throw new TypeError('body-state-symbol-property-not-supported');
      for(const key of keys){
        if(key==='length')continue;
        if(!/^(0|[1-9]\d*)$/.test(key))throw new TypeError('body-state-array-custom-property-not-supported');
        const index=Number(key);
        if(!Number.isSafeInteger(index)||index<0||index>=value.length)throw new TypeError('body-state-array-index-not-supported');
        const descriptor=Object.getOwnPropertyDescriptor(value,key);
        if(!descriptor||!Object.prototype.hasOwnProperty.call(descriptor,'value'))throw new TypeError('body-state-accessor-not-supported');
        if(descriptor.enumerable!==true)throw new TypeError('body-state-nonenumerable-property-not-supported');
      }
      const entries=[];
      for(let i=0;i<value.length;i++){
        const descriptor=Object.getOwnPropertyDescriptor(value,String(i));
        if(!descriptor){entries.push(['hole']);continue;}
        entries.push(['item',stableStructure(descriptor.value,seen)]);
      }
      return ['array',value.length,entries];
    }
    const proto=Object.getPrototypeOf(value);
    if(proto!==Object.prototype&&proto!==null)throw new TypeError('non-plain-body-state-not-supported');
    const keys=Reflect.ownKeys(value);
    if(keys.some(key=>typeof key==='symbol'))throw new TypeError('body-state-symbol-property-not-supported');
    const entries=[];
    for(const key of keys.sort()){
      const descriptor=Object.getOwnPropertyDescriptor(value,key);
      if(!descriptor||!Object.prototype.hasOwnProperty.call(descriptor,'value'))throw new TypeError('body-state-accessor-not-supported');
      if(descriptor.enumerable!==true)throw new TypeError('body-state-nonenumerable-property-not-supported');
      entries.push([key,stableStructure(descriptor.value,seen)]);
    }
    return ['object',entries];
  } finally {
    seen.delete(value);
  }
}
function fingerprint(value){
  const text=JSON.stringify(stableStructure(value));
  let h=2166136261;
  for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619);}
  return `fnv1a32:${(h>>>0).toString(16).padStart(8,'0')}`;
}

export function runReversibleIncorporationCandidate(candidate,cases,bodyState,{capabilityRegistry={},organRegistry={},downstreamOrganId,context={}}={}){
  const base={schema:'zenomorph-capability-incorporation/v0.7',organism:'ZENOMORPH',habitat:'NOSTROMO',installed:false,persistentMutation:false,bodyAdmission:false,registryLookup:'OWN_DATA_PROPERTY_ONLY',bodyCopyBoundary:'STRUCTURED_CLONE_FAIL_CLOSED',bodyPropertyRead:'COMPLETE_OWN_DATA_PROPERTY_DESCRIPTOR_SET_ONLY'};
  const body=plainBody(bodyState);
  if(!body)return {...base,status:'BLOCKED',assimilationStage:'INCORPORATION_BLOCKED',reason:'plain-host-body-state-required'};
  let beforeFingerprint;
  try{beforeFingerprint=fingerprint(body);}catch(error){return {...base,status:'BLOCKED',assimilationStage:'INCORPORATION_BLOCKED',reason:'fingerprintable-acyclic-data-property-host-body-state-required',error:String(error?.message||error)};}
  const stress=runRepeatedHeldoutStress(candidate,cases,{capabilityRegistry,organRegistry,downstreamOrganId,context});
  if(stress.status!=='PASS')return {...base,status:'HOLD',assimilationStage:'INCORPORATION_BLOCKED',reason:'repeated-heldout-pass-required',stress};
  const capabilityId=cleanId(candidate?.adapterId||candidate?.capabilityId||candidate?.toolId||candidate?.moduleId);
  if(!capabilityId)return {...base,status:'BLOCKED',assimilationStage:'INCORPORATION_BLOCKED',reason:'host-registered-capability-id-required',stress};
  const registration=registeredCapability(capabilityRegistry,capabilityId);
  if(!registration.ok)return {...base,status:'BLOCKED',assimilationStage:'INCORPORATION_BLOCKED',reason:registration.reason,stress,...(registration.error?{registryError:registration.error}:{})};
  let candidateBody;
  try{
    structuredClone(body);
    candidateBody=structuredClone(body);
  }catch(error){
    return {...base,status:'BLOCKED',assimilationStage:'INCORPORATION_BLOCKED',reason:'structured-cloneable-host-body-state-required',stress,beforeFingerprint,cloneError:String(error?.message||error).slice(0,240)};
  }
  const organs=plainBody(candidateBody.organs)?candidateBody.organs:{};
  candidateBody.organs={...organs};
  const existing=plainBody(candidateBody.capabilities)?candidateBody.capabilities:{};
  candidateBody.capabilities={...existing,[capabilityId]:{status:'REVERSIBLE_TRIAL_ONLY',provenanceFingerprint:stress.provenanceFingerprint||null,downstreamOrganId:cleanId(downstreamOrganId),admittedAt:null}};
  const candidateFingerprint=fingerprint(candidateBody);
  return {...base,status:'PASS',assimilationStage:'REVERSIBLE_BODY_CANDIDATE_CREATED',reason:'heldout-profile-verified-and-reversible-copy-created',capabilityId,stress,originalBodyUnchanged:fingerprint(body)===beforeFingerprint,beforeFingerprint,candidateFingerprint,candidateBody,rollback:{method:'discard-candidate-body-copy',restoresFingerprint:beforeFingerprint},fingerprintBoundary:{canonicalization:'typed-recursive-object-key-sort-array-position-and-hole-preserved',nestedStateBound:true,scalarIdentityTagged:true,sparseArrayHoleIdentityBound:true,cyclicStateAccepted:false,accessorStateAccepted:false,symbolStateAccepted:false,nonEnumerableStateAccepted:false,exoticObjectStateAccepted:false,arrayCustomPropertyAccepted:false,propertyRead:'complete own data property descriptor set only'},nextStage:'run whole-body regression against candidateBody; permanent admission requires separate explicit gate'};
}

export const incorporationBoundary=Object.freeze({version:'0.7',requiresRepeatedHeldoutPass:true,mutatesSuppliedBody:false,persistentMutation:false,permanentAdmissionOnPass:false,rollbackRequired:true,recursiveCanonicalFingerprint:true,scalarIdentityTagged:true,sparseArrayHoleIdentityBound:true,cyclicBodyStateAccepted:false,accessorBodyStateAccepted:false,symbolBodyStateAccepted:false,nonEnumerableBodyStateAccepted:false,exoticObjectBodyStateAccepted:false,arrayCustomPropertyAccepted:false,bodyPropertyRead:'complete own data property descriptor set only',registryLookup:'own data property only',inheritedRegistryEntries:false,accessorRegistryEntries:false,bodyCopyBoundary:'structuredClone fail closed',uncloneableBodyStateAccepted:false,nextStage:'whole-body regression on reversible candidate copy'});
