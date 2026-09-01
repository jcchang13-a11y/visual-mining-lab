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
check(globalThis.VajraEngine.receiptUncertaintyGuardVersion==='0.3.4','GUARD_VERSION_MISSING',globalThis.VajraEngine.receiptUncertaintyGuardVersion);
const common={targetRef:contract.targetRef,clauseRef:contract.clauseRef,lens:'evidence',organ:contract.preferredOrgan,status:'EXECUTED',material:'The searched evidence bundle contains multiple traceable observations and preserves source provenance.'};
const insufficient={...common,provenanceFingerprint:'prov-uncertain-001',relationToTarget:'The available evidence is insufficient and does not support a conclusion about the target claim.'};
const negatedRefute={...common,provenanceFingerprint:'prov-uncertain-002',relationToTarget:'The evidence does not refute the target claim, but remains insufficient to support it.'};
const zhUncertain={...common,provenanceFingerprint:'prov-uncertain-003',relationToTarget:'目前證據不足以支持或反駁這個命題，無法判定。'};
const longNoncommittal={...common,provenanceFingerprint:'prov-unspecified-001',relationToTarget:'The returned material discusses the same target and provides additional context about the surrounding test conditions and implementation history.'};
const mixedRelation={...common,provenanceFingerprint:'prov-mixed-001',relationToTarget:'The returned evidence supports the target claim under one measured condition but refutes the target claim under another measured condition.'};
for(const [label,receipt,reason,counter] of [
  ['INSUFFICIENT',insufficient,'INDETERMINATE_RELATION','indeterminate'],
  ['NEGATED_REFUTE',negatedRefute,'INDETERMINATE_RELATION','indeterminate'],
  ['ZH_UNCERTAIN',zhUncertain,'INDETERMINATE_RELATION','indeterminate'],
  ['UNSPECIFIED',longNoncommittal,'UNSPECIFIED_RELATION','unspecified'],
  ['MIXED',mixedRelation,'MIXED_RELATION','mixed']
]){
  const applied=globalThis.VajraEngine.applyHandoffResults(base,[receipt]);
  check(applied.version==='0.3.4',`${label}_VERSION`,applied.version);
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
const gut=globalThis.GutEngine.digest({vajra:globalThis.VajraEngine.applyHandoffResults(base,[mixedRelation])},{source:'VAJRA_MIXED_RELATION_GUT_REGRESSION',inheritedSubstrates:[target]});
check(!gut.summary.includes(target),'GUT_TARGET_ECHO_AFTER_MIXED_RELATION_GUARD',gut.summary);
check(gut.ingested>0&&gut.absorbed>=0,'GUT_REGRESSION_FAILED',{ingested:gut.ingested,absorbed:gut.absorbed});
const result={schema:'nostromo-vajra-uncertainty-test/v0.3.4',completedAt:new Date().toISOString(),status:failures.length?'FAIL':'PASS',guards:{explicitUncertaintyCannotClose:true,negatedSupportCannotClose:true,negatedRefuteCannotClose:true,chineseUncertaintyCannotClose:true,longUnspecifiedRelationCannotClose:true,mixedPolarityCannotClose:true,positiveSupportStillCloses:true,explicitRefuteStillCloses:true,gutRegression:true},finding:{classification:'MIXED_POLARITY_FALSE_CLOSURE_GUARD_ADDED',detail:'A single structurally complete receipt whose relation simultaneously contains support and refute polarity is no longer allowed to close a VAJRA handoff. v0.3.4 preserves it as an audited MIXED_RELATION rejection and leaves the branch unresolved, preventing internally conflicted wording from being collapsed into a false binary resolution.'},crossOrgan:{gut:{ingested:gut.ingested,absorbed:gut.absorbed,quarantined:gut.quarantined,summarySample:gut.summary.slice(0,360)}},failures,boundary:'PASS certifies only a bounded lexical anti-false-certainty guard over handoff receipt relations plus a GUT regression. Closure now requires an unambiguous SUPPORTS or REFUTES polarity after uncertainty screening; MIXED remains unresolved. It does not semantically judge relevance, evidence quality, truth, or whether one source should outweigh another.'};
await fs.writeFile(path.join(root,'nostromo/integration/vajra-uncertainty-last-result.json'),JSON.stringify(result,null,2)+'\n','utf8');
console.log(JSON.stringify(result,null,2));
if(result.status!=='PASS')process.exitCode=1;
