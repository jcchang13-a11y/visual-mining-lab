const clean=v=>String(v??'').normalize('NFKC').replace(/\s+/g,' ').trim();
const REQUIRED=['DROPLET','MUTHER','SHROOMING'];

function canonicalProvenance(v){
  return clean(v).toLowerCase().replace(/[\p{P}\p{S}\s]+/gu,'');
}
function canonicalMaterial(v){
  return clean(v).toLowerCase().replace(/[\p{P}\p{S}\s]+/gu,'');
}

function returnsFromBranch(branch){
  const ctx=branch?.adjudicationContext;
  if(!ctx?.byOrgan)return [];
  return REQUIRED.map(o=>ctx.byOrgan[o]).filter(Boolean);
}

function groupCrossOrgan(rows,keyName,minLength=1){
  const grouped=new Map();
  for(const r of rows){
    const key=r[keyName];
    if(!key||key.length<minLength)continue;
    if(!grouped.has(key))grouped.set(key,[]);
    grouped.get(key).push(r);
  }
  return [...grouped.entries()].filter(([,rs])=>new Set(rs.map(r=>r.sourceOrgan)).size>1);
}

function provenanceAudit(returns){
  const normalized=(Array.isArray(returns)?returns:[])
    .filter(r=>REQUIRED.includes(clean(r?.sourceOrgan)))
    .map(r=>({
      sourceOrgan:clean(r.sourceOrgan),
      provenance:clean(r.provenance),
      provenanceIdentity:canonicalProvenance(r.provenance),
      material:clean(r.material),
      materialIdentity:canonicalMaterial(r.material),
      relation:clean(r.relation),
      packetId:clean(r.packetId),
      returnKey:clean(r.returnKey)
    }));

  const provenanceGroups=groupCrossOrgan(normalized,'provenanceIdentity');
  const collisions=provenanceGroups.map(([provenanceIdentity,rows])=>({
    provenanceIdentity,
    provenanceLabels:[...new Set(rows.map(r=>r.provenance))].sort(),
    organs:[...new Set(rows.map(r=>r.sourceOrgan))].sort(),
    formatMutationDetected:new Set(rows.map(r=>r.provenance)).size>1
  }));

  const materialGroups=groupCrossOrgan(normalized,'materialIdentity',24);
  const contentCollisions=materialGroups.map(([materialIdentity,rows])=>({
    materialIdentity,
    materialSamples:[...new Set(rows.map(r=>r.material))].slice(0,4),
    organs:[...new Set(rows.map(r=>r.sourceOrgan))].sort(),
    provenanceLabels:[...new Set(rows.map(r=>r.provenance))].sort(),
    distinctCanonicalProvenanceCount:new Set(rows.map(r=>r.provenanceIdentity).filter(Boolean)).size,
    formatMutationDetected:new Set(rows.map(r=>r.material)).size>1
  }));

  const receivedOrgans=[...new Set(normalized.map(r=>r.sourceOrgan))].sort();
  const uniqueProvenanceCount=new Set(normalized.map(r=>r.provenanceIdentity).filter(Boolean)).size;
  const complete=REQUIRED.every(o=>receivedOrgans.includes(o));
  const sharedProvenance=collisions.length>0;
  const sharedContent=contentCollisions.length>0;
  const formatMutationCollisions=collisions.filter(c=>c.formatMutationDetected).length;
  const contentFormatMutationCollisions=contentCollisions.filter(c=>c.formatMutationDetected).length;
  const replayRisk=sharedProvenance||sharedContent;

  return {
    requiredOrgans:[...REQUIRED],receivedOrgans,complete,
    receivedCount:normalized.length,uniqueProvenanceCount,collisions,contentCollisions,
    sharedProvenance,sharedContent,replayRisk,formatMutationCollisions,contentFormatMutationCollisions,
    structurallyDistinctProvenanceLabels:complete&&!sharedProvenance&&uniqueProvenanceCount===receivedOrgans.length,
    sourceIndependenceProven:false,
    status:replayRisk?'UPSTREAM_REPLAY_REVIEW_REQUIRED':complete?'PROVENANCE_LABELS_DISTINCT_NOT_INDEPENDENCE_PROOF':'PARTIAL_PROVENANCE_COVERAGE',
    boundary:'This guard compares bounded canonical provenance labels and bounded canonical returned material. Unicode width, case, whitespace, punctuation and symbol-only formatting differences are normalized. Cross-organ reuse of the same sufficiently long material is treated as replay risk even when provenance labels differ, preventing organ relabeling from masquerading as evidence-source diversity. Distinct labels and distinct material are still not proof of real-world source independence; collisions do not prove dependence or factual error.'
  };
}

