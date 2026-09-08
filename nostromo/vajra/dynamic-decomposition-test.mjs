import fs from 'node:fs/promises';
import vm from 'node:vm';
const load=async p=>vm.runInThisContext(await fs.readFile(p,'utf8'),{filename:p});
await load('nostromo/vajra/vajra-engine.js');
await load('nostromo/vajra/dynamic-reinspection.js');
await load('nostromo/vajra/dynamic-decomposition.js');
const V=globalThis.VajraEngine;
const failures=[];const check=(ok,type,detail)=>{if(!ok)failures.push({type,detail});};

const parent={status:'CONTESTED_BY_RECEIPTS',targetRef:'target-001',clauseRef:'clause-001',lens:'source_quality',evidenceKeys:['receipt-A','receipt-B']};
const state={status:'CONTESTED_BY_RECEIPTS',unresolved:[parent]};
const gutReceipt={targetRef:'target-001',clauseRef:'clause-001',lens:'metabolic_contamination',organ:'GUT',status:'COMPLETED',provenance:'gut-triage-evidence-001',triageClassification:'PROVENANCE_COLLISION',summary:'De-identified structural triage found source aliases that must not be counted as independent evidence.'};

check(V.dynamicDecompositionVersion==='1.0','DYNAMIC_DECOMPOSITION_VERSION_BASELINE_MISMATCH',V.dynamicDecompositionVersion);

const decomposed=V.planConflictDecomposition(state,[gutReceipt]);
check(decomposed.status==='DECOMPOSED','QUALIFYING_TRIAGE_DID_NOT_DECOMPOSE',decomposed);
check(decomposed.parent?.closed===false,'PARENT_FALSELY_CLOSED',decomposed.parent);
check(decomposed.facets?.length===2,'WRONG_FACET_COUNT',decomposed.facets);
check(decomposed.facets?.some(f=>f.lens==='source_identity'&&f.preferredOrgan==='GUT'),'SOURCE_IDENTITY_FACET_MISSING',decomposed.facets);
check(decomposed.facets?.some(f=>f.lens==='claim_relation'&&f.preferredOrgan==='MUTHER'),'CLAIM_RELATION_FACET_MISSING',decomposed.facets);
check(decomposed.facets?.every(f=>f.targetRef==='target-001'&&f.clauseRef==='clause-001'),'PROVENANCE_SCOPE_LOST',decomposed.facets);
check(Boolean(decomposed.provenance?.triageProvenanceFingerprint&&decomposed.provenance?.aliasAudit?.length===1),'PROVENANCE_AUDIT_NOT_RETAINED',decomposed.provenance);
check(decomposed.behaviorRegulation?.classification==='PROVENANCE_COLLISION','PROVENANCE_PROFILE_NOT_AUDITED',decomposed.behaviorRegulation);
check(decomposed.provenance?.independenceClaimed===false,'BASELINE_FALSE_INDEPENDENCE_CLAIM',decomposed.provenance);

const duplicateReceipt={...gutReceipt,triageClassification:'DUPLICATE_CONTAMINATION',summary:'De-identified structural triage found repeated copies that must be clustered before evidential reconstruction.'};
const duplicatePlan=V.planConflictDecomposition(state,[duplicateReceipt]);
check(duplicatePlan.status==='DECOMPOSED','DUPLICATE_TRIAGE_DID_NOT_DECOMPOSE',duplicatePlan);
check(duplicatePlan.facets?.length===2,'DUPLICATE_PROFILE_WRONG_FACET_COUNT',duplicatePlan.facets);
check(duplicatePlan.facets?.some(f=>f.lens==='duplicate_cluster'&&f.preferredOrgan==='GUT'),'DUPLICATE_PROFILE_CLUSTER_FACET_MISSING',duplicatePlan.facets);
check(!duplicatePlan.facets?.some(f=>f.lens==='source_identity'),'DUPLICATE_PROFILE_FALSE_SOURCE_IDENTITY_FACET',duplicatePlan.facets);

