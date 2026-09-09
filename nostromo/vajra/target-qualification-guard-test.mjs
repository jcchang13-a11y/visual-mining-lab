import fs from 'node:fs/promises';
import vm from 'node:vm';
const load=async p=>vm.runInThisContext(await fs.readFile(p,'utf8'),{filename:p});
await load('nostromo/vajra/vajra-engine.js');
await load('nostromo/vajra/dynamic-reinspection.js');
await load('nostromo/vajra/dynamic-decomposition.js');
await load('nostromo/vajra/target-qualification-guard.js');
const V=globalThis.VajraEngine;
const failures=[];
const check=(ok,type,detail)=>{if(!ok) failures.push({type,detail});};

const parentA={status:'CONTESTED_BY_RECEIPTS',targetRef:'target-A',clauseRef:'clause-A',lens:'source_quality'};
const parentB={status:'CONTESTED_BY_RECEIPTS',targetRef:'target-B',clauseRef:'clause-B',lens:'source_quality'};
const stateAB={status:'CONTESTED_BY_RECEIPTS',unresolved:[parentA,parentB]};
const stateBA={status:'CONTESTED_BY_RECEIPTS',unresolved:[parentB,parentA]};
const validB={targetRef:'target-B',clauseRef:'clause-B',organ:'GUT',status:'COMPLETED',provenance:'gut-triage-B',triageClassification:'DUPLICATE_CONTAMINATION',summary:'Synthetic valid GUT triage B'};
const validA={targetRef:'target-A',clauseRef:'clause-A',organ:'GUT',status:'COMPLETED',provenance:'gut-triage-A',triageClassification:'PROVENANCE_COLLISION',summary:'Synthetic valid GUT triage A'};
const nonGutA={targetRef:'target-A',clauseRef:'clause-A',organ:'MUTHER',status:'COMPLETED',provenance:'muther-noise-A',triageClassification:'PROVENANCE_COLLISION',summary:'Synthetic non-GUT noise'};
const incompleteA={targetRef:'target-A',clauseRef:'clause-A',organ:'GUT',status:'PENDING',provenance:'gut-pending-A',triageClassification:'MIXED_CONTAMINATION',summary:'Synthetic incomplete GUT noise'};
const unsupportedA={targetRef:'target-A',clauseRef:'clause-A',organ:'GUT',status:'COMPLETED',provenance:'gut-unsupported-A',triageClassification:'SOURCE_TRUTH_DECISION',summary:'Synthetic unsupported classification'};

check(V.dynamicTargetQualificationGuardVersion==='0.3','TARGET_QUALIFICATION_GUARD_VERSION_MISSING',V.dynamicTargetQualificationGuardVersion);
check(V.dynamicDecompositionVersion==='1.3','DYNAMIC_DECOMPOSITION_VERSION_NOT_13',V.dynamicDecompositionVersion);

for(const [label,state,receipts] of [
  ['NON_GUT_AB',stateAB,[nonGutA,validB]],
  ['NON_GUT_BA',stateBA,[validB,nonGutA]],
  ['INCOMPLETE',stateAB,[incompleteA,validB]],
  ['UNSUPPORTED',stateAB,[unsupportedA,validB]],
  ['RECEIPT_ORDER',stateAB,[validB,nonGutA]]
]){
  const out=V.planConflictDecomposition(state,receipts);
  check(out.status==='DECOMPOSED',`${label}_VALID_TARGET_BLOCKED`,out);
  check(out.parent?.targetRef==='target-B'&&out.parent?.clauseRef==='clause-B',`${label}_VALID_TARGET_MISROUTED`,out.parent);
  check(out.targetQualificationGuard?.eligibleTargetCount===1,`${label}_GUARD_AUDIT_MISSING`,out.targetQualificationGuard);
  check((out.rejected||[]).length>=1,`${label}_NOISE_REJECTION_AUDIT_LOST`,out.rejected);
  check(out.rejected?.some(x=>x.reason==='scope-mismatch'),`${label}_SCOPED_NOISE_NOT_EXPLICITLY_REJECTED`,out.rejected);
  check((out.targetQualificationGuard?.preselectionRejected||[]).length>=1,`${label}_PRESELECTION_REJECTION_AUDIT_LOST`,out.targetQualificationGuard);
}

