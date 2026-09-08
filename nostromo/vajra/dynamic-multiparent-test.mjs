import fs from 'node:fs/promises';
import vm from 'node:vm';
const load=async p=>vm.runInThisContext(await fs.readFile(p,'utf8'),{filename:p});
await load('nostromo/vajra/vajra-engine.js');
await load('nostromo/vajra/dynamic-reinspection.js');
await load('nostromo/vajra/dynamic-decomposition.js');
const V=globalThis.VajraEngine;
const failures=[];
const check=(ok,type,detail)=>{if(!ok) failures.push({type,detail});};

const parentA={status:'CONTESTED_BY_RECEIPTS',targetRef:'target-A',clauseRef:'clause-A',lens:'source_quality'};
const parentB={status:'CONTESTED_BY_RECEIPTS',targetRef:'target-B',clauseRef:'clause-B',lens:'source_quality'};
const stateAB={status:'CONTESTED_BY_RECEIPTS',unresolved:[parentA,parentB]};
const stateBA={status:'CONTESTED_BY_RECEIPTS',unresolved:[parentB,parentA]};
const receiptA={targetRef:'target-A',clauseRef:'clause-A',lens:'metabolic_contamination',organ:'GUT',status:'COMPLETED',provenance:'gut-triage-A',triageClassification:'PROVENANCE_COLLISION',summary:'Synthetic triage A'};
const receiptB={targetRef:'target-B',clauseRef:'clause-B',lens:'metabolic_contamination',organ:'GUT',status:'COMPLETED',provenance:'gut-triage-B',triageClassification:'DUPLICATE_CONTAMINATION',summary:'Synthetic triage B'};

check(V.dynamicDecompositionVersion==='1.0','DYNAMIC_DECOMPOSITION_VERSION_NOT_10',V.dynamicDecompositionVersion);

const bFromAB=V.planConflictDecomposition(stateAB,[receiptB]);
const bFromBA=V.planConflictDecomposition(stateBA,[receiptB]);
for(const [label,out] of [['AB',bFromAB],['BA',bFromBA]]){
  check(out.status==='DECOMPOSED',`SECOND_PARENT_${label}_NOT_DECOMPOSED`,out);
  check(out.parent?.targetRef==='target-B'&&out.parent?.clauseRef==='clause-B',`SECOND_PARENT_${label}_MISROUTED`,out.parent);
  check(out.facets?.every(f=>f.targetRef==='target-B'&&f.clauseRef==='clause-B'),`SECOND_PARENT_${label}_FACET_SCOPE_LOST`,out.facets);
  check(out.facets?.some(f=>f.lens==='duplicate_cluster'&&f.preferredOrgan==='GUT'),`SECOND_PARENT_${label}_PROFILE_WRONG`,out.facets);
  check(out.provenance?.preservedTargetRef==='target-B'&&out.provenance?.preservedClauseRef==='clause-B',`SECOND_PARENT_${label}_PROVENANCE_SCOPE_LOST`,out.provenance);
}
check(JSON.stringify(bFromAB.facets)===JSON.stringify(bFromBA.facets),'BRANCH_ORDER_CHANGED_TARGETED_DECOMPOSITION',{ab:bFromAB.facets,ba:bFromBA.facets});

const aFromAB=V.planConflictDecomposition(stateAB,[receiptA]);
check(aFromAB.status==='DECOMPOSED','FIRST_PARENT_REGRESSION',aFromAB);
check(aFromAB.parent?.targetRef==='target-A','FIRST_PARENT_SCOPE_CHANGED',aFromAB.parent);

const multiAB=V.planConflictDecomposition(stateAB,[receiptA,receiptB]);
const multiBA=V.planConflictDecomposition(stateAB,[receiptB,receiptA]);
for(const [label,out] of [['AB',multiAB],['BA',multiBA]]){
  check(out.status==='HOLD',`MULTI_TARGET_${label}_DID_NOT_HOLD`,out);
  check(out.reason==='multiple-contested-parents-targeted',`MULTI_TARGET_${label}_WRONG_REASON`,out);
  check((out.facets||[]).length===0,`MULTI_TARGET_${label}_FACET_LEAK`,out.facets);
  check((out.parents||[]).length===2,`MULTI_TARGET_${label}_PARENT_AUDIT_LOST`,out.parents);
  check((out.parents||[]).every(p=>p.closed===false),`MULTI_TARGET_${label}_FALSE_CLOSURE`,out.parents);
}

const unscoped=V.planConflictDecomposition(stateAB,[{organ:'GUT',status:'COMPLETED',provenance:'synthetic',triageClassification:'PROVENANCE_COLLISION'}]);
check(unscoped.status==='HOLD','UNSCOPED_MULTI_PARENT_FALSE_DECOMPOSITION',unscoped);
check(unscoped.reason==='targeted-contested-source-quality-parent-required','UNSCOPED_MULTI_PARENT_WRONG_REASON',unscoped);
check((unscoped.facets||[]).length===0,'UNSCOPED_MULTI_PARENT_FACET_LEAK',unscoped.facets);

const singleState={status:'CONTESTED_BY_RECEIPTS',unresolved:[parentA]};
const wrongScope=V.planConflictDecomposition(singleState,[receiptB]);
check(wrongScope.status==='HOLD','SINGLE_PARENT_SCOPE_MISMATCH_FALSE_DECOMPOSITION',wrongScope);
check(wrongScope.reason==='qualifying-gut-contamination-triage-required','SINGLE_PARENT_EXISTING_BEHAVIOR_CHANGED',wrongScope);
check(wrongScope.rejected?.some(x=>x.reason==='scope-mismatch'),'SINGLE_PARENT_SCOPE_REJECTION_AUDIT_LOST',wrongScope.rejected);

const result={
  schema:'zenomorph-vajra-dynamic-multiparent-test/v0.2',
  completedAt:new Date().toISOString(),
  status:failures.length?'FAIL':'PASS',
  capability:'RECEIPT_SCOPED_MULTI_PARENT_DYNAMIC_DECOMPOSITION',
  tests:{bFromAB,bFromBA,aFromAB,multiAB,multiBA,unscoped,wrongScope},
  provenance:{fixture:'synthetic de-identified multi-parent contested state',failureEvidence:'nostromo/failure-log/2026-09-08-vajra-multiparent-target-selection.json'},
  failures,
  boundary:'PASS proves only that VAJRA v1.0 can select exactly one contested source-quality parent by receipt targetRef+clauseRef independent of branch order, and HOLD when one bounded call targets multiple parents or leaves a multi-parent target ambiguous. It does not execute generated facets, decide source truth, or admit a capability into persistent body state.'
};
await fs.writeFile('nostromo/vajra/dynamic-multiparent-last-result.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));
if(failures.length) process.exitCode=1;
