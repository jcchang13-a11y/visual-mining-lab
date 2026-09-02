import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
const root=process.cwd();
async function loadScript(rel){const code=await fs.readFile(path.join(root,rel),'utf8');vm.runInThisContext(code,{filename:rel});}
await loadScript('nostromo/vajra/vajra-engine.js');
await loadScript('nostromo/vajra/receipt-uncertainty-guard.js');
await loadScript('nostromo/gut/gut-engine.js');
const failures=[];
function check(ok,type,detail){if(!ok)failures.push({type,detail});}
const target='目前測試資料顯示 GUT 可以隔離重複污染。';
const base=globalThis.VajraEngine.run(target,6);
const contract=base.handoffs.find(x=>x.lens==='evidence');
check(Boolean(contract),'EVIDENCE_CONTRACT_MISSING',base.handoffs);
check(globalThis.VajraEngine.receiptUncertaintyGuardVersion==='0.3.8','GUARD_VERSION_MISSING',globalThis.VajraEngine.receiptUncertaintyGuardVersion);
check(globalThis.VajraEngine.receiptContractAdequacyGuardVersion==='0.2','ADEQUACY_GUARD_VERSION_MISSING',globalThis.VajraEngine.receiptContractAdequacyGuardVersion);
const common={targetRef:contract.targetRef,clauseRef:contract.clauseRef,lens:'evidence',organ:contract.preferredOrgan,status:'EXECUTED',material:'The searched evidence bundle contains multiple traceable observations and preserves source provenance.'};
const insufficient={...common,provenanceFingerprint:'prov-uncertain-001',relationToTarget:'The available evidence is insufficient and does not support a conclusion about the target claim.'};
const negatedRefute={...common,provenanceFingerprint:'prov-uncertain-002',relationToTarget:'The evidence does not refute the target claim, but remains insufficient to support it.'};
const zhUncertain={...common,provenanceFingerprint:'prov-uncertain-003',relationToTarget:'目前證據不足以支持或反駁這個命題，無法判定。'};
const negatedContradict={...common,provenanceFingerprint:'prov-negated-contradict-001',relationToTarget:'The returned evidence does not contradict the target claim within the searched scope.'};
const notInconsistent={...common,provenanceFingerprint:'prov-not-inconsistent-001',relationToTarget:'The returned evidence is not inconsistent with the target claim, but that compatibility does not establish support.'};
const failsToSupport={...common,provenanceFingerprint:'prov-fails-support-001',relationToTarget:'The returned evidence fails to support the target claim under the current measurement conditions.'};
const zhNegated={...common,provenanceFingerprint:'prov-zh-negated-001',relationToTarget:'目前材料並未支持這個命題，也不構成反證。'};
const longNoncommittal={...common,provenanceFingerprint:'prov-unspecified-001',relationToTarget:'The returned material discusses the same target and provides additional context about the surrounding test conditions and implementation history.'};
const mixedRelation={...common,provenanceFingerprint:'prov-mixed-001',relationToTarget:'The returned evidence supports the target claim under one measured condition but refutes the target claim under another measured condition.'};
for(const [label,receipt,reason,counter] of [
  ['INSUFFICIENT',insufficient,'INDETERMINATE_RELATION','indeterminate'],
  ['NEGATED_REFUTE',negatedRefute,'INDETERMINATE_RELATION','indeterminate'],
  ['ZH_UNCERTAIN',zhUncertain,'INDETERMINATE_RELATION','indeterminate'],
  ['NEGATED_CONTRADICT',negatedContradict,'INDETERMINATE_RELATION','indeterminate'],
  ['NOT_INCONSISTENT',notInconsistent,'INDETERMINATE_RELATION','indeterminate'],
  ['FAILS_TO_SUPPORT',failsToSupport,'INDETERMINATE_RELATION','indeterminate'],
  ['ZH_NEGATED',zhNegated,'INDETERMINATE_RELATION','indeterminate'],
  ['UNSPECIFIED',longNoncommittal,'UNSPECIFIED_RELATION','unspecified'],
  ['MIXED',mixedRelation,'MIXED_RELATION','mixed']
]){
  const applied=globalThis.VajraEngine.applyHandoffResults(base,[receipt]);
  check(applied.version==='0.3.8',`${label}_VERSION`,applied.version);
  check(applied.handoffResolution.resolved===0,`${label}_FALSE_RESOLUTION`,applied.handoffResolution);
  check(applied.unresolved.find(x=>x.lens==='evidence')?.status==='UNRESOLVED',`${label}_BRANCH_CLOSED`,applied.unresolved);
  check(applied.handoffResolution.rejectedReceipts.some(x=>x.reasons?.includes(reason)),`${label}_REJECTION_NOT_AUDITED`,applied.handoffResolution);
  check(applied.handoffResolution[counter]===1,`${label}_${counter.toUpperCase()}_COUNT`,applied.handoffResolution);
}
const supportive={...common,provenanceFingerprint:'prov-support-001',relationToTarget:'The returned evidence supports the target claim within the explicitly searched scope.'};
const refuting={...common,provenanceFingerprint:'prov-refute-001',relationToTarget:'The returned evidence refutes the target claim within the explicitly searched scope.'};
const supportApplied=globalThis.VajraEngine.applyHandoffResults(base,[supportive]);
check(supportApplied.handoffResolution.resolved===1,'SUPPORTIVE_RECEIPT_BLOCKED',supportApplied.handoffResolution);
check(supportApplied.unresolved.find(x=>x.lens==='evidence')?.status==='RESOLVED_BY_RECEIPT','SUPPORTIVE_BRANCH_NOT_CLOSED',supportApplied.unresolved);
const refuteApplied=globalThis.VajraEngine.applyHandoffResults(base,[refuting]);
check(refuteApplied.handoffResolution.resolved===1,'REFUTING_RECEIPT_BLOCKED',refuteApplied.handoffResolution);
check(refuteApplied.unresolved.find(x=>x.lens==='evidence')?.status==='RESOLVED_BY_RECEIPT','REFUTING_BRANCH_NOT_CLOSED',refuteApplied.unresolved);
const sameProvSupport={...common,provenanceFingerprint:'prov-same-source-001',material:'The same provenance identity emits one supporting return about the tested condition.',relationToTarget:'This return supports the target claim under the tested condition.'};
const sameProvRefute={...common,provenanceFingerprint:'PROV SAME SOURCE 001',material:'The same provenance identity also emits an opposing return about the same tested condition.',relationToTarget:'This return refutes the target claim under the tested condition.'};
const sameProvApplied=globalThis.VajraEngine.applyHandoffResults(base,[sameProvSupport,sameProvRefute]);
const sameProvBranch=sameProvApplied.unresolved.find(x=>x.lens==='evidence');
check(sameProvApplied.version==='0.3.8','SAME_PROVENANCE_VERSION',sameProvApplied.version);
check(sameProvApplied.handoffResolution.resolved===0,'SAME_PROVENANCE_FALSE_RESOLUTION',sameProvApplied.handoffResolution);
check(sameProvApplied.handoffResolution.contested===0,'SAME_PROVENANCE_FALSE_INTERSOURCE_CONTEST',sameProvApplied.handoffResolution);
check(sameProvApplied.handoffResolution.sameProvenanceConflict===2,'SAME_PROVENANCE_CONFLICT_COUNT',sameProvApplied.handoffResolution);
check(sameProvApplied.handoffResolution.rejectedReceipts.filter(x=>x.reasons?.includes('SAME_PROVENANCE_CONFLICT')).length===2,'SAME_PROVENANCE_REJECTIONS_NOT_AUDITED',sameProvApplied.handoffResolution);
check(sameProvBranch?.status==='UNRESOLVED','SAME_PROVENANCE_BRANCH_CLOSED',sameProvBranch);
const independentApplied=globalThis.VajraEngine.applyHandoffResults(base,[sameProvSupport,{...sameProvRefute,provenanceFingerprint:'prov-independent-source-002'}]);
check(independentApplied.handoffResolution.resolved===0,'INDEPENDENT_CONFLICT_FALSE_RESOLUTION',independentApplied.handoffResolution);
check(independentApplied.handoffResolution.contested===1,'INDEPENDENT_CONFLICT_NOT_PRESERVED',independentApplied.handoffResolution);
check(independentApplied.unresolved.find(x=>x.lens==='evidence')?.status==='CONTESTED_BY_RECEIPTS','INDEPENDENT_CONFLICT_BRANCH_NOT_CONTESTED',independentApplied.unresolved);

