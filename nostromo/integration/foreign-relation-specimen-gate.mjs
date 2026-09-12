/* ZENOMORPH / NOSTROMO unfamiliar-material relation-bearing gate v0.1
 * Candidate only. It does not mutate GUT or install itself into the body.
 * Purpose: refuse network-like material whose labels claim relational structure
 * when the specimen itself carries no usable relations.
 */

function scalar(value,max=240){
  if(value===null||value===undefined)return null;
  if(['string','number','boolean','bigint'].includes(typeof value)){
    const text=String(value).replace(/\s+/g,' ').trim();
    return text?text.slice(0,max):null;
  }
  return null;
}

export function deriveConsecutiveRelations(ways=[]){
  const relations=[];
  for(const way of Array.isArray(ways)?ways:[]){
    const wayId=scalar(way?.wayId);
    const refs=Array.isArray(way?.nodeRefs)?way.nodeRefs.map(v=>scalar(v)).filter(Boolean):[];
    for(let i=0;i<refs.length-1;i++){
      relations.push({source:refs[i],target:refs[i+1],wayId,index:i});
    }
  }
  return relations;
}

export function assessRelationBearingSpecimen(specimen,{minimumRelations=2}={}){
  const sourceSha=scalar(specimen?.source?.sourceBlobSha)||scalar(specimen?.source?.identity)||null;
  const relations=Array.isArray(specimen?.relations)
    ? specimen.relations.map((r,index)=>({source:scalar(r?.source),target:scalar(r?.target),index})).filter(r=>r.source&&r.target)
    : deriveConsecutiveRelations(specimen?.ways);

  const nonSelf=relations.filter(r=>r.source!==r.target);
  const relationCount=nonSelf.length;
  const hasTraceableSource=Boolean(sourceSha);
  const threshold=Number.isFinite(Number(minimumRelations))&&Number(minimumRelations)>0?Math.floor(Number(minimumRelations)):2;
  const pass=hasTraceableSource&&relationCount>=threshold;

  return {
    schema:'zenomorph-foreign-relation-specimen-gate/v0.1',
    organism:'ZENOMORPH',
    habitat:'NOSTROMO',
    bodyAdmission:false,
    persistentMutation:false,
    status:pass?'PASS':'HOLD',
    reason:pass?'traceable-relation-bearing-specimen':'insufficient-explicit-relational-evidence',
    sourceIdentity:sourceSha,
    hasTraceableSource,
    relationCount,
    minimumRelations:threshold,
    rejectedSelfRelations:relations.length-nonSelf.length,
    behaviorChangeCandidate:'NETWORK_LABELS_DO_NOT_COUNT_AS_NETWORK_EVIDENCE',
    nextStage:pass?'CANDIDATE_FOR_CROSS_DOMAIN_HELDOUT':'QUARANTINE_OR_ACQUIRE_MORE_STRUCTURE'
  };
}

export const relationSpecimenGateBoundary=Object.freeze({
  version:'0.1',
  installsCapability:false,
  mutatesGut:false,
  acceptsAnalogyAsEvidence:false,
  requiresTraceableSource:true,
  requiresExplicitRelations:true
});
