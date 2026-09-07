/* VAJRA modifier-wrapped Chinese polarity guard v0.1 — blocks embedded direction words from creating false closure when Chinese semantic modifiers negate or weaken their polarity. */
(function(root){
  const engine=root.VajraEngine;
  if(!engine||typeof engine.applyHandoffResults!=='function') throw new Error('VAJRA_ENGINE_REQUIRED_BEFORE_MODIFIER_NEGATION_GUARD');
  if(engine.receiptChineseModifierNegationGuardVersion==='0.1') return;

  const baseApply=engine.applyHandoffResults.bind(engine);
  function clean(text){return String(text||'').normalize('NFKC').replace(/\s+/g,' ').trim();}
  function provenanceOf(r){return clean(r?.provenance||r?.provenanceFingerprint||r?.sourceFingerprint||r?.fingerprint);}
  const DIRECTION='(?:支持|反駁|反驳|反證|反证|否證|否证|證明|证明|印證|印证|吻合|一致)';
  const WRAPPED=new RegExp(`(?:並非|并非|並不是|并不是|不是|稱不上|称不上|不能算|不算|難以|难以|未能|尚不足以)\\s*(?:構成|构成|視為|视为|形成|算作|被視為|被视为)?\\s*${DIRECTION}`,'i');
  function hasModifierWrappedNegation(text){return WRAPPED.test(clean(text));}
  function normalizeAuditReceipt(r){
    return {
      targetRef:clean(r?.targetRef),clauseRef:clean(r?.clauseRef),lens:clean(r?.lens),organ:clean(r?.organ||r?.sourceOrgan),status:clean(r?.status),
      provenance:provenanceOf(r),material:clean(r?.material||r?.summary||r?.evidence||r?.result),relation:clean(r?.relation||r?.relationToTarget||r?.assessment),
      relationClassification:'INDETERMINATE',reasons:['MODIFIER_WRAPPED_NEGATED_POLARITY'],negationTopology:'CHINESE_SEMANTIC_MODIFIER_SCOPES_DIRECTION_TOKEN'
    };
  }
  function applyWithModifierNegationGuard(vajraResult,receipts=[]){
    const list=Array.isArray(receipts)?receipts:[];
    const blocked=[],eligible=[];
    for(const receipt of list){
      const relation=receipt?.relation||receipt?.relationToTarget||receipt?.assessment||'';
      (hasModifierWrappedNegation(relation)?blocked:eligible).push(receipt);
    }
    const out=baseApply(vajraResult,eligible);
    if(!out||typeof out!=='object'||!blocked.length) return out;
    const hr=out.handoffResolution||{received:0,resolved:0,contested:0,open:0,rejected:0,resolvedBranches:[],contestedBranches:[],rejectedReceipts:[]};
    hr.received=(Number(hr.received)||0)+blocked.length;
    hr.rejected=(Number(hr.rejected)||0)+blocked.length;
    hr.indeterminate=(Number(hr.indeterminate)||0)+blocked.length;
    hr.modifierWrappedNegation=(Number(hr.modifierWrappedNegation)||0)+blocked.length;
    hr.rejectedReceipts=[...(hr.rejectedReceipts||[]),...blocked.map(normalizeAuditReceipt)];
    out.handoffResolution=hr;
    return out;
  }
  engine.applyHandoffResults=applyWithModifierNegationGuard;
  engine.receiptChineseModifierNegationGuardVersion='0.1';
  engine.hasModifierWrappedChineseNegation=hasModifierWrappedNegation;
})(typeof globalThis!=='undefined'?globalThis:this);