const both=V.planConflictDecomposition(stateAB,[validA,validB]);
check(both.status==='HOLD','TWO_QUALIFYING_TARGETS_DID_NOT_HOLD',both);
check(both.reason==='multiple-contested-parents-targeted','TWO_QUALIFYING_TARGETS_WRONG_REASON',both.reason);

const none=V.planConflictDecomposition(stateAB,[nonGutA]);
check(none.status==='HOLD','NO_QUALIFYING_TARGET_FALSE_DECOMPOSITION',none);
check(none.reason==='qualifying-targeted-contested-source-quality-parent-required','NO_QUALIFYING_TARGET_WRONG_REASON',none.reason);
check(none.rejected?.some(x=>x.reason==='gut-receipt-required'),'NO_QUALIFYING_TARGET_REJECTION_AUDIT_LOST',none.rejected);
check(none.targetQualificationGuard?.eligibleTargetCount===0,'NO_QUALIFYING_TARGET_GUARD_AUDIT_MISSING',none.targetQualificationGuard);

const single={status:'CONTESTED_BY_RECEIPTS',unresolved:[parentB]};
const singleOut=V.planConflictDecomposition(single,[validB]);
check(singleOut.status==='DECOMPOSED','SINGLE_PARENT_REGRESSION',singleOut);

const agreeingB={...validB,provenance:'gut-triage-B-distinct-provenance',summary:'A second unique completed GUT receipt carries the same bounded contamination classification; independence itself is not asserted.'};
const consensus=V.planConflictDecomposition(single,[validB,agreeingB]);
check(consensus.status==='DECOMPOSED','AGREEING_DISTINCT_PROVENANCE_FALSE_HOLD',consensus);
check(consensus.reason==='qualifying-gut-contamination-diagnostic-agreement-selected-bounded-profile','AGREEING_DISTINCT_PROVENANCE_WRONG_REASON',consensus.reason);
check(consensus.provenance?.triageClassification==='DUPLICATE_CONTAMINATION','CONSENSUS_CLASSIFICATION_NOT_AUDITED',consensus.provenance);
check(consensus.provenance?.distinctProvenanceCount===2,'DISTINCT_PROVENANCE_COUNT_LOST',consensus.provenance);
check(consensus.provenance?.independenceClaimed===false,'DISTINCT_PROVENANCE_FALSE_INDEPENDENCE_CLAIM',consensus.provenance);
check(consensus.provenance?.qualifyingReceiptCount===2,'CONSENSUS_RECEIPT_COUNT_LOST',consensus.provenance);
check(consensus.provenance?.aliasAudit?.length===2,'CONSENSUS_PROVENANCE_AUDIT_LOST',consensus.provenance);
check(consensus.facets?.some(f=>f.lens==='duplicate_cluster'&&f.preferredOrgan==='GUT'),'CONSENSUS_GUT_PROFILE_LOST',consensus.facets);
check(consensus.facets?.some(f=>f.lens==='claim_relation'&&f.preferredOrgan==='MUTHER'),'CONSENSUS_MUTHER_ROUTING_LOST',consensus.facets);

const disagreeingB={...agreeingB,provenance:'gut-triage-B-disagreement',triageClassification:'MIXED_CONTAMINATION',summary:'A second unique completed GUT receipt disagrees on contamination classification.'};
const disagreement=V.planConflictDecomposition(single,[validB,disagreeingB]);
check(disagreement.status==='HOLD','CLASSIFICATION_DISAGREEMENT_FALSELY_RESOLVED',disagreement);
check(disagreement.reason==='conflicting-qualifying-gut-triage-classifications','CLASSIFICATION_DISAGREEMENT_WRONG_REASON',disagreement.reason);
check((disagreement.facets||[]).length===0,'CLASSIFICATION_DISAGREEMENT_FACET_LEAK',disagreement.facets);
check(disagreement.conflict?.classifications?.length===2,'CLASSIFICATION_DISAGREEMENT_AUDIT_LOST',disagreement.conflict);

