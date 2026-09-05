// VAJRA receipt ambiguity/conflict guard v0.5.10
// Prevents first-receipt false closure when multiple structurally qualifying returns
// for the same VAJRA branch are ambiguous or explicitly conflict. Audit scope is
// branch-scoped (targetRef + clauseRef + lens), not organ-scoped, so a preferred
// organ cannot silently close a branch while another executed organ return explicitly
// points the opposite way. Malformed or non-executed returns are excluded. Relation
// polarity is negation-aware for a bounded set of English/Chinese support/refute
// phrases, including explicit insufficiency, modality, conditionality, exception and
// concessive/contrastive scope phrases. Conditionality/exception coverage includes bounded prefix
// forms without crossing sentence or semicolon boundaries. Generic comma-delimited condition
// prefixes (if/when/as long as and 如果/若/倘若/只要) contain directional vocabulary in
// the same conditional sentence, including the main clause. English even if is excluded
// from the generic if matcher so its comma-delimited concessive prefix can be contained
// without hiding an explicit directional main clause. Bounded explicit if...then and
// 如果/若/倘若/只要...則/那么/那麼 forms are also contained even without a comma.
// A later sentence remains visible. Concessive/contrastive coverage keeps its bounded prefix behavior.
// This is deterministic audit logic, not semantic adjudication, source-independence proof or source-quality scoring.

