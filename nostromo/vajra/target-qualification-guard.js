/* VAJRA target qualification guard v0.1 — prevents nonqualifying cross-organ receipts from polluting multi-parent dynamic-decomposition target selection. */
(function(root){
  const api=root.VajraEngine;
  if(!api||typeof api.planConflictDecomposition!=='function') throw new Error('VAJRA_DYNAMIC_DECOMPOSITION_REQUIRED_BEFORE_TARGET_QUALIFICATION_GUARD');
  if(api.dynamicTargetQualificationGuardVersion==='0.1') return;

  const basePlan=api.planConflictDecomposition.bind(api);
  const TRIAGE_CLASSES=new Set(['PROVENANCE_COLLISION','DUPLICATE_CONTAMINATION','MIXED_CONTAMINATION']);
  const clean=v=>String(v??'').replace(/\s+/g,' ').trim();
  const canonicalProvenance=v=>typeof api.canonicalEvidenceProvenance==='function'
    ? api.canonicalEvidenceProvenance(clean(v))
    : clean(v).normalize('NFKC').toLowerCase().replace(/[\p{P}\p{S}\s]+/gu,'');

  function isPrequalifiedTargetReceipt(receipt){
    if(!receipt||typeof receipt!=='object') return false;
    const organ=clean(receipt.organ||receipt.sourceOrgan);
    const status=clean(receipt.status);
    const provenance=clean(receipt.provenance||receipt.provenanceFingerprint);
    const classification=clean(receipt.triageClassification||receipt.classification).toUpperCase();
    const targetRef=clean(receipt.targetRef),clauseRef=clean(receipt.clauseRef);
    return organ==='GUT' && status==='COMPLETED' && !!targetRef && !!clauseRef && !!provenance && !!canonicalProvenance(provenance) && TRIAGE_CLASSES.has(classification);
  }

  function guardedPlan(result,receipts=[]){
    const branches=Array.isArray(result?.unresolved)?result.unresolved:[];
    const parents=branches.filter(b=>b?.status==='CONTESTED_BY_RECEIPTS'&&b?.lens==='source_quality');
    if(parents.length<=1) return basePlan(result,receipts);

    const eligibleTargets=new Map();
    for(const receipt of Array.isArray(receipts)?receipts:[]){
      if(!isPrequalifiedTargetReceipt(receipt)) continue;
      const targetRef=clean(receipt.targetRef),clauseRef=clean(receipt.clauseRef);
      const parent=parents.find(p=>clean(p.targetRef)===targetRef&&clean(p.clauseRef)===clauseRef);
      if(parent) eligibleTargets.set(`${targetRef}\u0000${clauseRef}`,parent);
    }

    if(eligibleTargets.size!==1) return basePlan(result,receipts);

    const selected=[...eligibleTargets.values()][0];
    const narrowed={...result,unresolved:branches.filter(b=>b===selected||!(b?.status==='CONTESTED_BY_RECEIPTS'&&b?.lens==='source_quality'))};
    const out=basePlan(narrowed,receipts);
    if(!out||typeof out!=='object') return out;
    return {
      ...out,
      targetQualificationGuard:{
        version:'0.1',
        selectedTarget:{targetRef:selected.targetRef,clauseRef:selected.clauseRef},
        eligibleTargetCount:1,
        rule:'Only completed GUT contamination-triage receipts with nonempty canonical provenance and a supported decomposition classification may influence multi-parent target selection. Other receipts remain visible to downstream rejection audit but cannot create an additional target candidate.'
      }
    };
  }

  api.planConflictDecomposition=guardedPlan;
  api.dynamicTargetQualificationGuardVersion='0.1';
})(typeof window!=='undefined'?window:globalThis);
