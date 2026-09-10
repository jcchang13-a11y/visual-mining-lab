import fs from 'node:fs/promises';
import vm from 'node:vm';
const load=async p=>vm.runInThisContext(await fs.readFile(p,'utf8'),{filename:p});
await load('nostromo/vajra/vajra-engine.js');
await load('nostromo/vajra/dynamic-reinspection.js');
await load('nostromo/vajra/dynamic-decomposition.js');
await load('nostromo/vajra/dynamic-receipt-integrity.js');
const V=globalThis.VajraEngine;
const failures=[];const check=(ok,type,detail)=>{if(!ok)failures.push({type,detail});};
const parent={status:'CONTESTED_BY_RECEIPTS',targetRef:'target-integrity-001',clauseRef:'clause-integrity-001',lens:'source_quality',evidenceKeys:['receipt-safe']};
const state={status:'CONTESTED_BY_RECEIPTS',unresolved:[parent]};
const safe={targetRef:parent.targetRef,clauseRef:parent.clauseRef,organ:'GUT',status:'COMPLETED',provenance:'gut-triage-integrity-safe',triageClassification:'DUPLICATE_CONTAMINATION',summary:'synthetic de-identified safe triage'};
check(V.dynamicReceiptIntegrityVersion==='0.1','INTEGRITY_VERSION_MISMATCH',V.dynamicReceiptIntegrityVersion);
const baseline=V.planConflictDecomposition(state,[safe]);
check(baseline.status==='DECOMPOSED','SAFE_RECEIPT_FALSELY_BLOCKED',baseline);
check(baseline.receiptIntegrity?.admitted===1&&baseline.receiptIntegrity?.quarantined===0,'SAFE_RECEIPT_AUDIT_WRONG',baseline.receiptIntegrity);

let getterCount=0;
const accessor={targetRef:parent.targetRef,clauseRef:parent.clauseRef,organ:'GUT',status:'COMPLETED',provenance:'gut-triage-accessor',triageClassification:'DUPLICATE_CONTAMINATION'};
Object.defineProperty(accessor,'summary',{enumerable:true,get(){getterCount++;return 'must not execute';}});
const accessorResult=V.planConflictDecomposition(state,[accessor]);
check(getterCount===0,'ACCESSOR_EXECUTED',getterCount);
check(accessorResult.status==='HOLD','ACCESSOR_RECEIPT_CHANGED_BEHAVIOR',accessorResult);
check(accessorResult.receiptIntegrity?.quarantined===1,'ACCESSOR_NOT_QUARANTINED',accessorResult.receiptIntegrity);
check(accessorResult.rejected?.some(r=>r.reason==='receipt-accessor-present'&&r.receiptIntegrityGuard===true),'ACCESSOR_REJECTION_NOT_AUDITED',accessorResult.rejected);

let callableCount=0;
const callable={...safe,provenance:'gut-triage-callable',metadata:{transform(){callableCount++;}}};
const callableResult=V.planConflictDecomposition(state,[callable]);
check(callableCount===0,'CALLABLE_EXECUTED',callableCount);
check(callableResult.status==='HOLD','CALLABLE_RECEIPT_CHANGED_BEHAVIOR',callableResult);
check(callableResult.rejected?.some(r=>r.reason==='receipt-callable-present'&&String(r.unsafePath).includes('metadata.transform')),'NESTED_CALLABLE_NOT_AUDITED',callableResult.rejected);

let nestedGetterCount=0;
const nestedAccessor={...safe,provenance:'gut-triage-nested-accessor',metadata:{}};
Object.defineProperty(nestedAccessor.metadata,'transport',{enumerable:true,get(){nestedGetterCount++;return {trace:'x'};}});
const nestedAccessorResult=V.planConflictDecomposition(state,[nestedAccessor]);
check(nestedGetterCount===0,'NESTED_ACCESSOR_EXECUTED',nestedGetterCount);
check(nestedAccessorResult.status==='HOLD','NESTED_ACCESSOR_CHANGED_BEHAVIOR',nestedAccessorResult);
check(nestedAccessorResult.rejected?.some(r=>r.reason==='receipt-accessor-present'&&String(r.unsafePath).includes('metadata.transport')),'NESTED_ACCESSOR_NOT_AUDITED',nestedAccessorResult.rejected);

const mixed=V.planConflictDecomposition(state,[safe,callable,nestedAccessor]);
check(mixed.status==='DECOMPOSED','SAFE_RECEIPT_COULD_NOT_SURVIVE_UNSAFE_NEIGHBORS',mixed);
check(mixed.receiptIntegrity?.admitted===1&&mixed.receiptIntegrity?.quarantined===2,'MIXED_AUDIT_COUNTS_WRONG',mixed.receiptIntegrity);
check(mixed.provenance?.qualifyingReceiptCount===1,'UNSAFE_RECEIPTS_INFLATED_QUALIFYING_COUNT',mixed.provenance);
check(callableCount===0&&nestedGetterCount===0,'UNSAFE_NEIGHBOR_SIDE_EFFECT',{callableCount,nestedGetterCount});

const foreignOrgan={...safe,organ:'DROPLET',provenance:'droplet-cross-organ-control'};
const crossOrgan=V.planConflictDecomposition(state,[foreignOrgan]);
check(crossOrgan.status==='HOLD','NON_GUT_RECEIPT_WRONGLY_DECOMPOSED',crossOrgan);
check(crossOrgan.receiptIntegrity?.admitted===1&&crossOrgan.receiptIntegrity?.quarantined===0,'INERT_NON_GUT_WRONGLY_QUARANTINED',crossOrgan.receiptIntegrity);
check(crossOrgan.rejected?.some(r=>r.reason==='gut-receipt-required'),'SEMANTIC_ORGAN_BOUNDARY_LOST',crossOrgan.rejected);

const result={schema:'zenomorph-vajra-receipt-integrity-test/v0.1',completedAt:new Date().toISOString(),status:failures.length?'FAIL':'PASS',capability:'CROSS_ORGAN_RECEIPT_SIDE_EFFECT_CONTAINMENT',tests:{baseline,accessorResult,callableResult,nestedAccessorResult,mixed,crossOrgan},sideEffects:{getterCount,callableCount,nestedGetterCount},provenance:{fixture:'synthetic de-identified GUT and DROPLET receipt structures only'},failures,boundary:'PASS means VAJRA dynamic decomposition only semantically reads cross-organ receipts after bounded inert-data inspection. Accessors and callables are quarantined without invocation; safe receipts continue to regulate behavior; semantic organ qualification remains separate from transport integrity. JavaScript Proxy trap behavior is explicitly outside this plain-serialized-receipt guarantee.'};
await fs.writeFile('nostromo/vajra/dynamic-receipt-integrity-last-result.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));
if(failures.length) process.exitCode=1;
