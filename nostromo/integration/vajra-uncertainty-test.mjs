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
check(globalThis.VajraEngine.receiptUncertaintyGuardVersion==='0.3.6','GUARD_VERSION_MISSING',globalThis.VajraEngine.receiptUncertaintyGuardVersion);
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
  check(applied.version==='0.3.6',`${label}_VERSION`,applied.version);
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
check(sameProvApplied.version==='0.3.6','SAME_PROVENANCE_VERSION',sameProvApplied.version);
check(sameProvApplied.handoffResolution.resolved===0,'SAME_PROVENANCE_FALSE_RESOLUTION',sameProvApplied.handoffResolution);
check(sameProvApplied.handoffResolution.contested===0,'SAME_PROVENANCE_FALSE_INTERSOURCE_CONTEST',sameProvApplied.handoffResolution);
check(sameProvApplied.handoffResolution.sameProvenanceConflict===2,'SAME_PROVENANCE_CONFLICT_COUNT',sameProvApplied.handoffResolution);
check(sameProvApplied.handoffResolution.rejectedReceipts.filter(x=>x.reasons?.includes('SAME_PROVENANCE_CONFLICT')).length===2,'SAME_PROVENANCE_REJECTIONS_NOT_AUDITED',sameProvApplied.handoffResolution);
check(sameProvBranch?.status==='UNRESOLVED','SAME_PROVENANCE_BRANCH_CLOSED',sameProvBranch);
const independentApplied=globalThis.VajraEngine.applyHandoffResults(base,[sameProvSupport,{...sameProvRefute,provenanceFingerprint:'prov-independent-source-002'}]);
check(independentApplied.handoffResolution.resolved===0,'INDEPENDENT_CONFLICT_FALSE_RESOLUTION',independentApplied.handoffResolution);
check(independentApplied.handoffResolution.contested===1,'INDEPENDENT_CONFLICT_NOT_PRESERVED',independentApplied.handoffResolution);
check(independentApplied.unresolved.find(x=>x.lens==='evidence')?.status==='CONTESTED_BY_RECEIPTS','INDEPENDENT_CONFLICT_BRANCH_NOT_CONTESTED',independentApplied.unresolved);
const gut=globalThis.GutEngine.digest({vajra:globalThis.VajraEngine.applyHandoffResults(base,[mixedRelation]),sameProvenance:sameProvApplied},{source:'VAJRA_PROVENANCE_GUARD_GUT_REGRESSION',inheritedSubstrates:[target]});
check(!gut.summary.includes(target),'GUT_TARGET_ECHO_AFTER_PROVENANCE_GUARD',gut.summary);
check(gut.ingested>0&&gut.absorbed>=0,'GUT_REGRESSION_FAILED',{ingested:gut.ingested,absorbed:gut.absorbed});
const result={schema:'nostromo-vajra-uncertainty-test/v0.3.6',completedAt:new Date().toISOString(),status:failures.length?'FAIL':'PASS',guards:{explicitUncertaintyCannotClose:true,negatedSupportCannotClose:true,negatedRefuteCannotClose:true,negatedContradictionCannotClose:true,notInconsistentCannotClose:true,failsToSupportCannotClose:true,chineseUncertaintyCannotClose:true,chineseNegatedPolarityCannotClose:true,longUnspecifiedRelationCannotClose:true,mixedPolarityCannotClose:true,positiveSupportStillCloses:true,explicitRefuteStillCloses:true,sameCanonicalProvenanceOppositionCannotResolve:true,sameCanonicalProvenanceOppositionIsNotCountedAsInterSourceContest:true,independentProvenanceOppositionStillContests:true,gutRegression:true},finding:{classification:'SAME_PROVENANCE_OPPOSING_DIRECTION_GUARD_ADDED',detail:'v0.3.6 canonicalizes the caller-supplied provenance identity before branch resolution. Opposing SUPPORTS/REFUTES returns carrying the same canonical provenance are audited as SAME_PROVENANCE_CONFLICT and leave the branch open rather than being treated as independent opposing evidence or resolved by arrival order. Distinct-provenance opposing returns remain CONTESTED_BY_RECEIPTS.'},crossOrgan:{gut:{ingested:gut.ingested,absorbed:gut.absorbed,quarantined:gut.quarantined,summarySample:gut.summary.slice(0,360)}},failures,boundary:'PASS certifies only a bounded lexical/structural anti-false-certainty and provenance-topology guard plus a GUT regression. Provenance identity is caller-supplied metadata, not proof of real-world source independence. The guard prevents one canonical provenance identity from masquerading as independent opposing evidence; it does not semantically judge relevance, evidence quality, truth, or how genuinely independent sources should be weighted.'};
await fs.writeFile(path.join(root,'nostromo/integration/vajra-uncertainty-last-result.json'),JSON.stringify(result,null,2)+'\n','utf8');
console.log(JSON.stringify(result,null,2));
if(result.status!=='PASS')process.exitCode=1;