const scopeContract=base.handoffs.find(x=>x.lens==='scope');
check(Boolean(scopeContract),'SCOPE_CONTRACT_MISSING',base.handoffs);
const genericScope={targetRef:scopeContract.targetRef,clauseRef:scopeContract.clauseRef,lens:'scope',organ:scopeContract.preferredOrgan,status:'EXECUTED',provenanceFingerprint:'prov-scope-generic-001',material:'The returned analysis contains a detailed discussion of the target claim and several observations from the current experiment.',relationToTarget:'This analysis supports the target claim based on the returned observations.'};
const genericScopeApplied=globalThis.VajraEngine.applyHandoffResults(base,[genericScope]);
check(genericScopeApplied.handoffResolution.resolved===0,'GENERIC_SCOPE_FALSE_RESOLUTION',genericScopeApplied.handoffResolution);
check(genericScopeApplied.unresolved.find(x=>x.lens==='scope')?.status==='UNRESOLVED','GENERIC_SCOPE_BRANCH_CLOSED',genericScopeApplied.unresolved);
check(genericScopeApplied.handoffResolution.rejectedReceipts.some(x=>x.reasons?.includes('HANDOFF_RESOLUTION_CRITERION_NOT_EVIDENCED')),'GENERIC_SCOPE_ADEQUACY_REJECTION_MISSING',genericScopeApplied.handoffResolution);
check(genericScopeApplied.handoffResolution.contractAdequacyBlocked===1,'GENERIC_SCOPE_ADEQUACY_COUNT',genericScopeApplied.handoffResolution);
const adequateScope={...genericScope,provenanceFingerprint:'prov-scope-adequate-001',material:'Boundary analysis identifies an explicit exception outside rounds 1–10 and narrows the claim scope to the tested repository-native loop.',relationToTarget:'This explicit boundary supports narrowing the target claim rather than treating it as universal.'};
const adequateScopeApplied=globalThis.VajraEngine.applyHandoffResults(base,[adequateScope]);
check(adequateScopeApplied.handoffResolution.resolved===1,'ADEQUATE_SCOPE_RECEIPT_BLOCKED',adequateScopeApplied.handoffResolution);
check(adequateScopeApplied.unresolved.find(x=>x.lens==='scope')?.status==='RESOLVED_BY_RECEIPT','ADEQUATE_SCOPE_BRANCH_NOT_CLOSED',adequateScopeApplied.unresolved);
const counterContract=base.handoffs.find(x=>x.lens==='counterexample');
check(Boolean(counterContract),'COUNTEREXAMPLE_CONTRACT_MISSING',base.handoffs);
const genericCounter={targetRef:counterContract.targetRef,clauseRef:counterContract.clauseRef,lens:'counterexample',organ:counterContract.preferredOrgan,status:'EXECUTED',provenanceFingerprint:'prov-counter-generic-001',material:'A substantial returned bundle describes the implementation history and several observations about the target.',relationToTarget:'The returned bundle supports the target claim under the current test conditions.'};
const genericCounterApplied=globalThis.VajraEngine.applyHandoffResults(base,[genericCounter]);
check(genericCounterApplied.handoffResolution.resolved===0,'GENERIC_COUNTEREXAMPLE_FALSE_RESOLUTION',genericCounterApplied.handoffResolution);
check(genericCounterApplied.handoffResolution.contractAdequacyBlocked===1,'GENERIC_COUNTEREXAMPLE_ADEQUACY_COUNT',genericCounterApplied.handoffResolution);
const adequateCounter={...genericCounter,provenanceFingerprint:'prov-counter-adequate-001',material:'No counterexample was found inside the explicitly searched scope of the ten active rounds; coverage is bounded and does not extend beyond those rounds.',relationToTarget:'This bounded counterexample search supports only the tested scope and does not establish the claim globally.'};
const adequateCounterApplied=globalThis.VajraEngine.applyHandoffResults(base,[adequateCounter]);
const adequateCounterBranch=adequateCounterApplied.unresolved.find(x=>x.lens==='counterexample');
check(adequateCounterApplied.handoffResolution.resolved===1,'ADEQUATE_COUNTEREXAMPLE_RECEIPT_BLOCKED',adequateCounterApplied.handoffResolution);
check(adequateCounterApplied.handoffResolution.boundedNullAccepted===1,'BOUNDED_NULL_NOT_AUDITED',adequateCounterApplied.handoffResolution);
check(adequateCounterBranch?.resolution?.relationPolarity==='BOUNDED_NULL','BOUNDED_NULL_SEMANTICS_LOST',adequateCounterBranch?.resolution);
check(String(adequateCounterBranch?.resolution?.boundary||'').includes('not support that the target claim is true'),'BOUNDED_NULL_TRUTH_DISCLAIMER_MISSING',adequateCounterBranch?.resolution);

