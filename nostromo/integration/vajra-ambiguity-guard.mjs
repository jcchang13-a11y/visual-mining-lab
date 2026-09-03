// VAJRA receipt ambiguity guard v0.4.1
// Prevents first-receipt false closure when multiple structurally qualifying returns
// for the same VAJRA branch include polarity-unspecified material. Ambiguity is
// branch-scoped (targetRef + clauseRef + lens), not organ-scoped, so different
// organs cannot silently resolve the same branch by arrival order. Malformed or
// non-executed returns are excluded. Relation polarity is negation-aware for a
// bounded set of English/Chinese support/refute phrases so "does not support"
// cannot be misread as SUPPORTS and "does not refute" cannot be misread as
// REFUTES. This is deterministic audit logic, not semantic adjudication,
// source-independence proof or source-quality scoring.

function clean(v){return String(v??'').replace(/\s+/g,' ').trim();}
function maskNegatedPolarityPhrases(text){
  // Replacement sentinels intentionally contain no support/refute vocabulary;
  // otherwise the downstream lexical detector would re-detect the masked word.
  return text
    .replace(/\b(?:does|do|did|is|are|was|were|can|could|may|might|will|would|should|has|have|had)\s+not\s+(?:directly\s+)?(?:support|supports|supported|supporting|confirm|confirms|confirmed|confirming|corroborate|corroborates|corroborated|corroborating)\b/g,' <neg-pos> ')
    .replace(/\b(?:fails?|failed)\s+to\s+(?:support|confirm|corroborate)\b/g,' <neg-pos> ')
    .replace(/\bnot\s+consistent\s+with\b/g,' <neg-cons> ')
    .replace(/(?:不|未|無法|不能|並未)(?:直接)?(?:支持|佐證|印證|吻合|一致)/g,' <neg-pos> ')
    .replace(/\b(?:does|do|did|is|are|was|were|can|could|may|might|will|would|should|has|have|had)\s+not\s+(?:directly\s+)?(?:refute|refutes|refuted|refuting|contradict|contradicts|contradicted|contradicting|oppose|opposes|opposed|falsify|falsifies|falsified|falsifying)\b/g,' <neg-neg> ')
    .replace(/\b(?:fails?|failed)\s+to\s+(?:refute|contradict|oppose|falsify)\b/g,' <neg-neg> ')
    .replace(/(?:不|未|無法|不能|並未)(?:直接)?(?:反駁|反證|否證|矛盾|相反)/g,' <neg-neg> ');
}
function relationPolarity(text){
  const s=clean(text).normalize('NFKC').toLowerCase();
  const scan=maskNegatedPolarityPhrases(s);
  const support=/\bsupport(?:s|ed|ing)?\b|corroborat|consistent with|confirm|支持|佐證|印證|吻合|一致/.test(scan);
  const refute=/\brefut(?:e|es|ed|ing)?\b|\bcontradict(?:s|ed|ing)?\b|\boppose(?:s|d)?\b|counterexample|falsif|反駁|反證|否證|矛盾|相反/.test(scan);
  if(support&&refute)return 'MIXED';
  if(support)return 'SUPPORTS';
  if(refute)return 'REFUTES';
  return 'UNSPECIFIED';
}

function normalizeReceipt(r){
  if(!r||typeof r!=='object')return null;
  return {
    ...r,
    targetRef:clean(r.targetRef),
    clauseRef:clean(r.clauseRef),
    lens:clean(r.lens),
    organ:clean(r.organ||r.sourceOrgan),
    status:clean(r.status),
    provenance:clean(r.provenance||r.provenanceFingerprint||r.sourceFingerprint||r.fingerprint),
    material:clean(r.material||r.summary||r.evidence||r.result),
    relation:clean(r.relation||r.relationToTarget||r.assessment)
  };
}

function qualificationReasons(r){
  const reasons=[];
  if(!r?.targetRef)reasons.push('MISSING_TARGET_REF');
  if(!r?.clauseRef)reasons.push('MISSING_CLAUSE_REF');
  if(!r?.lens)reasons.push('MISSING_LENS');
  if(!r?.organ)reasons.push('MISSING_ORGAN');
  if(!/^(EXECUTED|RETURNED|COMPLETED)$/i.test(r?.status||''))reasons.push('NO_EXECUTION_EVIDENCE');
  if(!r?.provenance)reasons.push('MISSING_PROVENANCE');
  if(!r?.material)reasons.push('EMPTY_MATERIAL');
  if(!r?.relation)reasons.push('MISSING_RELATION_TO_TARGET');
  return reasons;
}

function branchKey(r){
  return [clean(r?.targetRef),clean(r?.clauseRef),clean(r?.lens)].join('|');
}