const mixedReceipt={...gutReceipt,triageClassification:'MIXED_CONTAMINATION',summary:'De-identified structural triage found both provenance collision and repeated-copy contamination.'};
const mixedPlan=V.planConflictDecomposition(state,[mixedReceipt]);
check(mixedPlan.status==='DECOMPOSED','MIXED_TRIAGE_DID_NOT_DECOMPOSE',mixedPlan);
check(mixedPlan.facets?.length===3,'MIXED_PROFILE_WRONG_FACET_COUNT',mixedPlan.facets);
check(mixedPlan.facets?.some(f=>f.lens==='source_identity'&&f.preferredOrgan==='GUT'),'MIXED_PROFILE_SOURCE_IDENTITY_MISSING',mixedPlan.facets);
check(mixedPlan.facets?.some(f=>f.lens==='duplicate_cluster'&&f.preferredOrgan==='GUT'),'MIXED_PROFILE_DUPLICATE_CLUSTER_MISSING',mixedPlan.facets);
check(mixedPlan.facets?.some(f=>f.lens==='claim_relation'&&f.preferredOrgan==='MUTHER'),'MIXED_PROFILE_CLAIM_RELATION_MISSING',mixedPlan.facets);
check(decomposed.behaviorRegulation?.profileFingerprint!==duplicatePlan.behaviorRegulation?.profileFingerprint,'CLASSIFICATION_DID_NOT_CHANGE_PROFILE',{provenance:decomposed.behaviorRegulation,duplicate:duplicatePlan.behaviorRegulation});
check(duplicatePlan.behaviorRegulation?.profileFingerprint!==mixedPlan.behaviorRegulation?.profileFingerprint,'MIXED_CLASSIFICATION_DID_NOT_CHANGE_PROFILE',{duplicate:duplicatePlan.behaviorRegulation,mixed:mixedPlan.behaviorRegulation});

const replayTriple=V.planConflictDecomposition(state,[gutReceipt,gutReceipt,gutReceipt]);
check(replayTriple.status==='DECOMPOSED','EXACT_REPLAY_BLOCKED_DECOMPOSITION',replayTriple);
check(replayTriple.provenance?.qualifyingReceiptCount===1,'EXACT_REPLAY_INFLATED_QUALIFYING_COUNT',replayTriple.provenance);
check(replayTriple.provenance?.aliasAudit?.length===1,'EXACT_REPLAY_INFLATED_ALIAS_AUDIT',replayTriple.provenance);
check(replayTriple.replaySuppression?.duplicateReplayCount===2,'EXACT_REPLAY_SUPPRESSION_COUNT_WRONG',replayTriple.replaySuppression);
check(replayTriple.rejected?.filter(x=>x.reason==='duplicate-qualifying-receipt-replay').length===2,'EXACT_REPLAY_REJECTION_AUDIT_LOST',replayTriple.rejected);
check(JSON.stringify(replayTriple.facets)===JSON.stringify(decomposed.facets),'EXACT_REPLAY_CHANGED_DOWNSTREAM_BEHAVIOR',{baseline:decomposed.facets,replay:replayTriple.facets});

const reorderedReceipt={summary:gutReceipt.summary,triageClassification:gutReceipt.triageClassification,provenance:gutReceipt.provenance,status:gutReceipt.status,organ:gutReceipt.organ,lens:gutReceipt.lens,clauseRef:gutReceipt.clauseRef,targetRef:gutReceipt.targetRef};
check(JSON.stringify(reorderedReceipt)!==JSON.stringify(gutReceipt),'KEY_ORDER_FIXTURE_NOT_ACTUALLY_REORDERED',{gutReceipt,reorderedReceipt});
const reorderedReplay=V.planConflictDecomposition(state,[gutReceipt,reorderedReceipt]);
check(reorderedReplay.status==='DECOMPOSED','KEY_ORDER_REPLAY_BLOCKED_DECOMPOSITION',reorderedReplay);
check(reorderedReplay.provenance?.qualifyingReceiptCount===1,'KEY_ORDER_REPLAY_INFLATED_QUALIFYING_COUNT',reorderedReplay.provenance);
check(reorderedReplay.replaySuppression?.duplicateReplayCount===1,'KEY_ORDER_REPLAY_SUPPRESSION_COUNT_WRONG',reorderedReplay.replaySuppression);
check(String(reorderedReplay.replaySuppression?.identity).includes('stable-recursive-object-key-order'),'KEY_ORDER_REPLAY_IDENTITY_NOT_EXPLICIT',reorderedReplay.replaySuppression);

