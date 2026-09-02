// VAJRA receipt ambiguity guard v0.2
// Prevents first-receipt false closure when multiple structurally qualifying returns
// include polarity-unspecified material. Malformed/non-executed returns are excluded
// from ambiguity formation so junk input cannot manufacture uncertainty. This is a
// deterministic audit guard, not semantic adjudication or source-quality scoring.

function clean(v){return String(v??'').replace(/\s+/g,' ').trim();}
function relationPolarity(text){
  const s=clean(text).normalize('NFKC').toLowerCase();
  const support=/\bsupport(?:s|ed|ing)?\b|corroborat|consistent with|confirm|支持|佐證|印證|吻合|一致/.test(s);
  const refute=/\brefut(?:e|es|ed|ing)?\b|\bcontradict(?:s|ed|ing)?\b|\boppose(?:s|d)?\b|counterexample|falsif|反駁|反證|否證|矛盾|相反/.test(s);
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

function receiptKey(r){
  return [clean(r?.targetRef),clean(r?.clauseRef),clean(r?.lens),clean(r?.organ||r?.sourceOrgan)].join('|');
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
    const key=receiptKey(receipt);
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
      ambiguous.push({
        key,
        status:'AMBIGUOUS_BY_RECEIPTS',
        polarities,
        count:items.length,
        receipts:items.map(x=>({
          targetRef:x.targetRef,clauseRef:x.clauseRef,lens:x.lens,organ:x.organ,
          status:x.status,provenance:x.provenance,relation:x.relation,polarity:x.polarity
        })),
        boundary:'Multiple structurally qualifying executed returns address the same clause-scoped handoff, but at least one relation is lexically UNSPECIFIED. The guard preserves ambiguity instead of allowing receipt order to create apparent closure. Malformed, non-executed, provenance-free, empty-material or relation-free returns cannot manufacture ambiguity. This is a lexical safety rule, not semantic disagreement detection.'
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
    boundary:'Ambiguity is computed only over structurally qualifying executed returns with provenance, material and an explicit relation-to-target field. Qualification is necessary but not sufficient for semantic adequacy or source quality.'
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
    const key=[clean(h.targetRef||branch.targetRef),clean(h.clauseRef||branch.clauseRef),clean(h.lens||branch.lens),clean(h.preferredOrgan)].join('|');
    if(!ambiguousKeys.has(key))return branch;
    const ambiguity=audit.ambiguous.find(x=>x.key===key);
    return {...branch,status:'AMBIGUOUS_BY_RECEIPTS',ambiguity,handoff:{...h,status:'AMBIGUOUS_BY_RECEIPTS'}};
  });
  const resolvedBranches=unresolved.filter(x=>x.status==='RESOLVED_BY_RECEIPT');
  const openBranches=unresolved.filter(x=>x.status!=='RESOLVED_BY_RECEIPT');
  return {
    ...base,
    version:`${base.version||'unknown'}+ambiguity-guard-v0.2`,
    status:resolvedBranches.length?'PARTIAL_WITH_AMBIGUOUS_RETURN':'AMBIGUOUS_HANDOFF_RETURN',
    unresolved,
    handoffs:unresolved.map(x=>x.handoff),
    receiptAmbiguityAudit:audit,
    handoffResolution:{...(base.handoffResolution||{}),resolved:resolvedBranches.length,open:openBranches.length,ambiguous:audit.ambiguous.length,ambiguousBranches:audit.ambiguous},
    boundary:`${base.boundary||''} Ambiguity guard: multiple clause-scoped qualifying executed returns with an UNSPECIFIED relation are not collapsed by receipt order into apparent resolution; malformed/non-executed returns are excluded from ambiguity formation. This guard is lexical and structural, not semantic adjudication.`.trim()
  };
}