export function auditReceiptAmbiguity(receipts=[]){
  const groups=new Map(),rejected=[];
  for(const raw of Array.isArray(receipts)?receipts:[]){
    const receipt=normalizeReceipt(raw);
    if(!receipt)continue;
    const reasons=qualificationReasons(receipt);
    if(reasons.length){
      rejected.push({
        targetRef:receipt.targetRef,clauseRef:receipt.clauseRef,lens:receipt.lens,organ:receipt.organ,
        status:receipt.status,provenance:receipt.provenance,reasons
      });
      continue;
    }
    const key=branchKey(receipt);
    const item={...receipt,polarity:relationPolarity(receipt.relation)};
    if(!groups.has(key))groups.set(key,[]);
    groups.get(key).push(item);
  }
  const ambiguous=[];
  for(const [key,items] of groups){
    if(items.length<2)continue;
    const polarities=[...new Set(items.map(x=>x.polarity))];
    const explicitConflict=(polarities.includes('SUPPORTS')&&polarities.includes('REFUTES'))||polarities.includes('MIXED');
    if(explicitConflict)continue;
    if(polarities.includes('UNSPECIFIED')){
      const organs=[...new Set(items.map(x=>x.organ).filter(Boolean))];
      const provenances=[...new Set(items.map(x=>x.provenance).filter(Boolean))];
      ambiguous.push({
        key,
        status:'AMBIGUOUS_BY_RECEIPTS',
        polarities,
        count:items.length,
        organs,
        distinctOrganCount:organs.length,
        distinctProvenanceCount:provenances.length,
        receipts:items.map(x=>({
          targetRef:x.targetRef,clauseRef:x.clauseRef,lens:x.lens,organ:x.organ,
          status:x.status,provenance:x.provenance,relation:x.relation,polarity:x.polarity
        })),
        boundary:'Multiple structurally qualifying executed returns address the same VAJRA branch, but at least one relation is lexically UNSPECIFIED. Bounded negation masking prevents phrases such as does not support / does not refute and Chinese equivalents from being counted as positive polarity evidence. Branch scope deliberately crosses organ labels so arrival order across organs cannot manufacture closure. Distinct organ/provenance counts are audit metadata only; they do not prove source independence. Malformed, non-executed, provenance-free, empty-material or relation-free returns cannot manufacture ambiguity. This is a lexical safety rule, not semantic disagreement detection.'
      });
    }
  }
  return {
    status:ambiguous.length?'AMBIGUITY_FOUND':'NO_AMBIGUITY_FOUND',
    ambiguous,
    groupCount:groups.size,
    qualifyingReceiptCount:[...groups.values()].reduce((n,x)=>n+x.length,0),
    rejectedReceiptCount:rejected.length,
    rejectedReceipts:rejected,
    boundary:'Ambiguity is computed over branch-scoped structurally qualifying executed returns with provenance, material and an explicit relation-to-target field. A bounded English/Chinese negation mask prevents obvious negated support/refute phrases from creating false polarity. Organ labels remain preserved for audit but do not partition one VAJRA branch into separate closure domains. Qualification is necessary but not sufficient for semantic adequacy, source independence or source quality.'
  };
}

export function applyGuardedHandoffResults(vajraResult,receipts=[],engine=globalThis.VajraEngine){
  if(!engine||typeof engine.applyHandoffResults!=='function')throw new Error('VAJRA_ENGINE_REQUIRED');
  const audit=auditReceiptAmbiguity(receipts);
  const base=engine.applyHandoffResults(vajraResult,receipts);
  if(!audit.ambiguous.length)return {...base,receiptAmbiguityAudit:audit};
  const ambiguousKeys=new Set(audit.ambiguous.map(x=>x.key));
  const unresolved=(base.unresolved||[]).map(branch=>{
    const h=branch.handoff||{};
    const key=[clean(h.targetRef||branch.targetRef),clean(h.clauseRef||branch.clauseRef),clean(h.lens||branch.lens)].join('|');
    if(!ambiguousKeys.has(key))return branch;
    const ambiguity=audit.ambiguous.find(x=>x.key===key);
    return {...branch,status:'AMBIGUOUS_BY_RECEIPTS',ambiguity,handoff:{...h,status:'AMBIGUOUS_BY_RECEIPTS'}};
  });
  const resolvedBranches=unresolved.filter(x=>x.status==='RESOLVED_BY_RECEIPT');
  const openBranches=unresolved.filter(x=>x.status!=='RESOLVED_BY_RECEIPT');
  return {
    ...base,
    version:`${base.version||'unknown'}+ambiguity-guard-v0.4.1`,
    status:resolvedBranches.length?'PARTIAL_WITH_AMBIGUOUS_RETURN':'AMBIGUOUS_HANDOFF_RETURN',
    unresolved,
    handoffs:unresolved.map(x=>x.handoff),
    receiptAmbiguityAudit:audit,
    handoffResolution:{...(base.handoffResolution||{}),resolved:resolvedBranches.length,open:openBranches.length,ambiguous:audit.ambiguous.length,ambiguousBranches:audit.ambiguous},
    boundary:`${base.boundary||''} Ambiguity guard: multiple branch-scoped qualifying executed returns, including returns from different organs, with an UNSPECIFIED relation are not collapsed by receipt order into apparent resolution; obvious negated support/refute phrases are masked before lexical polarity classification; malformed/non-executed returns are excluded from ambiguity formation. Distinct organ/provenance labels remain audit metadata rather than proof of independence. This guard is lexical and structural, not semantic adjudication.`.trim()
  };
}
