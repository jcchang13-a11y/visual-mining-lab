/* VAJRA dynamic decomposition v0.1 — qualifying GUT contamination triage can split a repeated source-quality conflict into bounded follow-up facets without closing the parent conflict */
(function(root){
  const api=root.VajraEngine;
  if(!api||typeof api.selectNextInspection!=='function') throw new Error('VajraEngine + dynamic-reinspection must be loaded before dynamic-decomposition');

  const TRIAGE_CLASSES=new Set(['PROVENANCE_COLLISION','DUPLICATE_CONTAMINATION','MIXED_CONTAMINATION']);
  const clean=v=>String(v??'').replace(/\s+/g,' ').trim();
  const fp=v=>{let h=2166136261;for(const ch of clean(v)){h^=ch.codePointAt(0);h=Math.imul(h,16777619)>>>0;}return h.toString(16).padStart(8,'0');};

  function qualifyTriageReceipt(branch,receipt){
    if(!branch||!receipt||typeof receipt!=='object') return {ok:false,reason:'missing-branch-or-receipt'};
    const targetRef=clean(receipt.targetRef),clauseRef=clean(receipt.clauseRef),organ=clean(receipt.organ||receipt.sourceOrgan),status=clean(receipt.status),provenance=clean(receipt.provenance||receipt.provenanceFingerprint),classification=clean(receipt.triageClassification||receipt.classification).toUpperCase();
    if(targetRef!==clean(branch.targetRef)||clauseRef!==clean(branch.clauseRef)) return {ok:false,reason:'scope-mismatch'};
    if(organ!=='GUT') return {ok:false,reason:'gut-receipt-required'};
    if(status!=='COMPLETED') return {ok:false,reason:'completed-receipt-required'};
    if(!provenance) return {ok:false,reason:'provenance-required'};
    if(!TRIAGE_CLASSES.has(classification)) return {ok:false,reason:'non-decomposing-triage-class'};
    return {ok:true,classification,provenance,receiptFingerprint:fp(JSON.stringify(receipt))};
  }

  function planConflictDecomposition(result,receipts=[]){
    const branches=Array.isArray(result?.unresolved)?result.unresolved:[];
    const parent=branches.find(b=>b?.status==='CONTESTED_BY_RECEIPTS'&&b?.lens==='source_quality');
    if(!parent) return {status:'NO_DECOMPOSITION',reason:'no-contested-source-quality-parent',facets:[],rejected:[]};
    const rejected=[];
    let qualified=null;
    for(const receipt of Array.isArray(receipts)?receipts:[]){
      const q=qualifyTriageReceipt(parent,receipt);
      if(q.ok){qualified={receipt,q};break;}
      rejected.push({reason:q.reason,receiptFingerprint:fp(JSON.stringify(receipt||null))});
    }
    if(!qualified) return {status:'HOLD',reason:'qualifying-gut-contamination-triage-required',parent:{targetRef:parent.targetRef,clauseRef:parent.clauseRef,lens:parent.lens,status:parent.status},facets:[],rejected,boundary:'Absence or rejection of a GUT triage receipt cannot change VAJRA decomposition behavior.'};

    const shared={targetRef:parent.targetRef,clauseRef:parent.clauseRef,parentLens:parent.lens,parentStatus:parent.status,triageClassification:qualified.q.classification,triageProvenance:qualified.q.provenance,triageReceiptFingerprint:qualified.q.receiptFingerprint,status:'OPEN'};
    const facets=[
      {...shared,facetId:`${parent.clauseRef}:identity`,lens:'source_identity',preferredOrgan:'GUT',need:'isolate duplicate/alias/provenance-collision structure without adjudicating claim truth',reason:'Contamination triage makes source identity a separate unresolved structural question.'},
      {...shared,facetId:`${parent.clauseRef}:relation`,lens:'claim_relation',preferredOrgan:'MUTHER',need:'re-evaluate how the surviving material relates to the clause after contaminated copies are not counted as independent support/opposition',reason:'Source contamination changes the evidential relation that must be reconstructed from retained provenance.'}
    ];
    return {
      schema:'zenomorph-vajra-dynamic-decomposition/v0.1',
      status:'DECOMPOSED',
      reason:'qualifying-gut-contamination-triage-split-parent-conflict',
      parent:{targetRef:parent.targetRef,clauseRef:parent.clauseRef,lens:parent.lens,status:parent.status,closed:false},
      facets,
      provenance:{triageProvenance:qualified.q.provenance,triageReceiptFingerprint:qualified.q.receiptFingerprint,preservedTargetRef:parent.targetRef,preservedClauseRef:parent.clauseRef},
      rejected,
      boundary:'Dynamic decomposition is a reversible routing/inspection plan. It preserves the contested parent as open, does not decide which receipt is true, does not prove provenance independence, and does not claim GUT or MUTHER executed the generated facets.'
    };
  }

  api.qualifyContaminationTriageReceipt=qualifyTriageReceipt;
  api.planConflictDecomposition=planConflictDecomposition;
})(typeof window!=='undefined'?window:globalThis);