const gut=globalThis.GutEngine.digest({vajra:globalThis.VajraEngine.applyHandoffResults(base,[mixedRelation]),sameProvenance:sameProvApplied,genericScope:genericScopeApplied,boundedNull:adequateCounterApplied},{source:'VAJRA_PROVENANCE_ADEQUACY_GUARD_GUT_REGRESSION',inheritedSubstrates:[target]});
check(!gut.summary.includes(target),'GUT_TARGET_ECHO_AFTER_PROVENANCE_GUARD',gut.summary);
check(gut.ingested>0&&gut.absorbed>=0,'GUT_REGRESSION_FAILED',{ingested:gut.ingested,absorbed:gut.absorbed});
const result={schema:'nostromo-vajra-uncertainty-test/v0.3.8',completedAt:new Date().toISOString(),status:failures.length?'FAIL':'PASS',guards:{explicitUncertaintyCannotClose:true,negatedSupportCannotClose:true,negatedRefuteCannotClose:true,negatedContradictionCannotClose:true,notInconsistentCannotClose:true,failsToSupportCannotClose:true,chineseUncertaintyCannotClose:true,chineseNegatedPolarityCannotClose:true,longUnspecifiedRelationCannotClose:true,mixedPolarityCannotClose:true,positiveSupportStillCloses:true,explicitRefuteStillCloses:true,sameCanonicalProvenanceOppositionCannotResolve:true,sameCanonicalProvenanceOppositionIsNotCountedAsInterSourceContest:true,independentProvenanceOppositionStillContests:true,genericSpecializedReceiptCannotClose:true,lensSpecificScopeReceiptCanClose:true,boundedCounterexampleCoverageCanClose:true,boundedNullDoesNotBecomeTruth:true,gutRegression:true},finding:{classification:'LENS_SPECIFIC_ADEQUACY_WITH_BOUNDED_NULL_SEMANTICS',detail:'v0.3.8 keeps generic specialized receipts from closing VAJRA branches, while distinguishing completion of a bounded counterexample search from certainty about the target claim. A no-counterexample return closes only when it explicitly states bounded scope/coverage and explicitly disclaims proof; the resolution is marked BOUNDED_NULL rather than SUPPORTS.'},crossOrgan:{gut:{ingested:gut.ingested,absorbed:gut.absorbed,quarantined:gut.quarantined,summarySample:gut.summary.slice(0,360)}},failures,boundary:'PASS certifies only bounded lexical/structural anti-false-certainty, provenance-topology, lens-specific adequacy, and BOUNDED_NULL work-contract semantics plus a GUT regression. BOUNDED_NULL is not evidence that a claim is true, and no search completeness beyond the declared scope is certified.'};
await fs.writeFile(path.join(root,'nostromo/integration/vajra-uncertainty-last-result.json'),JSON.stringify(result,null,2)+'\n','utf8');
console.log(JSON.stringify(result,null,2));
if(result.status!=='PASS')process.exitCode=1;