/* VAJRA receipt uncertainty guard v0.3.3 — prevents indeterminate or relation-unspecified returns from closing handoff branches */
(function(root){
  const engine=root.VajraEngine;
  if(!engine||typeof engine.applyHandoffResults!=='function') throw new Error('VAJRA_ENGINE_REQUIRED_BEFORE_UNCERTAINTY_GUARD');
  if(engine.receiptUncertaintyGuardVersion==='0.3.3') return;

  const baseApply=engine.applyHandoffResults.bind(engine);
  function clean(text){return String(text||'').normalize('NFKC').replace(/\s+/g,' ').trim();}
  function isExplicitlyIndeterminate(text){
    const s=clean(text).toLowerCase();
    return /\b(?:insufficient|inconclusive|indeterminate|uncertain|unclear|unknown|undetermined)\b|\bcannot\s+(?:determine|conclude|establish|support|refute)\b|\bcan(?:not|'t)\s+(?:determine|conclude|establish|support|refute)\b|\bdoes\s+not\s+(?:support|refute|establish|prove)\b|\bdo\s+not\s+(?:support|refute|establish|prove)\b|\bno\s+(?:sufficient\s+)?evidence\s+(?:to|that)\b|證據不足|不足以(?:支持|反駁|判定|證明)|無法(?:支持|反駁|判定|判斷|確定|證明)|不能(?:支持|反駁|判定|判斷|確定|證明)|不確定|尚不清楚|未知|未能(?:支持|反駁|證明)|未(?:支持|證明)|不支持/.test(s);
  }
  function relationClassification(text){
    if(isExplicitlyIndeterminate(text)) return 'INDETERMINATE';
    const polarity=typeof engine.relationPolarity==='function'?engine.relationPolarity(text):'UNSPECIFIED';
    if(polarity==='SUPPORTS'||polarity==='REFUTES'||polarity==='MIXED') return polarity;
    return 'UNSPECIFIED';
  }
  function normalizeAuditReceipt(r,reason,classification){
    return {
      targetRef:clean(r?.targetRef),clauseRef:clean(r?.clauseRef),lens:clean(r?.lens),organ:clean(r?.organ||r?.sourceOrgan),status:clean(r?.status),
      provenance:clean(r?.provenance||r?.provenanceFingerprint||r?.sourceFingerprint||r?.fingerprint),
      material:clean(r?.material||r?.summary||r?.evidence||r?.result),relation:clean(r?.relation||r?.relationToTarget||r?.assessment),
      relationClassification:classification,reasons:[reason]
    };
  }
  function applyHandoffResultsWithUncertaintyGuard(vajraResult,receipts=[]){
    const list=Array.isArray(receipts)?receipts:[];
    const blocked=[],eligible=[];
    for(const receipt of list){
      const relation=receipt?.relation||receipt?.relationToTarget||receipt?.assessment||'';
      const classification=relationClassification(relation);
      if(classification==='INDETERMINATE') blocked.push({receipt,reason:'INDETERMINATE_RELATION',classification});
      else if(classification==='UNSPECIFIED') blocked.push({receipt,reason:'UNSPECIFIED_RELATION',classification});
      else eligible.push(receipt);
    }
    const out=baseApply(vajraResult,eligible);
    if(!out||typeof out!=='object') return out;
    const hr=out.handoffResolution||{received:0,resolved:0,contested:0,open:0,rejected:0,resolvedBranches:[],contestedBranches:[],rejectedReceipts:[]};
    const rejectedAudit=blocked.map(x=>normalizeAuditReceipt(x.receipt,x.reason,x.classification));
    hr.received=(Number(hr.received)||0)+blocked.length;
    hr.rejected=(Number(hr.rejected)||0)+blocked.length;
    hr.rejectedReceipts=[...(hr.rejectedReceipts||[]),...rejectedAudit];
    hr.indeterminate=blocked.filter(x=>x.classification==='INDETERMINATE').length;
    hr.unspecified=blocked.filter(x=>x.classification==='UNSPECIFIED').length;
    out.handoffResolution=hr;
    out.version='0.3.3';
    out.boundary=`${out.boundary||''} Uncertainty guard v0.3.3: a structurally matching receipt cannot close a handoff unless its relation is explicitly classified by the bounded polarity detector as SUPPORTS, REFUTES, or MIXED. Explicitly insufficient/uncertain relations are audited as INDETERMINATE_RELATION; long but noncommittal relations are audited as UNSPECIFIED_RELATION. Both leave the branch open. This prevents structural completeness from being mistaken for epistemic resolution; it remains a lexical guard, not semantic adjudication or truth verification.`.trim();
    return out;
  }

  engine.applyHandoffResults=applyHandoffResultsWithUncertaintyGuard;
  engine.isExplicitlyIndeterminate=isExplicitlyIndeterminate;
  engine.relationClassification=relationClassification;
  engine.receiptUncertaintyGuardVersion='0.3.3';
})(typeof window!=='undefined'?window:globalThis);
