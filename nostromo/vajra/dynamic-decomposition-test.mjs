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

// Unit: a structurally qualifying GUT triage must alter VAJRA behavior by decomposing one parent conflict.
const decomposed=V.planConflictDecomposition(state,[gutReceipt]);
check(decomposed.status==='DECOMPOSED','QUALIFYING_TRIAGE_DID_NOT_DECOMPOSE',decomposed);
check(decomposed.parent?.closed===false,'PARENT_FALSELY_CLOSED',decomposed.parent);
check(decomposed.facets?.length===2,'WRONG_FACET_COUNT',decomposed.facets);
check(decomposed.facets?.some(f=>f.lens==='source_identity'&&f.preferredOrgan==='GUT'),'SOURCE_IDENTITY_FACET_MISSING',decomposed.facets);
check(decomposed.facets?.some(f=>f.lens==='claim_relation'&&f.preferredOrgan==='MUTHER'),'CLAIM_RELATION_FACET_MISSING',decomposed.facets);
check(decomposed.facets?.every(f=>f.targetRef==='target-001'&&f.clauseRef==='clause-001'),'PROVENANCE_SCOPE_LOST',decomposed.facets);
check(Boolean(decomposed.provenance?.triageProvenance&&decomposed.provenance?.triageReceiptFingerprint),'PROVENANCE_NOT_RETAINED',decomposed.provenance);

// Adversarial: malformed, wrong-organ, scope-shifted, missing-provenance and non-decomposing receipts must not alter behavior.
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

// Cross-organ regression: existing echo-break behavior remains intact before any GUT triage is returned.
const echoBreak=V.selectNextInspection({unresolved:[parent]});
check(echoBreak?.trigger==='REPEATED_SOURCE_CONTEST','CROSS_REGRESSION_TRIGGER_CHANGED',echoBreak);
check(echoBreak?.preferredOrgan==='GUT'&&echoBreak?.lens==='metabolic_contamination','CROSS_REGRESSION_ECHO_BREAK_LOST',echoBreak);

// Anti-ping-pong: decomposition never sends the parent source_quality conflict straight back to DROPLET.
check(decomposed.facets?.every(f=>f.preferredOrgan!=='DROPLET'),'ORGAN_PING_PONG_REINTRODUCED',decomposed.facets);

const result={
  schema:'zenomorph-vajra-dynamic-decomposition-test/v0.1',
  completedAt:new Date().toISOString(),
  status:failures.length?'FAIL':'PASS',
  capability:'GUT_CONTAMINATION_TRIAGE_CHANGES_VAJRA_DECOMPOSITION',
  tests:{decomposed,adversarialCases:adversarial.length,echoBreak},
  provenance:{fixture:'de-identified synthetic cross-organ receipt contract',sourceFiles:['nostromo/vajra/vajra-engine.js','nostromo/vajra/dynamic-reinspection.js','nostromo/vajra/dynamic-decomposition.js']},
  failures,
  failureLog:{count:failures.length,entries:failures},
  boundary:'PASS proves only that one explicit, provenance-bearing, clause-scoped GUT contamination triage class changes VAJRA from a single repeated source-quality conflict into two bounded open inspection facets while preserving the parent conflict, provenance and existing echo-break behavior. It does not prove source truth, semantic decomposition, contamination detection quality, organ execution, or body admission.'
};
await fs.writeFile('nostromo/vajra/dynamic-decomposition-last-result.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));
if(failures.length) process.exitCode=1;