function clean(v){return String(v??'').replace(/\s+/g,' ').trim();}
function fp(text){let h=2166136261;for(const ch of clean(text)){h^=ch.codePointAt(0);h=Math.imul(h,16777619)>>>0;}return h.toString(16).padStart(8,'0');}
function maskNegatedPolarityPhrases(text){
  return text
    .replace(/\b(?:does|do|did|is|are|was|were|can|could|may|might|will|would|should|has|have|had)\s+not\s+(?:directly\s+)?(?:support|supports|supported|supporting|confirm|confirms|confirmed|confirming|corroborate|corroborates|corroborated|corroborating)\b/g,' <neg-pos> ')
    .replace(/\b(?:fails?|failed)\s+to\s+(?:support|confirm|corroborate)\b/g,' <neg-pos> ')
    .replace(/\b(?:insufficient|inadequate|not\s+enough)\s+(?:evidence\s+)?to\s+(?:directly\s+)?(?:support|confirm|corroborate)\b/g,' <insufficient-pos> ')
    .replace(/\bnot\s+consistent\s+with\b/g,' <neg-cons> ')
    .replace(/(?:不足以|尚不足以|不足夠(?:用來|以)?)(?:直接)?(?:支持|佐證|印證|吻合|一致)/g,' <insufficient-pos> ')
    .replace(/(?:不|未|無法|不能|並未)(?:直接)?(?:支持|佐證|印證|吻合|一致)/g,' <neg-pos> ')
    .replace(/\b(?:does|do|did|is|are|was|were|can|could|may|might|will|would|should|has|have|had)\s+not\s+(?:directly\s+)?(?:refute|refutes|refuted|refuting|contradict|contradicts|contradicted|contradicting|oppose|opposes|opposed|falsify|falsifies|falsified|falsifying)\b/g,' <neg-neg> ')
    .replace(/\b(?:fails?|failed)\s+to\s+(?:refute|contradict|oppose|falsify)\b/g,' <neg-neg> ')
    .replace(/\b(?:insufficient|inadequate|not\s+enough)\s+(?:evidence\s+)?to\s+(?:directly\s+)?(?:refute|contradict|oppose|falsify)\b/g,' <insufficient-neg> ')
    .replace(/(?:不足以|尚不足以|不足夠(?:用來|以)?)(?:直接)?(?:反駁|反證|否證|矛盾|相反)/g,' <insufficient-neg> ')
    .replace(/(?:不|未|無法|不能|並未)(?:直接)?(?:反駁|反證|否證|矛盾|相反)/g,' <neg-neg> ');
}
function maskHedgedPolarityPhrases(text){
  return text
    .replace(/\b(?:may|might|could|possibly|potentially|perhaps)\s+(?:directly\s+)?(?:support|supports|supported|supporting|confirm|confirms|confirmed|confirming|corroborate|corroborates|corroborated|corroborating)\b/g,' <hedged-pos> ')
    .replace(/\b(?:may|might|could|possibly|potentially|perhaps)\s+(?:directly\s+)?(?:refute|refutes|refuted|refuting|contradict|contradicts|contradicted|contradicting|oppose|opposes|opposed|falsify|falsifies|falsified|falsifying)\b/g,' <hedged-neg> ')
    .replace(/\b(?:does|do|did|is|are|was|were|can|could|may|might|will|would|should|has|have|had)\s+not\s+(?:necessarily|clearly|conclusively)\s+(?:support|supports|supported|supporting|confirm|confirms|confirmed|confirming|corroborate|corroborates|corroborated|corroborating)\b/g,' <hedged-neg-pos> ')
    .replace(/\b(?:does|do|did|is|are|was|were|can|could|may|might|will|would|should|has|have|had)\s+not\s+(?:necessarily|clearly|conclusively)\s+(?:refute|refutes|refuted|refuting|contradict|contradicts|contradicted|contradicting|oppose|opposes|opposed|falsify|falsifies|falsified|falsifying)\b/g,' <hedged-neg-neg> ')
    .replace(/(?:可能|或許|也許|未必|不一定)(?:直接)?(?:支持|佐證|印證|吻合|一致)/g,' <hedged-pos> ')
    .replace(/(?:可能|或許|也許|未必|不一定)(?:直接)?(?:反駁|反證|否證|矛盾|相反)/g,' <hedged-neg> ');
}
function maskConditionalPolarityPhrases(text){
  const condition='(?:only\\s+if|provided\\s+that|assuming\\s+that|subject\\s+to|under\\s+the\\s+condition\\s+that)';
  const support='(?:support|supports|supported|supporting|confirm|confirms|confirmed|confirming|corroborate|corroborates|corroborated|corroborating)';
  const refute='(?:refute|refutes|refuted|refuting|contradict|contradicts|contradicted|contradicting|oppose|opposes|opposed|falsify|falsifies|falsified|falsifying)';
  let out=text
    .replace(/\b(?:conditionally|provisionally)\s+(?:directly\s+)?(?:support|supports|supported|supporting|confirm|confirms|confirmed|confirming|corroborate|corroborates|corroborated|corroborating)\b/g,' <conditional-pos> ')
    .replace(/\b(?:support|supports|supported|supporting|confirm|confirms|confirmed|confirming|corroborate|corroborates|corroborated|corroborating)\b(?=.{0,60}\b(?:only\s+if|provided\s+that|assuming\s+that|subject\s+to|under\s+the\s+condition\s+that)\b)/g,' <conditional-pos> ')
    .replace(/\b(?:conditionally|provisionally)\s+(?:directly\s+)?(?:refute|refutes|refuted|refuting|contradict|contradicts|contradicted|contradicting|oppose|opposes|opposed|falsify|falsifies|falsified|falsifying)\b/g,' <conditional-neg> ')
    .replace(/\b(?:refute|refutes|refuted|refuting|contradict|contradicts|contradicted|contradicting|oppose|opposes|opposed|falsify|falsifies|falsified|falsifying)\b(?=.{0,60}\b(?:only\s+if|provided\s+that|assuming\s+that|subject\s+to|under\s+the\s+condition\s+that)\b)/g,' <conditional-neg> ')
    .replace(/(?:只有在|僅在|只在|在特定條件下|有條件地)[^。；;]{0,48}(?:才)?(?:支持|佐證|印證|吻合|一致)/g,' <conditional-pos> ')
    .replace(/(?:只有在|僅在|只在|在特定條件下|有條件地)[^。；;]{0,48}(?:才)?(?:反駁|反證|否證|矛盾|相反)/g,' <conditional-neg> ');
  out=out
    .replace(new RegExp(`\\b${condition}\\b[^.!?;]{0,100}\\b${support}\\b`,'g'),' <conditional-pos> ')
    .replace(new RegExp(`\\b${condition}\\b[^.!?;]{0,100}\\b${refute}\\b`,'g'),' <conditional-neg> ');
  return out;
}
function maskSimpleConditionalPrefixPolarityPhrases(text){
  const support=/(?:\bsupport(?:s|ed|ing)?\b|\bconfirm(?:s|ed|ing)?\b|\bcorroborat(?:e|es|ed|ing)\b|支持|佐證|印證|吻合|一致)/g;
  const refute=/(?:\brefut(?:e|es|ed|ing)?\b|\bcontradict(?:s|ed|ing)?\b|\boppose(?:s|d)?\b|\bfalsif(?:y|ies|ied|ying)\b|反駁|反證|否證|矛盾|相反)/g;
  const mask=(segment)=>segment.replace(support,' <conditional-prefix-pos> ').replace(refute,' <conditional-prefix-neg> ');
  let out=text.replace(/(?<!even\s)\bif\b[^.!?;；,，]{0,120}[,，]|\b(?:when|as\s+long\s+as)\b[^.!?;；,，]{0,120}[,，]/g,mask);
  out=out.replace(/(?:如果|若|倘若|只要)[^。！？；;,，]{0,120}[，,]/g,mask);
  return out;
}
function maskConditionalSentencePolarityPhrases(text){
  const support=/(?:\bsupport(?:s|ed|ing)?\b|\bconfirm(?:s|ed|ing)?\b|\bcorroborat(?:e|es|ed|ing)\b|支持|佐證|印證|吻合|一致)/g;
  const refute=/(?:\brefut(?:e|es|ed|ing)?\b|\bcontradict(?:s|ed|ing)?\b|\boppose(?:s|d)?\b|\bfalsif(?:y|ies|ied|ying)\b|反駁|反證|否證|矛盾|相反)/g;
  const mask=(segment)=>segment.replace(support,' <conditional-sentence-pos> ').replace(refute,' <conditional-sentence-neg> ');
  let out=text.replace(/(?<!even\s)\bif\b[^.!?;；]{0,220}(?=[.!?;；]|$)|\b(?:when|as\s+long\s+as)\b[^.!?;；]{0,220}(?=[.!?;；]|$)/g,(segment)=>/[,，]/.test(segment)?mask(segment):segment);
  out=out.replace(/(?:如果|若|倘若|只要)[^。！？；;]{0,220}(?=[。！？；;]|$)/g,(segment)=>/[,，]/.test(segment)?mask(segment):segment);
  return out;
}
function maskExplicitThenConditionalPolarityPhrases(text){
  const support=/(?:\bsupport(?:s|ed|ing)?\b|\bconfirm(?:s|ed|ing)?\b|\bcorroborat(?:e|es|ed|ing)\b|支持|佐證|印證|吻合|一致)/g;
  const refute=/(?:\brefut(?:e|es|ed|ing)?\b|\bcontradict(?:s|ed|ing)?\b|\boppose(?:s|d)?\b|\bfalsif(?:y|ies|ied|ying)\b|反駁|反證|否證|矛盾|相反)/g;
  const mask=(segment)=>segment.replace(support,' <conditional-then-pos> ').replace(refute,' <conditional-then-neg> ');
  let out=text.replace(/(?<!even\s)\bif\b[^.!?;；]{0,120}\bthen\b[^.!?;；]{0,120}(?=[.!?;；]|$)/g,mask);
  out=out.replace(/(?:如果|若|倘若|只要)[^。！？；;]{0,120}(?:則|那么|那麼)[^。！？；;]{0,120}(?=[。！？；;]|$)/g,mask);
  return out;
}
function maskExceptionPolarityPhrases(text){
  const support='(?:support|supports|supported|supporting|confirm|confirms|confirmed|confirming|corroborate|corroborates|corroborated|corroborating)';
  const refute='(?:refute|refutes|refuted|refuting|contradict|contradicts|contradicted|contradicting|oppose|opposes|opposed|falsify|falsifies|falsified|falsifying)';
  const exception='(?:unless|except\\s+when|except\\s+if|except\\s+under|except\\s+where)';
  let out=text
    .replace(/\b(?:support|supports|supported|supporting|confirm|confirms|confirmed|confirming|corroborate|corroborates|corroborated|corroborating)\b(?=.{0,60}\b(?:unless|except\s+when|except\s+if|except\s+under|except\s+where)\b)/g,' <exception-pos> ')
    .replace(/\b(?:refute|refutes|refuted|refuting|contradict|contradicts|contradicted|contradicting|oppose|opposes|opposed|falsify|falsifies|falsified|falsifying)\b(?=.{0,60}\b(?:unless|except\s+when|except\s+if|except\s+under|except\s+where)\b)/g,' <exception-neg> ')
    .replace(/(?:除非|除非在|只有排除|除了)[^。；;]{0,48}(?:才|之外)?(?:支持|佐證|印證|吻合|一致)/g,' <exception-pos> ')
    .replace(/(?:除非|除非在|只有排除|除了)[^。；;]{0,48}(?:才|之外)?(?:反駁|反證|否證|矛盾|相反)/g,' <exception-neg> ');
  out=out
    .replace(new RegExp(`\\b${exception}\\b[^.!?;]{0,100}\\b${support}\\b`,'g'),' <exception-pos> ')
    .replace(new RegExp(`\\b${exception}\\b[^.!?;]{0,100}\\b${refute}\\b`,'g'),' <exception-neg> ');
  return out;
}
function maskConcessivePolarityPhrases(text){
  const support=/(?:\bsupport(?:s|ed|ing)?\b|\bconfirm(?:s|ed|ing)?\b|\bcorroborat(?:e|es|ed|ing)\b|支持|佐證|印證|吻合|一致)/g;
  const refute=/(?:\brefut(?:e|es|ed|ing)?\b|\bcontradict(?:s|ed|ing)?\b|\boppose(?:s|d)?\b|\bfalsif(?:y|ies|ied|ying)\b|反駁|反證|否證|矛盾|相反)/g;
  const mask=(segment)=>segment.replace(support,' <concessive-pos> ').replace(refute,' <concessive-neg> ');
  let out=text.replace(/\b(?:although|though|even\s+though|even\s+if|despite|in\s+spite\s+of|while|whilst|whereas)\b[^.!?;；,，]{0,120}[,，]/g,mask);
  out=out.replace(/(?:雖然|儘管|即使|雖說|固然)[^。！？；;,，]{0,120}[，,]/g,mask);
  return out;
}
function relationPolarity(text){
  const s=clean(text).normalize('NFKC').toLowerCase();
  const scan=maskConcessivePolarityPhrases(maskExceptionPolarityPhrases(maskExplicitThenConditionalPolarityPhrases(maskConditionalSentencePolarityPhrases(maskSimpleConditionalPrefixPolarityPhrases(maskConditionalPolarityPhrases(maskHedgedPolarityPhrases(maskNegatedPolarityPhrases(s))))))));
  const support=/\bsupport(?:s|ed|ing)?\b|corroborat|consistent with|confirm|支持|佐證|印證|吻合|一致/.test(scan);
  const refute=/\brefut(?:e|es|ed|ing)?\b|\bcontradict(?:s|ed|ing)?\b|\boppose(?:s|d)?\b|counterexample|falsif|反駁|反證|否證|矛盾|相反/.test(scan);
  if(support&&refute)return 'MIXED';
  if(support)return 'SUPPORTS';
  if(refute)return 'REFUTES';
  return 'UNSPECIFIED';
}
function normalizeReceipt(r){
  if(!r||typeof r!=='object')return null;
  return {...r,targetRef:clean(r.targetRef),clauseRef:clean(r.clauseRef),lens:clean(r.lens),organ:clean(r.organ||r.sourceOrgan),status:clean(r.status),provenance:clean(r.provenance||r.provenanceFingerprint||r.sourceFingerprint||r.fingerprint),material:clean(r.material||r.summary||r.evidence||r.result),relation:clean(r.relation||r.relationToTarget||r.assessment)};
}
function qualificationReasons(r){
  const reasons=[];
  if(!r?.targetRef)reasons.push('MISSING_TARGET_REF'); if(!r?.clauseRef)reasons.push('MISSING_CLAUSE_REF'); if(!r?.lens)reasons.push('MISSING_LENS'); if(!r?.organ)reasons.push('MISSING_ORGAN');
  if(!/^(EXECUTED|RETURNED|COMPLETED)$/i.test(r?.status||''))reasons.push('NO_EXECUTION_EVIDENCE'); if(!r?.provenance)reasons.push('MISSING_PROVENANCE'); if(!r?.material)reasons.push('EMPTY_MATERIAL'); if(!r?.relation)reasons.push('MISSING_RELATION_TO_TARGET');
  return reasons;
}
function branchKey(r){return [clean(r?.targetRef),clean(r?.clauseRef),clean(r?.lens)].join('|');}
function receiptAuditView(x){return {targetRef:x.targetRef,clauseRef:x.clauseRef,lens:x.lens,organ:x.organ,status:x.status,provenance:x.provenance,material:x.material,relation:x.relation,polarity:x.polarity,evidenceKey:fp(`${x.provenance}|${x.material}`)};}
function branchAuditFinding(key,items,status,polarities,boundary){const organs=[...new Set(items.map(x=>x.organ).filter(Boolean))];const provenances=[...new Set(items.map(x=>x.provenance).filter(Boolean))];return {key,status,polarities,count:items.length,organs,distinctOrganCount:organs.length,distinctProvenanceCount:provenances.length,receipts:items.map(receiptAuditView),boundary};}
export function auditReceiptAmbiguity(receipts=[]){
  const groups=new Map(),rejected=[];
  for(const raw of Array.isArray(receipts)?receipts:[]){const receipt=normalizeReceipt(raw);if(!receipt)continue;const reasons=qualificationReasons(receipt);if(reasons.length){rejected.push({targetRef:receipt.targetRef,clauseRef:receipt.clauseRef,lens:receipt.lens,organ:receipt.organ,status:receipt.status,provenance:receipt.provenance,reasons});continue;}const key=branchKey(receipt);const item={...receipt,polarity:relationPolarity(receipt.relation)};if(!groups.has(key))groups.set(key,[]);groups.get(key).push(item);}
  const ambiguous=[],contested=[];
  for(const [key,items] of groups){if(items.length<2)continue;const polarities=[...new Set(items.map(x=>x.polarity))];const explicitConflict=(polarities.includes('SUPPORTS')&&polarities.includes('REFUTES'))||polarities.includes('MIXED');if(explicitConflict){contested.push(branchAuditFinding(key,items,'CONTESTED_BY_RECEIPTS',polarities,'Multiple structurally qualifying executed returns address the same VAJRA branch and contain explicit opposing lexical polarity, including across organ labels. The branch must not close by preferred-organ arrival order. Distinct organ/provenance counts are audit metadata only; they do not prove source independence. This is a bounded lexical conflict detector, not semantic adjudication.'));continue;}if(polarities.includes('UNSPECIFIED')){ambiguous.push(branchAuditFinding(key,items,'AMBIGUOUS_BY_RECEIPTS',polarities,'Multiple structurally qualifying executed returns address the same VAJRA branch, but at least one relation is lexically UNSPECIFIED. Bounded negation/insufficiency/modality/conditionality/exception/concessive/contrastive masking prevents explicit non-directional, qualified or subordinate support/refute forms from being counted as unconditional polarity evidence. Branch scope deliberately crosses organ labels so arrival order across organs cannot manufacture closure. Distinct organ/provenance counts are audit metadata only; they do not prove source independence. This is a lexical safety rule, not semantic disagreement detection.'));}}
  const status=contested.length?(ambiguous.length?'CONFLICT_AND_AMBIGUITY_FOUND':'CONFLICT_FOUND'):(ambiguous.length?'AMBIGUITY_FOUND':'NO_AMBIGUITY_FOUND');
  return {status,ambiguous,contested,groupCount:groups.size,qualifyingReceiptCount:[...groups.values()].reduce((n,x)=>n+x.length,0),rejectedReceiptCount:rejected.length,rejectedReceipts:rejected,boundary:'Ambiguity/conflict is computed over branch-scoped structurally qualifying executed returns with provenance, material and an explicit relation-to-target field. Bounded English/Chinese negation, insufficiency, modality, conditionality, exception and concessive/contrastive masks prevent obvious non-directional or scope-qualified support/refute phrases from creating false unconditional polarity. Generic if/when/as-long-as and 如果/若/倘若/只要 comma-delimited conditional sentences contain both subordinate and same-sentence main-clause directional polarity; explicit if...then and 如果/若/倘若/只要...則/那么/那麼 forms receive the same containment without requiring a comma. English even if is excluded from the generic if matcher: its comma-delimited concessive prefix is contained while a later main-clause or later-sentence directional relation remains visible. Explicit opposing polarity across organ labels is preserved as a contested branch. Qualification is necessary but not sufficient for semantic adequacy, source independence or source quality.'};
}
export function applyGuardedHandoffResults(vajraResult,receipts=[],engine=globalThis.VajraEngine){
  if(!engine||typeof engine.applyHandoffResults!=='function')throw new Error('VAJRA_ENGINE_REQUIRED');
  const audit=auditReceiptAmbiguity(receipts); const base=engine.applyHandoffResults(vajraResult,receipts);
  if(!audit.ambiguous.length&&!audit.contested.length)return {...base,receiptAmbiguityAudit:audit};
  const ambiguousKeys=new Set(audit.ambiguous.map(x=>x.key)); const contestedKeys=new Set(audit.contested.map(x=>x.key));
  const unresolved=(base.unresolved||[]).map(branch=>{const h=branch.handoff||{};const key=[clean(h.targetRef||branch.targetRef),clean(h.clauseRef||branch.clauseRef),clean(h.lens||branch.lens)].join('|');if(contestedKeys.has(key)){const finding=audit.contested.find(x=>x.key===key);const contest={targetRef:clean(h.targetRef||branch.targetRef),clauseRef:clean(h.clauseRef||branch.clauseRef),lens:clean(h.lens||branch.lens),preferredOrgan:clean(h.preferredOrgan),status:'CONTESTED_BY_RECEIPTS',polarities:finding?.polarities||[],evidence:(finding?.receipts||[]).map(x=>({evidenceKey:x.evidenceKey,provenance:x.provenance,relation:x.relation,polarity:x.polarity,organ:x.organ,material:x.material})),boundary:'Branch-scoped explicit opposing receipt polarity is preserved across organ labels. A non-preferred organ return cannot close the branch, but it can block premature closure and create auditable conflict context. Distinct organs/provenances are not proof of source independence.'};return {...branch,status:'CONTESTED_BY_RECEIPTS',contest,handoff:{...h,status:'CONTESTED_BY_RECEIPTS'}};}if(ambiguousKeys.has(key)){const ambiguity=audit.ambiguous.find(x=>x.key===key);return {...branch,status:'AMBIGUOUS_BY_RECEIPTS',ambiguity,handoff:{...h,status:'AMBIGUOUS_BY_RECEIPTS'}};}return branch;});
  const resolvedBranches=unresolved.filter(x=>x.status==='RESOLVED_BY_RECEIPT'); const contestedBranches=unresolved.filter(x=>x.status==='CONTESTED_BY_RECEIPTS'); const openBranches=unresolved.filter(x=>x.status!=='RESOLVED_BY_RECEIPT');
  const status=contestedBranches.length?(resolvedBranches.length?'PARTIAL_WITH_CONTESTED_RETURN':'CONTESTED_HANDOFF_RETURN'):(resolvedBranches.length?'PARTIAL_WITH_AMBIGUOUS_RETURN':'AMBIGUOUS_HANDOFF_RETURN');
  return {...base,version:`${base.version||'unknown'}+ambiguity-conflict-guard-v0.5.10`,status,unresolved,handoffs:unresolved.map(x=>x.handoff),receiptAmbiguityAudit:audit,handoffResolution:{...(base.handoffResolution||{}),resolved:resolvedBranches.length,open:openBranches.length,contested:contestedBranches.length,ambiguous:audit.ambiguous.length,contestedBranches:contestedBranches.map(x=>x.contest),ambiguousBranches:audit.ambiguous},boundary:`${base.boundary||''} Ambiguity/conflict guard: branch-scoped qualifying executed returns are audited across organ labels. Explicit opposing polarity creates CONTESTED_BY_RECEIPTS and blocks preferred-organ first-receipt closure; an UNSPECIFIED relation creates AMBIGUOUS_BY_RECEIPTS. Obvious negated, explicitly insufficient, explicitly hedged, explicitly conditional, bounded generic conditional-sentence, bounded explicit if-then/若-則 conditional, bounded exception-scoped, or bounded concessive/contrastive-prefix support/refute phrases are masked before lexical polarity classification. Generic if/when/as-long-as and 如果/若/倘若/只要 comma-delimited conditional sentences, plus explicit if...then and 如果/若/倘若/只要...則/那么/那麼 forms, mask same-sentence directional polarity through the sentence/semicolon boundary, so condition-scoped main clauses cannot be misread as unconditional closure; later sentences remain visible. English even if is excluded from generic if matching, so its comma-delimited concessive prefix can be masked without hiding an explicit later main-clause or later-sentence direction. Distinct organ/provenance labels remain audit metadata rather than proof of independence. This guard is lexical and structural, not semantic adjudication.`.trim()};
}