const transportReplay={...gutReceipt,receivedAt:'2026-09-08T03:11:00Z',attempt:4,traceId:'trace-retry-004',deliveryId:'delivery-retry-004'};
const transportReplay2={...gutReceipt,receivedAt:'2026-09-08T03:12:00Z',attempt:5,traceId:'trace-retry-005',deliveryId:'delivery-retry-005'};
const transportSuppressed=V.planConflictDecomposition(state,[gutReceipt,transportReplay,transportReplay2]);
check(transportSuppressed.status==='DECOMPOSED','TRANSPORT_REPLAY_BLOCKED_DECOMPOSITION',transportSuppressed);
check(transportSuppressed.provenance?.qualifyingReceiptCount===1,'TRANSPORT_METADATA_INFLATED_QUALIFYING_COUNT',transportSuppressed.provenance);
check(transportSuppressed.provenance?.aliasAudit?.length===1,'TRANSPORT_METADATA_INFLATED_ALIAS_AUDIT',transportSuppressed.provenance);
check(transportSuppressed.replaySuppression?.duplicateReplayCount===2,'TRANSPORT_REPLAY_SUPPRESSION_COUNT_WRONG',transportSuppressed.replaySuppression);
check(transportSuppressed.replaySuppression?.ignoredTopLevelTransportKeys?.includes('receivedAt'),'TRANSPORT_PROJECTION_NOT_AUDITED',transportSuppressed.replaySuppression);
check(JSON.stringify(transportSuppressed.facets)===JSON.stringify(decomposed.facets),'TRANSPORT_REPLAY_CHANGED_DOWNSTREAM_BEHAVIOR',{baseline:decomposed.facets,transport:transportSuppressed.facets});

const equivalentReceipt={...gutReceipt,summary:'Same structural finding restated by the same provenance-bearing triage artifact.'};
const equivalent=V.planConflictDecomposition(state,[gutReceipt,equivalentReceipt]);
check(equivalent.status==='DECOMPOSED','EQUIVALENT_TRIAGE_FALSE_HOLD',equivalent);
check(equivalent.provenance?.qualifyingReceiptCount===2,'DISTINCT_EQUIVALENT_RECEIPT_FALSELY_DEDUPED',equivalent.provenance);

const nestedTransportLike={...gutReceipt,detail:{receivedAt:'evidence-bearing-nested-value'}};
const nestedTransportLike2={...gutReceipt,detail:{receivedAt:'different-evidence-bearing-nested-value'}};
const nestedDistinct=V.planConflictDecomposition(state,[nestedTransportLike,nestedTransportLike2]);
check(nestedDistinct.status==='DECOMPOSED','NESTED_TRANSPORTLIKE_FALSE_HOLD',nestedDistinct);
check(nestedDistinct.provenance?.qualifyingReceiptCount===2,'NESTED_TRANSPORTLIKE_FALSELY_DEDUPED',nestedDistinct.provenance);

const provenanceAlias={...gutReceipt,provenance:'GUT Triage Evidence 001',summary:'Surface-form alias of the same de-identified structural triage provenance.'};
const aliasAB=V.planConflictDecomposition(state,[gutReceipt,provenanceAlias]);
const aliasBA=V.planConflictDecomposition(state,[provenanceAlias,gutReceipt]);
for(const [label,alias] of [['AB',aliasAB],['BA',aliasBA]]){
  check(alias.status==='DECOMPOSED',`CANONICAL_ALIAS_${label}_FALSE_HOLD`,alias);
  check(alias.parent?.closed===false,`CANONICAL_ALIAS_${label}_PARENT_FALSELY_CLOSED`,alias.parent);
  check(alias.facets?.length===2,`CANONICAL_ALIAS_${label}_OVER_SPLIT`,alias.facets);
  check(alias.facets?.every(f=>f.preferredOrgan!=='DROPLET'),`CANONICAL_ALIAS_${label}_PING_PONG`,alias.facets);
  check(alias.provenance?.qualifyingReceiptCount===2,`CANONICAL_ALIAS_${label}_COUNT_LOST`,alias.provenance);
  check(alias.provenance?.canonicalAliasCount===2,`CANONICAL_ALIAS_${label}_NOT_RECOGNIZED`,alias.provenance);
  check(alias.provenance?.aliasAudit?.length===2,`CANONICAL_ALIAS_${label}_AUDIT_LOST`,alias.provenance);
  check(alias.provenance?.distinctProvenanceCount===1,`CANONICAL_ALIAS_${label}_FALSE_DISTINCT_PROVENANCE`,alias.provenance);
}
check(aliasAB.provenance?.triageProvenanceFingerprint===aliasBA.provenance?.triageProvenanceFingerprint,'CANONICAL_ALIAS_FINGERPRINT_ORDER_DEPENDENT',{ab:aliasAB.provenance,ba:aliasBA.provenance});
check(JSON.stringify(aliasAB.provenance?.aliasAudit)===JSON.stringify(aliasBA.provenance?.aliasAudit),'CANONICAL_ALIAS_AUDIT_ORDER_DEPENDENT',{ab:aliasAB.provenance,ba:aliasBA.provenance});
check(JSON.stringify(aliasAB.facets)===JSON.stringify(aliasBA.facets),'CANONICAL_ALIAS_FACET_ORDER_DEPENDENT',{ab:aliasAB.facets,ba:aliasBA.facets});

