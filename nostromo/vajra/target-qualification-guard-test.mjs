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

check(V.dynamicTargetQualificationGuardVersion==='0.1','TARGET_QUALIFICATION_GUARD_VERSION_MISSING',V.dynamicTargetQualificationGuardVersion);

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
  check(out.rejected?.some(x=>['gut-receipt-required','completed-receipt-required','non-decomposing-triage-class'].includes(x.reason)),`${label}_NOISE_REJECTION_AUDIT_LOST`,out.rejected);
}

const both=V.planConflictDecomposition(stateAB,[validA,validB]);
check(both.status==='HOLD','TWO_QUALIFYING_TARGETS_DID_NOT_HOLD',both);
check(both.reason==='multiple-contested-parents-targeted','TWO_QUALIFYING_TARGETS_WRONG_REASON',both.reason);

const none=V.planConflictDecomposition(stateAB,[nonGutA]);
check(none.status==='HOLD','NO_QUALIFYING_TARGET_FALSE_DECOMPOSITION',none);
check(none.reason==='targeted-contested-source-quality-parent-required','NO_QUALIFYING_TARGET_WRONG_REASON',none.reason);

const single={status:'CONTESTED_BY_RECEIPTS',unresolved:[parentB]};
const singleOut=V.planConflictDecomposition(single,[validB]);
check(singleOut.status==='DECOMPOSED','SINGLE_PARENT_REGRESSION',singleOut);

const crossOrgan=V.planConflictDecomposition(stateAB,[
  {...nonGutA,organ:'DROPLET',summary:'Synthetic external verification traffic unrelated to triage'},
  validB
]);
check(crossOrgan.status==='DECOMPOSED','CROSS_ORGAN_NOISE_BLOCKED_GUT_REGULATION',crossOrgan);
check(crossOrgan.facets?.some(f=>f.lens==='duplicate_cluster'&&f.preferredOrgan==='GUT'),'CROSS_ORGAN_GUT_PROFILE_NOT_PRESERVED',crossOrgan.facets);
check(crossOrgan.facets?.some(f=>f.lens==='claim_relation'&&f.preferredOrgan==='MUTHER'),'CROSS_ORGAN_MUTHER_ROUTING_NOT_PRESERVED',crossOrgan.facets);

const result={
  schema:'zenomorph-vajra-target-qualification-guard-test/v0.1',
  completedAt:new Date().toISOString(),
  status:failures.length?'FAIL':'PASS',
  capability:'QUALIFICATION_GATED_MULTI_PARENT_TARGET_SELECTION',
  tests:{both,none,singleOut,crossOrgan},
  failures,
  provenance:{fixture:'synthetic de-identified contested-parent and cross-organ receipt fixtures',failureEvidence:'nostromo/failure-log/2026-09-08-vajra-nonqualifying-receipt-target-pollution.json'},
  boundary:'PASS proves only that nonqualifying cross-organ or incomplete receipt traffic cannot add a competing multi-parent target when exactly one completed supported GUT contamination-triage receipt identifies a parent; rejected noise remains auditable, two genuinely qualifying parent targets still HOLD, and GUT diagnosis can continue to alter downstream VAJRA/MUTHER routing. It does not decide source truth or execute generated facets.'
};
await fs.writeFile('nostromo/vajra/target-qualification-guard-last-result.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));
if(failures.length) process.exitCode=1;
