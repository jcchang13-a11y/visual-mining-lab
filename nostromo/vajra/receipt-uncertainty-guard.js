/* VAJRA receipt uncertainty guard v0.3.7 + contest-persistence + contract-adequacy guard — prevents indeterminate, unspecified, internally mixed, negated-polarity, same-provenance opposing, historically contested, or lens-inadequate returns from creating false closure */
(function(root){
  const engine=root.VajraEngine;
  if(!engine||typeof engine.applyHandoffResults!=='function') throw new Error('VAJRA_ENGINE_REQUIRED_BEFORE_UNCERTAINTY_GUARD');
  if(engine.receiptUncertaintyGuardVersion==='0.3.7'&&engine.receiptContestPersistenceGuardVersion==='0.1'&&engine.receiptContractAdequacyGuardVersion==='0.1') return;

  const baseApply=engine.applyHandoffResults.bind(engine);
  function clean(text){return String(text||'').normalize('NFKC').replace(/\s+/g,' ').trim();}
  function canonicalProvenance(text){return clean(text).toLowerCase().replace(/[\p{P}\p{S}\s]+/gu,'');}
  function provenanceOf(r){return clean(r?.provenance||r?.provenanceFingerprint||r?.sourceFingerprint||r?.fingerprint);}
  function hasNegatedPolarity(text){
    const s=clean(text).toLowerCase();
    return /\b(?:does|do|did|is|are|was|were|can|could|would|should|may|might)\s+not\s+(?:support|refute|contradict|falsif(?:y|ies)|confirm|corroborate|establish|prove)\b|\b(?:doesn['’]?t|don['’]?t|didn['’]?t|isn['’]?t|aren['’]?t|wasn['’]?t|weren['’]?t|can['’]?t|cannot|couldn['’]?t|wouldn['’]?t|shouldn['’]?t|mightn['’]?t)\s+(?:support|refute|contradict|falsif(?:y|ies)|confirm|corroborate|establish|prove)\b|\bfail(?:s|ed)?\s+to\s+(?:support|refute|contradict|falsif(?:y|ies)|confirm|corroborate|establish|prove)\b|\bnot\s+(?:consistent|inconsistent)\s+with\b|(?:並未|沒有|未曾|尚未)(?:能夠|能)?(?:支持|反駁|反證|否證|證明|印證)|未能(?:支持|反駁|反證|否證|證明|印證)|不構成(?:支持|反駁|反證|否證|證明|印證)/.test(s);
  }
  function isExplicitlyIndeterminate(text){
    const s=clean(text).toLowerCase();
    if(hasNegatedPolarity(s)) return true;
    return /\b(?:insufficient|inconclusive|indeterminate|uncertain|unclear|unknown|undetermined)\b|\bcannot\s+(?:determine|conclude|establish|support|refute)\b|\bcan(?:not|'t)\s+(?:determine|conclude|establish|support|refute)\b|\bdoes\s+not\s+(?:support|refute|establish|prove)\b|\bdo\s+not\s+(?:support|refute|establish|prove)\b|\bno\s+(?:sufficient\s+)?evidence\s+(?:to|that)\b|證據不足|不足以(?:支持|反駁|判定|證明)|無法(?:支持|反駁|判定|判斷|確定|證明)|不能(?:支持|反駁|判定|判斷|確定|證明)|不確定|尚不清楚|未知|未能(?:支持|反駁|證明)|未(?:支持|證明)|不支持/.test(s);
  }
  function relationClassification(text){
    if(isExplicitlyIndeterminate(text)) return 'INDETERMINATE';
    const polarity=typeof engine.relationPolarity==='function'?engine.relationPolarity(text):'UNSPECIFIED';
    if(polarity==='SUPPORTS'||polarity==='REFUTES'||polarity==='MIXED') return polarity;
    return 'UNSPECIFIED';
  }
  const LENS_ADEQUACY={
    scope:/\b(boundary|boundaries|exception|exceptions|scope|outside|within)\b|邊界|例外|範圍|適用域/i,
    counterexample:/counterexample|falsif|search(?:ed)? scope|coverage|反例|否證|搜尋範圍|檢索範圍|涵蓋/i,
    criterion:/criterion|criteria|threshold|distinguish|inclusion|exclusion|判準|標準|門檻|區分|納入|排除/i,
    excluded_alternative:/alternative|competing explanation|non[- ]equivalent|替代|競爭解釋|不同解釋/i,
    self_reference:/self[- ]?application|same rule|claimant|checker|自身|同一規則|檢查者|主張者/i,
    causal_mechanism:/mechanism|intermediate|step|link|機制|中介|步驟|鏈結|因果鏈/i,
    alternative_cause:/common cause|reverse caus|alternative cause|共同原因|反向因果|替代原因/i,
    counterfactual:/counterfactual|without\b|if .{0,80}\bnot\b|反事實|若.{0,40}(?:不|沒有|未)/i,
    affected_parties:/affected|stakeholder|cost|benefit|silent part|受影響|利害關係|成本|利益|沉默者/i,
    tradeoff:/trade[- ]?off|sacrifice|incompatible|cannot both|取捨|犧牲|不可同時|衝突目標/i,
    definition_boundary:/definition|inclusion|exclusion|boundary|example|定義|納入|排除|邊界|例子/i,
    category_error:/category|layer|type|conflat|類別|層級|型別|混同|混為一談/i,
    measurement:/measure|measurement|instrument|procedure|validity|測量|量測|工具|程序|效度/i,
    source_quality:/independen|method|fresh|date|reproduc|derivative|獨立|方法|時效|日期|重現|衍生來源/i
  };
  function contractAdequacyReason(receipt){
    const lens=clean(receipt?.lens).toLowerCase();
    const rule=LENS_ADEQUACY[lens];
    if(!rule) return '';
    const material=clean(receipt?.material||receipt?.summary||receipt?.evidence||receipt?.result);
    const relation=clean(receipt?.relation||receipt?.relationToTarget||receipt?.assessment);
    return rule.test(`${material} ${relation}`)?'':'HANDOFF_RESOLUTION_CRITERION_NOT_EVIDENCED';
  }
  function normalizeAuditReceipt(r,reason,classification,extra={}){
    return {
      targetRef:clean(r?.targetRef),clauseRef:clean(r?.clauseRef),lens:clean(r?.lens),organ:clean(r?.organ||r?.sourceOrgan),status:clean(r?.status),
      provenance:provenanceOf(r),
      material:clean(r?.material||r?.summary||r?.evidence||r?.result),relation:clean(r?.relation||r?.relationToTarget||r?.assessment),
      relationClassification:classification,reasons:[reason],...extra
    };
  }
  function branchKey(r){return [clean(r?.targetRef),clean(r?.clauseRef),clean(r?.lens),clean(r?.organ||r?.sourceOrgan)].join('|');}
  function branchStateKey(b){return [clean(b?.targetRef),clean(b?.clauseRef),clean(b?.lens),clean(b?.handoff?.preferredOrgan)].join('|');}
  function applyHandoffResultsWithUncertaintyGuard(vajraResult,receipts=[]){
    const list=Array.isArray(receipts)?receipts:[];
    const historicalContests=new Map((vajraResult?.unresolved||[]).filter(b=>b?.status==='CONTESTED_BY_RECEIPTS'&&b?.contest).map(b=>[branchStateKey(b),b]));
    const blocked=[],preEligible=[];
    for(const receipt of list){
      const relation=receipt?.relation||receipt?.relationToTarget||receipt?.assessment||'';
      const classification=relationClassification(relation);
      const adequacyReason=contractAdequacyReason(receipt);
      if(historicalContests.has(branchKey(receipt))) blocked.push({receipt,reason:'HISTORICAL_CONTEST_PRESERVED',classification});
      else if(classification==='INDETERMINATE') blocked.push({receipt,reason:'INDETERMINATE_RELATION',classification});
      else if(classification==='UNSPECIFIED') blocked.push({receipt,reason:'UNSPECIFIED_RELATION',classification});
      else if(classification==='MIXED') blocked.push({receipt,reason:'MIXED_RELATION',classification});
      else if(adequacyReason) blocked.push({receipt,reason:adequacyReason,classification});
      else preEligible.push({receipt,classification});
    }

    const provenanceGroups=new Map();
    for(const item of preEligible){
      const provenance=provenanceOf(item.receipt);
      const provenanceKey=canonicalProvenance(provenance);
      if(!provenanceKey) continue;
      const key=`${branchKey(item.receipt)}|${provenanceKey}`;
      if(!provenanceGroups.has(key)) provenanceGroups.set(key,[]);
      provenanceGroups.get(key).push(item);
    }
    const sameProvenanceConflictReceipts=new Set();
    for(const group of provenanceGroups.values()){
      const directions=new Set(group.map(x=>x.classification));
      if(directions.has('SUPPORTS')&&directions.has('REFUTES')) for(const x of group) sameProvenanceConflictReceipts.add(x.receipt);
    }
    const eligible=[];
    for(const item of preEligible){
      if(sameProvenanceConflictReceipts.has(item.receipt)) blocked.push({receipt:item.receipt,reason:'SAME_PROVENANCE_CONFLICT',classification:item.classification});
      else eligible.push(item.receipt);
    }

    const out=baseApply(vajraResult,eligible);
    if(!out||typeof out!=='object') return out;
    const hr=out.handoffResolution||{received:0,resolved:0,contested:0,open:0,rejected:0,resolvedBranches:[],contestedBranches:[],rejectedReceipts:[]};
    const rejectedAudit=blocked.map(x=>normalizeAuditReceipt(x.receipt,x.reason,x.classification,x.reason==='SAME_PROVENANCE_CONFLICT'?{provenanceTopology:'SAME_PROVENANCE_OPPOSING_DIRECTIONS'}:x.reason==='HISTORICAL_CONTEST_PRESERVED'?{contestTopology:'PREEXISTING_CONTEST_REQUIRES_EXPLICIT_ADJUDICATION'}:x.reason==='HANDOFF_RESOLUTION_CRITERION_NOT_EVIDENCED'?{adequacyTopology:'LENS_SPECIFIC_CRITERION_MISSING'}:{}));
    hr.received=(Number(hr.received)||0)+blocked.length;
    hr.rejected=(Number(hr.rejected)||0)+blocked.length;
    hr.rejectedReceipts=[...(hr.rejectedReceipts||[]),...rejectedAudit];
    hr.indeterminate=blocked.filter(x=>x.classification==='INDETERMINATE').length;
    hr.unspecified=blocked.filter(x=>x.classification==='UNSPECIFIED').length;
    hr.mixed=blocked.filter(x=>x.classification==='MIXED').length;
    hr.sameProvenanceConflict=blocked.filter(x=>x.reason==='SAME_PROVENANCE_CONFLICT').length;
    hr.historicalContestPreserved=blocked.filter(x=>x.reason==='HISTORICAL_CONTEST_PRESERVED').length;
    hr.contractAdequacyBlocked=blocked.filter(x=>x.reason==='HANDOFF_RESOLUTION_CRITERION_NOT_EVIDENCED').length;

    if(historicalContests.size){
      out.unresolved=(out.unresolved||[]).map(branch=>{
        const prior=historicalContests.get(branchStateKey(branch));
        return prior?{...prior,handoff:{...(prior.handoff||{}),status:'CONTESTED_BY_RECEIPTS'}}:branch;
      });
      out.handoffs=out.unresolved.map(x=>x.handoff);
      const resolvedBranches=out.unresolved.filter(x=>x?.status==='RESOLVED_BY_RECEIPT'&&x?.resolution).map(x=>x.resolution);
      const contestedBranches=out.unresolved.filter(x=>x?.status==='CONTESTED_BY_RECEIPTS'&&x?.contest).map(x=>x.contest);
      const openBranches=out.unresolved.filter(x=>x?.status==='UNRESOLVED');
      hr.resolvedBranches=resolvedBranches;
      hr.contestedBranches=contestedBranches;
      hr.resolved=resolvedBranches.length;
      hr.contested=contestedBranches.length;
      hr.open=openBranches.length;
      out.status=contestedBranches.length?(resolvedBranches.length?'PARTIAL_WITH_CONTESTED_RETURN':'CONTESTED_HANDOFF_RETURN'):(openBranches.length?'PARTIAL_HANDOFF_RETURN':'HANDOFFS_RETURNED');
    }

    out.handoffResolution=hr;
    out.version='0.3.7';
    out.boundary=`${out.boundary||''} Uncertainty/provenance/adequacy guard v0.3.7: a structurally matching receipt cannot close a handoff unless its relation is unambiguously classified by the bounded polarity detector as SUPPORTS or REFUTES. Explicitly insufficient/uncertain relations, negated polarity wording such as “does not contradict”, “fails to support”, or “not inconsistent with”, and bounded Chinese equivalents are audited as INDETERMINATE_RELATION; long but noncommittal relations as UNSPECIFIED_RELATION; a single relation carrying both support and refute polarity as MIXED_RELATION. Opposing SUPPORTS/REFUTES returns carrying the same canonical provenance identity are audited as SAME_PROVENANCE_CONFLICT and leave the branch open. Contest-persistence guard 0.1 preserves a prior independent-source contest until an explicit adjudication mechanism exists. Contract-adequacy guard 0.1 additionally requires bounded lens-specific evidence that the requested work was actually addressed before closure: boundary/scope material for scope, counterexample or bounded search coverage for counterexample, operational criteria for criterion, mechanism steps for causal mechanism, measurement validity for measurement, source-quality signals for source_quality, and corresponding explicit markers for the other specialized lenses. A long generic receipt can therefore no longer close an unrelated branch merely by saying it supports or refutes the claim. These are conservative lexical/structural guards, not semantic adjudication, source-quality ranking, or truth verification; false negatives intentionally preserve an OPEN branch rather than manufacture certainty.`.trim();
    return out;
  }

  engine.applyHandoffResults=applyHandoffResultsWithUncertaintyGuard;
  engine.hasNegatedPolarity=hasNegatedPolarity;
  engine.isExplicitlyIndeterminate=isExplicitlyIndeterminate;
  engine.relationClassification=relationClassification;
  engine.contractAdequacyReason=contractAdequacyReason;
  engine.receiptUncertaintyGuardVersion='0.3.7';
  engine.receiptContestPersistenceGuardVersion='0.1';
  engine.receiptContractAdequacyGuardVersion='0.1';
})(typeof window!=='undefined'?window:globalThis);