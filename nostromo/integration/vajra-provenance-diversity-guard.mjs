const clean=v=>String(v??'').normalize('NFKC').replace(/\s+/g,' ').trim();
const REQUIRED=['DROPLET','MUTHER','SHROOMING'];

function canonicalProvenance(v){
  return clean(v).toLowerCase().replace(/[\p{P}\p{S}\s]+/gu,'');
}
function canonicalMaterial(v){
  return clean(v).toLowerCase().replace(/[\p{P}\p{S}\s]+/gu,'');
}
function shingleSet(v,size=5){
  const s=canonicalMaterial(v);
  const out=new Set();
  if(s.length<size)return out;
  for(let i=0;i<=s.length-size;i++)out.add(s.slice(i,i+size));
  return out;
}
function jaccard(a,b){
  if(!a.size||!b.size)return 0;
  let intersection=0;
  for(const x of a)if(b.has(x))intersection++;
  return intersection/(a.size+b.size-intersection);
}
function boundedNearDuplicate(a,b){
  const ca=canonicalMaterial(a),cb=canonicalMaterial(b);
  if(ca.length<48||cb.length<48)return {match:false,score:0,mode:'TOO_SHORT'};
  if(ca===cb)return {match:true,score:1,mode:'CANONICAL_EXACT'};
  const shorter=ca.length<=cb.length?ca:cb,longer=ca.length>cb.length?ca:cb;
  const containment=longer.includes(shorter)?shorter.length/longer.length:0;
  const grams=jaccard(shingleSet(ca),shingleSet(cb));
  const score=Math.max(containment,grams);
  return {match:score>=0.82,score:Number(score.toFixed(4)),mode:containment>=grams?'BOUNDED_CONTAINMENT':'CHAR_5GRAM_JACCARD'};
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

function nearContentAudit(rows){
  const collisions=[];
  for(let i=0;i<rows.length;i++){
    for(let j=i+1;j<rows.length;j++){
      const a=rows[i],b=rows[j];
      if(a.sourceOrgan===b.sourceOrgan)continue;
      if(a.materialIdentity&&a.materialIdentity===b.materialIdentity)continue;
      const probe=boundedNearDuplicate(a.material,b.material);
      if(!probe.match)continue;
      collisions.push({
        organs:[a.sourceOrgan,b.sourceOrgan].sort(),
        provenanceLabels:[a.provenance,b.provenance],
        materialSamples:[a.material,b.material],
        similarityScore:probe.score,
        similarityMode:probe.mode,
        boundary:'Bounded lexical near-replay signal only; this does not prove semantic identity or common upstream origin.'
      });
    }
  }
  return collisions;
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
  const nearContentCollisions=nearContentAudit(normalized);

  const receivedOrgans=[...new Set(normalized.map(r=>r.sourceOrgan))].sort();
  const uniqueProvenanceCount=new Set(normalized.map(r=>r.provenanceIdentity).filter(Boolean)).size;
  const complete=REQUIRED.every(o=>receivedOrgans.includes(o));
  const sharedProvenance=collisions.length>0;
  const sharedContent=contentCollisions.length>0;
  const nearSharedContent=nearContentCollisions.length>0;
  const formatMutationCollisions=collisions.filter(c=>c.formatMutationDetected).length;
  const contentFormatMutationCollisions=contentCollisions.filter(c=>c.formatMutationDetected).length;
  const replayRisk=sharedProvenance||sharedContent||nearSharedContent;

  return {
    requiredOrgans:[...REQUIRED],receivedOrgans,complete,
    receivedCount:normalized.length,uniqueProvenanceCount,collisions,contentCollisions,nearContentCollisions,
    sharedProvenance,sharedContent,nearSharedContent,replayRisk,formatMutationCollisions,contentFormatMutationCollisions,
    structurallyDistinctProvenanceLabels:complete&&!sharedProvenance&&uniqueProvenanceCount===receivedOrgans.length,
    sourceIndependenceProven:false,
    status:replayRisk?'UPSTREAM_REPLAY_REVIEW_REQUIRED':complete?'PROVENANCE_LABELS_DISTINCT_NOT_INDEPENDENCE_PROOF':'PARTIAL_PROVENANCE_COVERAGE',
    boundary:'This guard compares bounded canonical provenance labels, canonical returned material, and a bounded lexical near-replay signal using containment/character 5-gram similarity for sufficiently long cross-organ material. Unicode width, case, whitespace, punctuation and symbol-only formatting differences are normalized. Exact or near replay across organs is treated as replay risk, preventing light wrappers or organ relabeling from masquerading as evidence-source diversity. Distinct labels and distinct material are still not proof of real-world source independence; similarity does not prove semantic identity, derivation, dependence or factual error.'
  };
}

export function guardVajraAdjudicationProvenance(vajra){
  const source=vajra&&typeof vajra==='object'?vajra:{unresolved:[]};
  let collisionBranches=0,auditedBranches=0,formatMutationCollisionBranches=0,contentCollisionBranches=0,contentFormatMutationCollisionBranches=0,nearContentCollisionBranches=0;
  const unresolved=(source.unresolved||[]).map(branch=>{
    const returns=returnsFromBranch(branch);
    if(!returns.length)return branch;
    auditedBranches++;
    const audit=provenanceAudit(returns);
    if(!audit.replayRisk)return {...branch,provenanceDiversityAudit:audit};
    collisionBranches++;
    if(audit.formatMutationCollisions>0)formatMutationCollisionBranches++;
    if(audit.sharedContent)contentCollisionBranches++;
    if(audit.nearSharedContent)nearContentCollisionBranches++;
    if(audit.contentFormatMutationCollisions>0)contentFormatMutationCollisionBranches++;
    const contentOnly=(audit.sharedContent||audit.nearSharedContent)&&!audit.sharedProvenance;
    return {
      ...branch,
      provenanceDiversityAudit:audit,
      nextAction:contentOnly?'AUDIT_CROSS_ORGAN_CONTENT_REPLAY_BEFORE_REASSESSMENT':'AUDIT_SHARED_UPSTREAM_BEFORE_REASSESSMENT',
      nextQuestion:contentOnly
        ?'多個器官雖使用不同 provenance 標記，卻回傳相同、僅表面格式不同，或高度重疊的實質材料；先確認是否只是同一上游內容被重新包裝，再決定是否需要真正不同來源的證據。'
        :'多個器官的回傳具有相同 provenance 或重複／高度重疊的實質材料；先確認它們是否只是同一上游材料的不同加工版本，再決定是否需要補一個真正不同來源的證據。',
      closureBlocked:true,
      closureAuthority:'NONE',
      boundary:'Cross-organ replay risk changed VAJRA behavior: apparent multi-organ coverage cannot be treated as evidence-source diversity when canonical provenance, exact canonical material, or bounded high-overlap material is reused. The original conflict and all raw caller-supplied returns remain preserved. Near-replay detection is lexical containment/5-gram similarity only and does not claim semantic identity.'
    };
  });
  return {
    ...source,
    organ:'VAJRA',
    capability:'ADJUDICATION_PROVENANCE_CONTENT_AND_NEAR_REPLAY_GUARD',
    version:'0.3.1',
    status:collisionBranches?'UPSTREAM_REPLAY_GUARD_ACTIVE':auditedBranches?'PROVENANCE_DIVERSITY_AUDITED':'NO_ADJUDICATION_CONTEXT_TO_AUDIT',
    unresolved,
    provenanceDiversity:{auditedBranches,collisionBranches,formatMutationCollisionBranches,contentCollisionBranches,contentFormatMutationCollisionBranches,nearContentCollisionBranches,sourceIndependenceProven:false},
    closureAuthority:'NONE',
    boundary:'Deterministic cross-organ provenance/content replay guard v0.3.1. It canonicalizes bounded superficial formatting and adds a bounded lexical near-replay check for sufficiently long material using containment/character 5-gram similarity. It blocks premature reassessment when organs replay exact or highly overlapping material under different labels. It does not infer semantic equivalence, derivative-source relationships, cryptographic identity, real-world independence, or factual truth.'
  };
}

export {provenanceAudit,canonicalProvenance,canonicalMaterial,boundedNearDuplicate};