const agreeingDistinct={...gutReceipt,provenance:'gut-triage-evidence-777',summary:'A separately provenance-tagged completed GUT triage reaches the same contamination classification.'};
const agreeAB=V.planConflictDecomposition(state,[gutReceipt,agreeingDistinct]);
const agreeBA=V.planConflictDecomposition(state,[agreeingDistinct,gutReceipt]);
for(const [label,plan] of [['AB',agreeAB],['BA',agreeBA]]){
  check(plan.status==='DECOMPOSED',`DIAGNOSTIC_AGREEMENT_${label}_FALSE_HOLD`,plan);
  check(plan.behaviorRegulation?.classification==='PROVENANCE_COLLISION',`DIAGNOSTIC_AGREEMENT_${label}_CLASSIFICATION_LOST`,plan.behaviorRegulation);
  check(plan.provenance?.qualifyingReceiptCount===2,`DIAGNOSTIC_AGREEMENT_${label}_COUNT_LOST`,plan.provenance);
  check(plan.provenance?.distinctProvenanceCount===2,`DIAGNOSTIC_AGREEMENT_${label}_PROVENANCE_COLLAPSED`,plan.provenance);
  check(plan.provenance?.aliasAudit?.length===2,`DIAGNOSTIC_AGREEMENT_${label}_AUDIT_LOST`,plan.provenance);
  check(plan.provenance?.independenceClaimed===false,`DIAGNOSTIC_AGREEMENT_${label}_FALSE_INDEPENDENCE_CLAIM`,plan.provenance);
  check(plan.facets?.every(f=>f.preferredOrgan!=='DROPLET'),`DIAGNOSTIC_AGREEMENT_${label}_PING_PONG`,plan.facets);
}
check(JSON.stringify(agreeAB.facets)===JSON.stringify(agreeBA.facets),'DIAGNOSTIC_AGREEMENT_FACET_ORDER_DEPENDENT',{ab:agreeAB.facets,ba:agreeBA.facets});
check(JSON.stringify(agreeAB.provenance?.aliasAudit)===JSON.stringify(agreeBA.provenance?.aliasAudit),'DIAGNOSTIC_AGREEMENT_AUDIT_ORDER_DEPENDENT',{ab:agreeAB.provenance,ba:agreeBA.provenance});

const conflictingReceipt={...gutReceipt,provenance:'gut-triage-evidence-002',triageClassification:'DUPLICATE_CONTAMINATION',summary:'A different completed GUT triage claims a different contamination structure.'};
const conflictAB=V.planConflictDecomposition(state,[gutReceipt,conflictingReceipt]);
const conflictBA=V.planConflictDecomposition(state,[conflictingReceipt,gutReceipt]);
for(const [label,held] of [['AB',conflictAB],['BA',conflictBA]]){
  check(held.status==='HOLD',`CONFLICT_${label}_DID_NOT_HOLD`,held);
  check(held.reason==='conflicting-qualifying-gut-triage-classifications',`CONFLICT_${label}_WRONG_REASON`,held);
  check((held.facets||[]).length===0,`CONFLICT_${label}_FACET_LEAK`,held.facets);
  check(held.parent?.closed===false,`CONFLICT_${label}_PARENT_FALSELY_CLOSED`,held.parent);
  check(held.conflict?.qualifyingReceiptCount===2,`CONFLICT_${label}_COUNT_LOST`,held.conflict);
  check(held.conflict?.classifications?.length===2,`CONFLICT_${label}_CLASSIFICATION_AUDIT_LOST`,held.conflict);
}
check(JSON.stringify(conflictAB.conflict)===JSON.stringify(conflictBA.conflict),'CONFLICT_RESULT_ORDER_DEPENDENT',{conflictAB:conflictAB.conflict,conflictBA:conflictBA.conflict});

