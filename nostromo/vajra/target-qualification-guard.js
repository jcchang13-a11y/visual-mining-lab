/* VAJRA target qualification guard v0.3 — prevents nonqualifying cross-organ receipts from polluting multi-parent target selection and prevents agreeing GUT classifications with distinct provenance from being misread as diagnosis conflict. */
(function(root){
  const api=root.VajraEngine;
  if(!api||typeof api.planConflictDecomposition!=='function') throw new Error('VAJRA_DYNAMIC_DECOMPOSITION_REQUIRED_BEFORE_TARGET_QUALIFICATION_GUARD');
  if(api.dynamicTargetQualificationGuardVersion==='0.3') return;

  const basePlan=api.planConflictDecomposition.bind(api);
  const TRIAGE_CLASSES=new Set(['PROVENANCE_COLLISION','DUPLICATE_CONTAMINATION','MIXED_CONTAMINATION']);
  const clean=v=>String(v??'').replace(/\s+/g,' ').trim();
  const fp=v=>{let h=2166136261;for(const ch of clean(v)){h^=ch.codePointAt(0);h=Math.imul(h,16777619)>>>0;}return h.toString(16).padStart(8,'0');};
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

  function rescueAgreeingDistinctProvenance(result,receipts,out,parent){
    if(!out||out.status!=='HOLD'||out.reason!=='conflicting-qualifying-gut-triage-receipts'||!parent) return out;
    if(typeof api.qualifyContaminationTriageReceipt!=='function') return out;

    const unique=[];
    const seen=new Set();
    for(const receipt of Array.isArray(receipts)?receipts:[]){
      const q=api.qualifyContaminationTriageReceipt(parent,receipt);
      if(!q?.ok||seen.has(q.receiptFingerprint)) continue;
      seen.add(q.receiptFingerprint);
      unique.push({receipt,q});
    }
    if(unique.length<2) return out;

    const classifications=[...new Set(unique.map(x=>x.q.classification))].sort();
    if(classifications.length!==1) return out;

    const ordered=[...unique].sort((a,b)=>a.q.canonicalProvenance.localeCompare(b.q.canonicalProvenance)||a.q.receiptFingerprint.localeCompare(b.q.receiptFingerprint));
    const representative=ordered[0];
    const rescued=basePlan(result,[representative.receipt]);
    if(!rescued||rescued.status!=='DECOMPOSED') return out;

    const aliasAudit=ordered.map(x=>({
      provenanceFingerprint:fp(x.q.canonicalProvenance),
      receiptFingerprint:x.q.receiptFingerprint
    })).sort((a,b)=>a.provenanceFingerprint.localeCompare(b.provenanceFingerprint)||a.receiptFingerprint.localeCompare(b.receiptFingerprint));
    const distinctCanonicalProvenanceCount=new Set(ordered.map(x=>x.q.canonicalProvenance)).size;
    return {
      ...rescued,
      reason:'agreeing-gut-triage-classification-with-distinct-provenance-selected-bounded-profile',
      provenance:{
        ...(rescued.provenance||{}),
        qualifyingReceiptCount:ordered.length,
        canonicalAliasCount:ordered.filter(x=>x.q.canonicalProvenance===representative.q.canonicalProvenance).length,
        aliasAudit,
        distinctCanonicalProvenanceCount
      },
      provenanceConsensusGuard:{
        version:'0.3',
        classification:classifications[0],
        qualifyingReceiptCount:ordered.length,
        distinctCanonicalProvenanceCount,
        rule:'Distinct canonical provenance remains evidence-significant and auditable but does not itself constitute triage-classification disagreement. Only unanimous supported classification may select one bounded profile; classification disagreement still HOLDs with zero facets.',
        independenceClaim:false
      },
      boundary:'Agreement rescue changes routing only: multiple unique completed GUT receipts scoped to the same contested parent may select the same already-bounded decomposition profile when their supported contamination classification is unanimous. Distinct provenance is preserved as fingerprints and is not promoted to a claim of source independence. Any classification disagreement remains HOLD; parent truth remains unresolved and generated facets are not claimed executed.'
    };
  }

  function guardedPlan(result,receipts=[]){
    const branches=Array.isArray(result?.unresolved)?result.unresolved:[];
    const parents=branches.filter(b=>b?.status==='CONTESTED_BY_RECEIPTS'&&b?.lens==='source_quality');
    if(parents.length<=1){
      const out=basePlan(result,receipts);
      return rescueAgreeingDistinctProvenance(result,receipts,out,parents[0]);
    }

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
        schema:'zenomorph-vajra-target-qualification-guard/v0.3',
        status:'HOLD',
        reason:'qualifying-targeted-contested-source-quality-parent-required',
        parents:parents.map(p=>({targetRef:p.targetRef,clauseRef:p.clauseRef,lens:p.lens,status:p.status,closed:false})),
        facets:[],
        rejected:guardRejected,
        targetQualificationGuard:{version:'0.3',eligibleTargetCount:0,rule:'Only prequalified completed GUT contamination-triage receipts may nominate a target when multiple contested source-quality parents are open.'},
        boundary:'Nonqualifying cross-organ, incomplete, provenance-empty, unsupported, or unscoped traffic cannot nominate a contested parent. With zero qualifying target candidates VAJRA remains on HOLD rather than allowing receipt scope alone to alter routing.'
      };
    }

    if(eligibleTargets.size>1) return basePlan(result,receipts);

    const selected=[...eligibleTargets.values()][0];
    const narrowed={...result,unresolved:branches.filter(b=>b===selected||!(b?.status==='CONTESTED_BY_RECEIPTS'&&b?.lens==='source_quality'))};
    let out=basePlan(narrowed,receipts);
    out=rescueAgreeingDistinctProvenance(narrowed,receipts,out,selected);
    if(!out||typeof out!=='object') return out;
    return {
      ...out,
      targetQualificationGuard:{
        version:'0.3',
        selectedTarget:{targetRef:selected.targetRef,clauseRef:selected.clauseRef},
        eligibleTargetCount:1,
        preselectionRejected:guardRejected,
        rule:'Only completed GUT contamination-triage receipts with nonempty canonical provenance and a supported decomposition classification may influence multi-parent target selection. Other receipts remain auditable and cannot create an additional target candidate.'
      }
    };
  }

  api.prequalifyDynamicTargetReceipt=prequalify;
  api.planConflictDecomposition=guardedPlan;
  api.dynamicTargetQualificationGuardVersion='0.3';
})(typeof window!=='undefined'?window:globalThis);
