const clean=v=>String(v??'').replace(/\s+/g,' ').trim();
const REQUIRED=['DROPLET','MUTHER','SHROOMING'];

function returnsFromBranch(branch){
  const ctx=branch?.adjudicationContext;
  if(!ctx?.byOrgan)return [];
  return REQUIRED.map(o=>ctx.byOrgan[o]).filter(Boolean);
}

function provenanceAudit(returns){
  const normalized=(Array.isArray(returns)?returns:[])
    .filter(r=>REQUIRED.includes(clean(r?.sourceOrgan)))
    .map(r=>({sourceOrgan:clean(r.sourceOrgan),provenance:clean(r.provenance),packetId:clean(r.packetId),returnKey:clean(r.returnKey)}));
  const byProvenance=new Map();
  for(const r of normalized){
    if(!r.provenance)continue;
    if(!byProvenance.has(r.provenance))byProvenance.set(r.provenance,[]);
    byProvenance.get(r.provenance).push(r.sourceOrgan);
  }
  const collisions=[...byProvenance.entries()]
    .filter(([,organs])=>new Set(organs).size>1)
    .map(([provenance,organs])=>({provenance,organs:[...new Set(organs)].sort()}));
  const receivedOrgans=[...new Set(normalized.map(r=>r.sourceOrgan))].sort();
  const uniqueProvenanceCount=new Set(normalized.map(r=>r.provenance).filter(Boolean)).size;
  const complete=REQUIRED.every(o=>receivedOrgans.includes(o));
  const sharedProvenance=collisions.length>0;
  return {
    requiredOrgans:[...REQUIRED],receivedOrgans,complete,
    receivedCount:normalized.length,uniqueProvenanceCount,collisions,
    sharedProvenance,
    structurallyDistinctProvenanceLabels:complete&&!sharedProvenance&&uniqueProvenanceCount===receivedOrgans.length,
    sourceIndependenceProven:false,
    status:sharedProvenance?'PROVENANCE_COLLISION_REVIEW_REQUIRED':complete?'PROVENANCE_LABELS_DISTINCT_NOT_INDEPENDENCE_PROOF':'PARTIAL_PROVENANCE_COVERAGE',
    boundary:'This guard detects exact provenance-label reuse across organ returns. Distinct labels are not proof of real-world source independence, and collisions do not prove dependence; they block treating organ-count diversity as evidence-source diversity.'
  };
}

export function guardVajraAdjudicationProvenance(vajra){
  const source=vajra&&typeof vajra==='object'?vajra:{unresolved:[]};
  let collisionBranches=0,auditedBranches=0;
  const unresolved=(source.unresolved||[]).map(branch=>{
    const returns=returnsFromBranch(branch);
    if(!returns.length)return branch;
    auditedBranches++;
    const audit=provenanceAudit(returns);
    if(!audit.sharedProvenance)return {...branch,provenanceDiversityAudit:audit};
    collisionBranches++;
    return {
      ...branch,
      provenanceDiversityAudit:audit,
      nextAction:'AUDIT_SHARED_PROVENANCE_BEFORE_REASSESSMENT',
      nextQuestion:'多個器官的回傳重用了同一 provenance 標記；先確認它們是否只是同一上游材料的不同加工版本，再決定是否需要補一個真正不同來源的證據。',
      closureBlocked:true,
      closureAuthority:'NONE',
      boundary:'Shared provenance labels changed VAJRA behavior: apparent three-organ coverage cannot be treated as evidence-source diversity. The original conflict and all returned materials remain preserved.'
    };
  });
  return {
    ...source,
    organ:'VAJRA',
    capability:'ADJUDICATION_PROVENANCE_DIVERSITY_GUARD',
    version:'0.1.0',
    status:collisionBranches?'PROVENANCE_COLLISION_GUARD_ACTIVE':auditedBranches?'PROVENANCE_DIVERSITY_AUDITED':'NO_ADJUDICATION_CONTEXT_TO_AUDIT',
    unresolved,
    provenanceDiversity:{auditedBranches,collisionBranches,sourceIndependenceProven:false},
    closureAuthority:'NONE',
    boundary:'Deterministic cross-organ provenance-label collision guard. It prevents organ-count diversity from masquerading as source diversity, but it does not infer semantic equivalence, derivative-source relationships, or real-world independence from fingerprints alone.'
  };
}

export {provenanceAudit};