export function guardVajraAdjudicationProvenance(vajra){
  const source=vajra&&typeof vajra==='object'?vajra:{unresolved:[]};
  let collisionBranches=0,auditedBranches=0,formatMutationCollisionBranches=0,contentCollisionBranches=0,contentFormatMutationCollisionBranches=0;
  const unresolved=(source.unresolved||[]).map(branch=>{
    const returns=returnsFromBranch(branch);
    if(!returns.length)return branch;
    auditedBranches++;
    const audit=provenanceAudit(returns);
    if(!audit.replayRisk)return {...branch,provenanceDiversityAudit:audit};
    collisionBranches++;
    if(audit.formatMutationCollisions>0)formatMutationCollisionBranches++;
    if(audit.sharedContent)contentCollisionBranches++;
    if(audit.contentFormatMutationCollisions>0)contentFormatMutationCollisionBranches++;
    const contentOnly=audit.sharedContent&&!audit.sharedProvenance;
    return {
      ...branch,
      provenanceDiversityAudit:audit,
      nextAction:contentOnly?'AUDIT_CROSS_ORGAN_CONTENT_REPLAY_BEFORE_REASSESSMENT':'AUDIT_SHARED_UPSTREAM_BEFORE_REASSESSMENT',
      nextQuestion:contentOnly
        ?'多個器官雖使用不同 provenance 標記，卻回傳相同或僅表面格式不同的實質材料；先確認是否只是同一上游內容被重新包裝，再決定是否需要真正不同來源的證據。'
        :'多個器官的回傳具有相同 provenance 或相同實質材料；先確認它們是否只是同一上游材料的不同加工版本，再決定是否需要補一個真正不同來源的證據。',
      closureBlocked:true,
      closureAuthority:'NONE',
      boundary:'Cross-organ replay risk changed VAJRA behavior: apparent multi-organ coverage cannot be treated as evidence-source diversity when canonical provenance or sufficiently long canonical material is reused. The original conflict and all raw caller-supplied returns remain preserved.'
    };
  });
  return {
    ...source,
    organ:'VAJRA',
    capability:'ADJUDICATION_PROVENANCE_AND_CONTENT_REPLAY_GUARD',
    version:'0.3.0',
    status:collisionBranches?'UPSTREAM_REPLAY_GUARD_ACTIVE':auditedBranches?'PROVENANCE_DIVERSITY_AUDITED':'NO_ADJUDICATION_CONTEXT_TO_AUDIT',
    unresolved,
    provenanceDiversity:{auditedBranches,collisionBranches,formatMutationCollisionBranches,contentCollisionBranches,contentFormatMutationCollisionBranches,sourceIndependenceProven:false},
    closureAuthority:'NONE',
    boundary:'Deterministic cross-organ provenance/content replay guard v0.3.0. It canonicalizes bounded superficial formatting in provenance labels and returned material, and blocks premature reassessment when multiple organs replay the same sufficiently long material even under different provenance labels. It does not infer semantic equivalence beyond this canonical identity, derivative-source relationships beyond observed replay, cryptographic identity, real-world independence, or factual truth.'
  };
}

export {provenanceAudit,canonicalProvenance,canonicalMaterial};
