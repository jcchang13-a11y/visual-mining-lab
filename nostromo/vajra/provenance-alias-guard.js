/* VAJRA provenance alias guard v0.1 — prevents contradictory provenance/provenanceFingerprint declarations from laundering source identity into dynamic decomposition. */
(function(root){
  const api=root.VajraEngine;
  if(!api||typeof api.planConflictDecomposition!=='function') throw new Error('VAJRA dynamic decomposition must be loaded before provenance alias guard');
  const basePlan=api.planConflictDecomposition;
  const clean=v=>String(v??'').replace(/\s+/g,' ').trim();
  const canonical=v=>typeof api.canonicalEvidenceProvenance==='function'
    ? api.canonicalEvidenceProvenance(clean(v))
    : clean(v).normalize('NFKC').toLowerCase().replace(/[\p{P}\p{S}\s]+/gu,'');

  const aliases=r=>{
    const primary=clean(r?.provenance), alias=clean(r?.provenanceFingerprint);
    if(!primary||!alias) return {conflict:false,primary,alias};
    const cp=canonical(primary), ca=canonical(alias);
    return {conflict:Boolean(cp&&ca&&cp!==ca),primary,alias,canonicalPrimary:cp,canonicalAlias:ca};
  };

  api.planConflictDecomposition=function guardedPlan(result,receipts=[]){
    const branches=Array.isArray(result?.unresolved)?result.unresolved:[];
    const scoped=new Set(branches.filter(b=>b?.status==='CONTESTED_BY_RECEIPTS'&&b?.lens==='source_quality').map(b=>`${clean(b.targetRef)}\u0000${clean(b.clauseRef)}`));
    const conflicts=[];
    for(const receipt of Array.isArray(receipts)?receipts:[]){
      const key=`${clean(receipt?.targetRef)}\u0000${clean(receipt?.clauseRef)}`;
      if(!scoped.has(key)) continue;
      const a=aliases(receipt);
      if(a.conflict) conflicts.push({targetRef:clean(receipt.targetRef),clauseRef:clean(receipt.clauseRef),reason:'provenance-alias-conflict',canonicalPrimary:a.canonicalPrimary,canonicalAlias:a.canonicalAlias});
    }
    if(conflicts.length){
      return {
        schema:'zenomorph-vajra-provenance-alias-guard/v0.1',
        status:'HOLD',
        reason:'conflicting-provenance-aliases',
        facets:[],
        provenanceAliasConflicts:conflicts,
        behaviorRegulation:null,
        boundary:'Same-scope contradictory provenance/provenanceFingerprint declarations cannot regulate decomposition. Canonical-equivalent dual declarations remain admissible; unrelated-scope conflicts do not poison the selected parent. This guard does not adjudicate source truth or prove source independence.'
      };
    }
    return basePlan(result,receipts);
  };
  api.provenanceAliasGuardVersion='0.1';
})(typeof window!=='undefined'?window:globalThis);
