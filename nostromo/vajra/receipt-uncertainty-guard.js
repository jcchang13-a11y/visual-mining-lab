/* VAJRA receipt uncertainty guard v0.3.2 — prevents explicit epistemic uncertainty from closing handoff branches */
(function(root){
  const engine=root.VajraEngine;
  if(!engine||typeof engine.applyHandoffResults!=='function') throw new Error('VAJRA_ENGINE_REQUIRED_BEFORE_UNCERTAINTY_GUARD');
  if(engine.receiptUncertaintyGuardVersion==='0.3.2') return;

  const baseApply=engine.applyHandoffResults.bind(engine);
  function clean(text){return String(text||'').normalize('NFKC').replace(/\s+/g,' ').trim();}
  function isExplicitlyIndeterminate(text){
    const s=clean(text).toLowerCase();
    return /\b(?:insufficient|inconclusive|indeterminate|uncertain|unclear|unknown|undetermined)\b|\bcannot\s+(?:determine|conclude|establish|support|refute)\b|\bcan(?:not|'t)\s+(?:determine|conclude|establish|support|refute)\b|\bdoes\s+not\s+(?:support|refute|establish|prove)\b|\bdo\s+not\s+(?:support|refute|establish|prove)\b|\bno\s+(?:sufficient\s+)?evidence\s+(?:to|that)\b|證據不足|不足以(?:支持|反駁|判定|證明)|無法(?:支持|反駁|判定|判斷|確定|證明)|不能(?:支持|反駁|判定|判斷|確定|證明)|不確定|尚不清楚|未知|未能(?:支持|反駁|證明)|未(?:支持|證明)|不支持/.test(s);
  }
  function normalizeAuditReceipt(r){
    return {
      targetRef:clean(r?.targetRef),clauseRef:clean(r?.clauseRef),lens:clean(r?.lens),organ:clean(r?.organ||r?.sourceOrgan),status:clean(r?.status),
      provenance:clean(r?.provenance||r?.provenanceFingerprint||r?.sourceFingerprint||r?.fingerprint),
      material:clean(r?.material||r?.summary||r?.evidence||r?.result),relation:clean(r?.relation||r?.relationToTarget||r?.assessment),
      reasons:['INDETERMINATE_RELATION']
    };
  }
  function applyHandoffResultsWithUncertaintyGuard(vajraResult,receipts=[]){
    const list=Array.isArray(receipts)?receipts:[];
    const indeterminate=[],eligible=[];
    for(const receipt of list){
      const relation=receipt?.relation||receipt?.relationToTarget||receipt?.assessment||'';
      if(isExplicitlyIndeterminate(relation)) indeterminate.push(receipt); else eligible.push(receipt);
    }
    const out=baseApply(vajraResult,eligible);
    if(!out||typeof out!=='object') return out;
    const hr=out.handoffResolution||{received:0,resolved:0,contested:0,open:0,rejected:0,resolvedBranches:[],contestedBranches:[],rejectedReceipts:[]};
    const rejectedAudit=indeterminate.map(normalizeAuditReceipt);
    hr.received=(Number(hr.received)||0)+indeterminate.length;
    hr.rejected=(Number(hr.rejected)||0)+indeterminate.length;
    hr.rejectedReceipts=[...(hr.rejectedReceipts||[]),...rejectedAudit];
    hr.indeterminate=indeterminate.length;
    out.handoffResolution=hr;
    out.version='0.3.2';
    out.boundary=`${out.boundary||''} Uncertainty guard v0.3.2: a structurally matching receipt whose relation explicitly says the evidence is insufficient, indeterminate, unknown, or does not support/refute a conclusion is preserved as an audited INDETERMINATE_RELATION rejection and cannot close the branch. This is a bounded lexical guard against false certainty, not semantic adjudication.`.trim();
    return out;
  }

  engine.applyHandoffResults=applyHandoffResultsWithUncertaintyGuard;
  engine.isExplicitlyIndeterminate=isExplicitlyIndeterminate;
  engine.receiptUncertaintyGuardVersion='0.3.2';
})(typeof window!=='undefined'?window:globalThis);