const replayConsensus=V.planConflictDecomposition(single,[validB,{...validB,traceId:'retry-only'},agreeingB]);
check(replayConsensus.status==='DECOMPOSED','CONSENSUS_WITH_REPLAY_FALSE_HOLD',replayConsensus);
check(replayConsensus.provenance?.qualifyingReceiptCount===2,'CONSENSUS_REPLAY_INFLATED_COUNT',replayConsensus.provenance);
check(replayConsensus.provenance?.distinctProvenanceCount===2,'CONSENSUS_REPLAY_CHANGED_PROVENANCE_DIVERSITY',replayConsensus.provenance);
check(replayConsensus.replaySuppression?.duplicateReplayCount===1,'CONSENSUS_REPLAY_SUPPRESSION_LOST',replayConsensus.replaySuppression);

const crossOrgan=V.planConflictDecomposition(stateAB,[
  {...nonGutA,organ:'DROPLET',summary:'Synthetic external verification traffic unrelated to triage'},
  validB
]);
check(crossOrgan.status==='DECOMPOSED','CROSS_ORGAN_NOISE_BLOCKED_GUT_REGULATION',crossOrgan);
check(crossOrgan.rejected?.some(x=>x.reason==='scope-mismatch'),'CROSS_ORGAN_NOISE_REJECTION_AUDIT_LOST',crossOrgan.rejected);
check(crossOrgan.targetQualificationGuard?.preselectionRejected?.some(x=>x.reason==='gut-receipt-required'),'CROSS_ORGAN_PRESELECTION_AUDIT_LOST',crossOrgan.targetQualificationGuard);
check(crossOrgan.facets?.some(f=>f.lens==='duplicate_cluster'&&f.preferredOrgan==='GUT'),'CROSS_ORGAN_GUT_PROFILE_NOT_PRESERVED',crossOrgan.facets);
check(crossOrgan.facets?.some(f=>f.lens==='claim_relation'&&f.preferredOrgan==='MUTHER'),'CROSS_ORGAN_MUTHER_ROUTING_NOT_PRESERVED',crossOrgan.facets);

const result={
  schema:'zenomorph-vajra-target-qualification-guard-test/v0.6',
  completedAt:new Date().toISOString(),
  status:failures.length?'FAIL':'PASS',
  capability:'QUALIFICATION_GATED_MULTI_PARENT_TARGET_SELECTION_WITH_PROVENANCE_DIVERSITY_CONTAINMENT',
  tests:{both,none,singleOut,consensus,disagreement,replayConsensus,crossOrgan},
  failures,
  provenance:{fixture:'synthetic de-identified contested-parent and cross-organ receipt fixtures',failureEvidence:['nostromo/failure-log/2026-09-08-vajra-nonqualifying-receipt-target-pollution.json','nostromo/failure-log/2026-09-09-vajra-provenance-diagnostic-conflation.json','nostromo/failure-log/2026-09-09-vajra-nonqualifying-receipt-target-poisoning.json']},
  boundary:'PASS proves that the existing target-qualification wrapper remains compatible with current core VAJRA v1.3, including tightened diagnostic replay containment. Nonqualifying traffic cannot manufacture multi-parent target multiplicity. Multiple unique completed GUT receipts scoped to one parent may select the same bounded profile only when their supported contamination classification is unanimous; classification disagreement still HOLDs. It does not decide source truth, execute facets, install capabilities, or mutate persistent body state.'
};
await fs.writeFile('nostromo/vajra/target-qualification-guard-last-result.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));
if(failures.length) process.exitCode=1;
