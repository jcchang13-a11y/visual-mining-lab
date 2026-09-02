const clean=v=>String(v??'').normalize('NFKC').replace(/\s+/g,' ').trim();
const REQUIRED=['DROPLET','MUTHER','SHROOMING'];

function canonicalProvenance(v){
  return clean(v).toLowerCase().replace(/[\p{P}\p{S}\s]+/gu,'');
}

function returnsFromBranch(branch){
  const ctx=branch?.adjudicationContext;
  if(!ctx?.byOrgan)return [];
  return REQUIRED.map(o=>ctx.byOrgan[o]).filter(Boolean);
}

function provenanceAudit(returns){
  const normalized=(Array.isArray(returns)?returns:[])
    .filter(r=>REQUIRED.includes(clean(r?.sourceOrgan)))
    .map(r=>({
      sourceOrgan:clean(r.sourceOrgan),
      provenance:clean(r.provenance),
      provenanceIdentity:canonicalProvenance(r.provenance),
      packetId:clean(r.packetId),
      returnKey:clean(r.returnKey)
    }));
  const byProvenance=new Map();
  for(const r of normalized){
    if(!r.provenanceIdentity)continue;
    if(!byProvenance.has(r.provenanceIdentity))byProvenance.set(r.provenanceIdentity,[]);
    byProvenance.get(r.provenanceIdentity).push(r);
  }
  const collisions=[...byProvenance.entries()]
    .filter(([,rows])=>new Set(rows.map(r=>r.sourceOrgan)).size>1)
    .map(([provenanceIdentity,rows])=>({
      provenanceIdentity,
      provenanceLabels:[...new Set(rows.map(r=>r.provenance))].sort(),
      organs:[...new Set(rows.map(r=>r.sourceOrgan))].sort(),
      formatMutationDetected:new Set(rows.map(r=>r.provenance)).size>1
    }));
  const receivedOrgans=[...new Set(normalized.map(r=>r.sourceOrgan))].sort();
  const uniqueProvenanceCount=new Set(normalized.map(r=>r.provenanceIdentity).filter(Boolean)).size;
  const complete=REQUIRED.every(o=>receivedOrgans.includes(o));
  const sharedProvenance=collisions.length>0;
  const formatMutationCollisions=collisions.filter(c=>c.formatMutationDetected).length;
  return {
    requiredOrgans:[...REQUIRED],receivedOrgans,complete,
    receivedCount:normalized.length,uniqueProvenanceCount,collisions,
    sharedProvenance,formatMutationCollisions,
    structurallyDistinctProvenanceLabels:complete&&!sharedProvenance&&uniqueProvenanceCount===receivedOrgans.length,
    sourceIndependenceProven:false,
    status:sharedProvenance?'PROVENANCE_COLLISION_REVIEW_REQUIRED':complete?'PROVENANCE_LABELS_DISTINCT_NOT_INDEPENDENCE_PROOF':'PARTIAL_PROVENANCE_COVERAGE',
    boundary:'This guard compares a bounded canonical provenance identity: Unicode width, case, whitespace, punctuation and symbol-only formatting differences are normalized before cross-organ collision detection. This catches superficial provenance-label mutations that would otherwise inflate apparent source diversity. Distinct canonical labels are not proof of real-world source independence, and collisions do not prove dependence; they only block treating organ-count diversity as evidence-source diversity.'
  };
}

export function guardVajraAdjudicationProvenance(vajra){
  const source=vajra&&typeof vajra==='object'?vajra:{unresolved:[]};
  let collisionBranches=0,auditedBranches=0,formatMutationCollisionBranches=0;
  const unresolved=(source.unresolved||[]).map(branch=>{
    const returns=returnsFromBranch(branch);
    if(!returns.length)return branch;
    auditedBranches++;
    const audit=provenanceAudit(returns);
    if(!audit.sharedProvenance)return {...branch,provenanceDiversityAudit:audit};
    collisionBranches++;
    if(audit.formatMutationCollisions>0)formatMutationCollisionBranches++;
    return {
      ...branch,
      provenanceDiversityAudit:audit,
      nextAction:'AUDIT_SHARED_PROVENANCE_BEFORE_REASSESSMENT',
      nextQuestion:'多個器官的回傳具有相同或僅表面格式不同的 provenance 標記；先確認它們是否只是同一上游材料的不同加工版本，再決定是否需要補一個真正不同來源的證據。',
      closureBlocked:true,
      closureAuthority:'NONE',
      boundary:'Shared canonical provenance identity changed VAJRA behavior: apparent three-organ coverage cannot be treated as evidence-source diversity. Superficial provenance-label mutation cannot bypass this guard. The original conflict and all returned materials remain preserved.'
    };
  });
  return {
    ...source,
    organ:'VAJRA',
    capability:'ADJUDICATION_PROVENANCE_DIVERSITY_GUARD',
    version:'0.2.0',
    status:collisionBranches?'PROVENANCE_COLLISION_GUARD_ACTIVE':auditedBranches?'PROVENANCE_DIVERSITY_AUDITED':'NO_ADJUDICATION_CONTEXT_TO_AUDIT',
    unresolved,
    provenanceDiversity:{auditedBranches,collisionBranches,formatMutationCollisionBranches,sourceIndependenceProven:false},
    closureAuthority:'NONE',
    boundary:'Deterministic cross-organ provenance collision guard v0.2.0. It normalizes bounded superficial provenance-label formatting before collision comparison, preventing case/spacing/punctuation/symbol mutations from masquerading as new source identities. It does not infer semantic equivalence, derivative-source relationships, cryptographic identity, or real-world independence from fingerprints alone.'
  };
}

export {provenanceAudit,canonicalProvenance};