const conflictWithReplay=V.planConflictDecomposition(state,[gutReceipt,{...gutReceipt,traceId:'retry-only'},conflictingReceipt]);
check(conflictWithReplay.status==='HOLD','CONFLICT_TRANSPORT_REPLAY_FALSELY_RESOLVED',conflictWithReplay);
check(conflictWithReplay.conflict?.qualifyingReceiptCount===2,'CONFLICT_TRANSPORT_REPLAY_INFLATED_COUNT',conflictWithReplay.conflict);
check(conflictWithReplay.replaySuppression?.duplicateReplayCount===1,'CONFLICT_TRANSPORT_REPLAY_SUPPRESSION_MISSING',conflictWithReplay.replaySuppression);

const adversarial=[
  {...gutReceipt,organ:'DROPLET'},
  {...gutReceipt,clauseRef:'other-clause'},
  {...gutReceipt,provenance:''},
  {...gutReceipt,status:'PENDING'},
  {...gutReceipt,triageClassification:'CLEAN_INDEPENDENT'},
  null
];
for(const [i,r] of adversarial.entries()){
  const held=V.planConflictDecomposition(state,[r]);
  check(held.status!=='DECOMPOSED',`ADVERSARIAL_FALSE_DECOMPOSITION_${i}`,held);
  check((held.facets||[]).length===0,`ADVERSARIAL_FACET_LEAK_${i}`,held.facets);
}

const echoBreak=V.selectNextInspection({unresolved:[parent]});
check(echoBreak?.trigger==='REPEATED_SOURCE_CONTEST','CROSS_REGRESSION_TRIGGER_CHANGED',echoBreak);
check(echoBreak?.preferredOrgan==='GUT'&&echoBreak?.lens==='metabolic_contamination','CROSS_REGRESSION_ECHO_BREAK_LOST',echoBreak);
check(decomposed.facets?.every(f=>f.preferredOrgan!=='DROPLET'),'ORGAN_PING_PONG_REINTRODUCED',decomposed.facets);
check(duplicatePlan.facets?.every(f=>f.preferredOrgan!=='DROPLET')&&mixedPlan.facets?.every(f=>f.preferredOrgan!=='DROPLET'),'CLASSIFICATION_PROFILE_REINTRODUCED_PING_PONG',{duplicate:duplicatePlan.facets,mixed:mixedPlan.facets});

const result={
  schema:'zenomorph-vajra-dynamic-decomposition-test/v1.0',
  completedAt:new Date().toISOString(),
  status:failures.length?'FAIL':'PASS',
  capability:'GUT_DIAGNOSTIC_AGREEMENT_REGULATED_DYNAMIC_DECOMPOSITION_WITH_REPLAY_AND_PROVENANCE_CONTAINMENT',
  tests:{decomposed,duplicatePlan,mixedPlan,replayTriple,reorderedReplay,transportSuppressed,equivalent,nestedDistinct,aliasAB,aliasBA,agreeAB,agreeBA,conflictAB,conflictBA,conflictWithReplay,adversarialCases:adversarial.length,echoBreak},
  provenance:{fixture:'de-identified synthetic cross-organ receipt contract',sourceFiles:['nostromo/vajra/vajra-engine.js','nostromo/vajra/dynamic-reinspection.js','nostromo/vajra/dynamic-decomposition.js'],failureEvidence:'nostromo/failure-log/2026-09-09-vajra-provenance-diagnostic-conflation.json'},
  failures,
  failureLog:{count:failures.length,entries:failures},
  boundary:'PASS proves only that distinct provenance no longer creates false diagnostic conflict when qualifying GUT receipts agree on one authorized contamination classification, while classification disagreement still HOLDs with zero facets, replay suppression and provenance audit remain intact, no source-independence claim is manufactured, the contested parent remains open, and the existing GUT echo-break regression holds. It does not prove semantic contamination detection, source truth, source independence, connector integrity, generated-facet execution, autonomous organ creation, or body admission.'
};
await fs.writeFile('nostromo/vajra/dynamic-decomposition-last-result.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));
if(failures.length) process.exitCode=1;
