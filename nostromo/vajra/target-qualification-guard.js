/* VAJRA target qualification guard v0.2 — prevents nonqualifying cross-organ receipts from polluting multi-parent dynamic-decomposition target selection. */
(function(root){
  const api=root.VajraEngine;
  if(!api||typeof api.planConflictDecomposition!=='function') throw new Error('VAJRA_DYNAMIC_DECOMPOSITION_REQUIRED_BEFORE_TARGET_QUALIFICATION_GUARD');
  if(api.dynamicTargetQualificationGuardVersion==='0.2') return;

  const basePlan=api.planConflictDecomposition.bind(api);
  const TRIAGE_CLASSES=new Set(['PROVENANCE_COLLISION','DUPLICATE_CONTAMINATION','MIXED_CONTAMINATION']);
  const clean=v=>String(v??'').replace(/\s+/g,' ').trim();
  const canonicalProvenance=v=>typeof api.canonicalEvidenceProvenance==='function'
    ? api.canonicalEvidenceProvenance(clean(v))
    : clean(v).normalize('NFKC').toLowerCase().replace(/[\p{P}\p{S}\s]+/gu,'');

  function prequalify(receipt){
    if(!receipt||typeof receipt!=='object') return {ok:false,reason:'receipt-object-required'};
    const targetRef=clean(receipt.targetRef),clauseRef=clean(receipt.clauseRef);
    const organ=clean(receipt.organ||receipt.sourceOrgan);
    const status=clean(receipt.status);
    const provenance=clean(receipt.provenance||receipt.provenanceFingerprint);
    const classification=clean(receipt.triageClassification||receipt.classification).toUpperCase();
    if(!targetRef||!clauseRef) return {ok:false,reason:'target-scope-required'};
    if(organ!=='GUT') return {ok:false,reason:'gut-receipt-required'};
    if(status!=='COMPLETED') return {ok:false,reason:'completed-receipt-required'};
    if(!provenance) return {ok:false,reason:'provenance-required'};
    if(!canonicalProvenance(provenance)) return {ok:false,reason:'canonical-provenance-empty'};
    if(!TRIAGE_CLASSES.has(classification)) return {ok:false,reason:'non-decomposing-triage-class'};
    return {ok:true,targetRef,clauseRef,classification};
  }

  function guardedPlan(result,receipts=[]){
    const branches=Array.isArray(result?.unresolved)?result.unresolved:[];
    const parents=branches.filter(b=>b?.status==='CONTESTED_BY_RECEIPTS'&&b?.lens==='source_quality');
    if(parents.length<=1) return basePlan(result,receipts);

    const eligibleTargets=new Map();
    const guardRejected=[];
    for(const receipt of Array.isArray(receipts)?receipts:[]){
      const q=prequalify(receipt);
      if(!q.ok){guardRejected.push({reason:q.reason,targetRef:clean(receipt?.targetRef),clauseRef:clean(receipt?.clauseRef)});continue;}
      const parent=parents.find(p=>clean(p.targetRef)===q.targetRef&&clean(p.clauseRef)===q.clauseRef);
      if(parent) eligibleTargets.set(`${q.targetRef}\u0000${q.clauseRef}`,parent);
      else guardRejected.push({reason:'no-contested-parent-scope-match',targetRef:q.targetRef,clauseRef:q.clauseRef});
    }

    if(eligibleTargets.size===0){
      return {
        schema:'zenomorph-vajra-target-qualification-guard/v0.2',
        status:'HOLD',
        reason:'qualifying-targeted-contested-source-quality-parent-required',
        parents:parents.map(p=>({targetRef:p.targetRef,clauseRef:p.clauseRef,lens:p.lens,status:p.status,closed:false})),
        facets:[],
        rejected:guardRejected,
        targetQualificationGuard:{version:'0.2',eligibleTargetCount:0,rule:'Only prequalified completed GUT contamination-triage receipts may nominate a target when multiple contested source-quality parents are open.'},
        boundary:'Nonqualifying cross-organ, incomplete, provenance-empty, unsupported, or unscoped traffic cannot nominate a contested parent. With zero qualifying target candidates VAJRA remains on HOLD rather than allowing receipt scope alone to alter routing.'
      };
    }

    if(eligibleTargets.size>1) return basePlan(result,receipts);

    const selected=[...eligibleTargets.values()][0];
    const narrowed={...result,unresolved:branches.filter(b=>b===selected||!(b?.status==='CONTESTED_BY_RECEIPTS'&&b?.lens==='source_quality'))};
    const out=basePlan(narrowed,receipts);
    if(!out||typeof out!=='object') return out;
    return {
      ...out,
      targetQualificationGuard:{
        version:'0.2',
        selectedTarget:{targetRef:selected.targetRef,clauseRef:selected.clauseRef},
        eligibleTargetCount:1,
        preselectionRejected:guardRejected,
        rule:'Only completed GUT contamination-triage receipts with nonempty canonical provenance and a supported decomposition classification may influence multi-parent target selection. Other receipts remain auditable and cannot create an additional target candidate.'
      }
    };
  }

  api.prequalifyDynamicTargetReceipt=prequalify;
  api.planConflictDecomposition=guardedPlan;
  api.dynamicTargetQualificationGuardVersion='0.2';
})(typeof window!=='undefined'?window:globalThis);
