// VAJRA receipt ambiguity guard v0.1
// Prevents first-receipt false closure when multiple structurally qualifying returns
// include polarity-unspecified material. This is a deterministic audit guard, not
// semantic adjudication or source-quality scoring.

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

function receiptKey(r){
  return [clean(r?.targetRef),clean(r?.clauseRef),clean(r?.lens),clean(r?.organ||r?.sourceOrgan)].join('|');
}

export function auditReceiptAmbiguity(receipts=[]){
  const groups=new Map();
  for(const receipt of Array.isArray(receipts)?receipts:[]){
    if(!receipt||typeof receipt!=='object')continue;
    const key=receiptKey(receipt);
    if(!key.replace(/\|/g,''))continue;
    const item={...receipt,polarity:relationPolarity(receipt.relation||receipt.relationToTarget||receipt.assessment)};
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
          targetRef:clean(x.targetRef),clauseRef:clean(x.clauseRef),lens:clean(x.lens),organ:clean(x.organ||x.sourceOrgan),
          status:clean(x.status),provenance:clean(x.provenance||x.provenanceFingerprint||x.sourceFingerprint||x.fingerprint),
          relation:clean(x.relation||x.relationToTarget||x.assessment),polarity:x.polarity
        })),
        boundary:'Multiple returns address the same clause-scoped handoff, but at least one relation is lexically UNSPECIFIED. The guard preserves ambiguity instead of allowing receipt order to create apparent closure. This is a lexical safety rule, not semantic disagreement detection.'
      });
    }
  }
  return {status:ambiguous.length?'AMBIGUITY_FOUND':'NO_AMBIGUITY_FOUND',ambiguous,groupCount:groups.size};
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
    version:`${base.version||'unknown'}+ambiguity-guard-v0.1`,
    status:resolvedBranches.length?'PARTIAL_WITH_AMBIGUOUS_RETURN':'AMBIGUOUS_HANDOFF_RETURN',
    unresolved,
    handoffs:unresolved.map(x=>x.handoff),
    receiptAmbiguityAudit:audit,
    handoffResolution:{...(base.handoffResolution||{}),resolved:resolvedBranches.length,open:openBranches.length,ambiguous:audit.ambiguous.length,ambiguousBranches:audit.ambiguous},
    boundary:`${base.boundary||''} Ambiguity guard: multiple clause-scoped qualifying returns with an UNSPECIFIED relation are not collapsed by receipt order into apparent resolution; they remain open as AMBIGUOUS_BY_RECEIPTS. This guard is lexical and structural, not semantic adjudication.`.trim()
  };
}
