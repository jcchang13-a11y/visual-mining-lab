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
check(globalThis.VajraEngine.receiptUncertaintyGuardVersion==='0.3.2','GUARD_VERSION_MISSING',globalThis.VajraEngine.receiptUncertaintyGuardVersion);
const common={targetRef:contract.targetRef,clauseRef:contract.clauseRef,lens:'evidence',organ:contract.preferredOrgan,status:'EXECUTED',material:'The searched evidence bundle contains multiple traceable observations and preserves source provenance.'};
const insufficient={...common,provenanceFingerprint:'prov-uncertain-001',relationToTarget:'The available evidence is insufficient and does not support a conclusion about the target claim.'};
const negatedRefute={...common,provenanceFingerprint:'prov-uncertain-002',relationToTarget:'The evidence does not refute the target claim, but remains insufficient to support it.'};
const zhUncertain={...common,provenanceFingerprint:'prov-uncertain-003',relationToTarget:'目前證據不足以支持或反駁這個命題，無法判定。'};
for(const [label,receipt] of [['INSUFFICIENT',insufficient],['NEGATED_REFUTE',negatedRefute],['ZH_UNCERTAIN',zhUncertain]]){
  const applied=globalThis.VajraEngine.applyHandoffResults(base,[receipt]);
  check(applied.version==='0.3.2',`${label}_VERSION`,applied.version);
  check(applied.handoffResolution.resolved===0,`${label}_FALSE_RESOLUTION`,applied.handoffResolution);
  check(applied.unresolved.find(x=>x.lens==='evidence')?.status==='UNRESOLVED',`${label}_BRANCH_CLOSED`,applied.unresolved);
  check(applied.handoffResolution.rejectedReceipts.some(x=>x.reasons?.includes('INDETERMINATE_RELATION')),`${label}_REJECTION_NOT_AUDITED`,applied.handoffResolution);
  check(applied.handoffResolution.indeterminate===1,`${label}_INDETERMINATE_COUNT`,applied.handoffResolution);
}
const supportive={...common,provenanceFingerprint:'prov-support-001',relationToTarget:'The returned evidence supports the target claim within the explicitly searched scope.'};
const supportApplied=globalThis.VajraEngine.applyHandoffResults(base,[supportive]);
check(supportApplied.handoffResolution.resolved===1,'SUPPORTIVE_RECEIPT_BLOCKED',supportApplied.handoffResolution);
check(supportApplied.unresolved.find(x=>x.lens==='evidence')?.status==='RESOLVED_BY_RECEIPT','SUPPORTIVE_BRANCH_NOT_CLOSED',supportApplied.unresolved);
const gut=globalThis.GutEngine.digest({vajra:globalThis.VajraEngine.applyHandoffResults(base,[insufficient])},{source:'VAJRA_UNCERTAINTY_GUT_REGRESSION',inheritedSubstrates:[target]});
check(!gut.summary.includes(target),'GUT_TARGET_ECHO_AFTER_UNCERTAINTY_GUARD',gut.summary);
check(gut.ingested>0&&gut.absorbed>=0,'GUT_REGRESSION_FAILED',{ingested:gut.ingested,absorbed:gut.absorbed});
const result={schema:'nostromo-vajra-uncertainty-test/v0.3.2',completedAt:new Date().toISOString(),status:failures.length?'FAIL':'PASS',guards:{explicitUncertaintyCannotClose:true,negatedSupportCannotClose:true,negatedRefuteCannotClose:true,chineseUncertaintyCannotClose:true,positiveSupportStillCloses:true,gutRegression:true},finding:{classification:'FALSE_CERTAINTY_GUARD_ADDED',detail:'Before this guard, a long structurally valid receipt could close a VAJRA handoff even when its relation explicitly said the evidence was insufficient or did not support/refute a conclusion. v0.3.2 preserves such returns as audited INDETERMINATE_RELATION rejections and leaves the branch open.'},crossOrgan:{gut:{ingested:gut.ingested,absorbed:gut.absorbed,quarantined:gut.quarantined,summarySample:gut.summary.slice(0,360)}},failures,boundary:'PASS certifies only a bounded lexical anti-false-certainty guard over handoff receipt relations. It does not semantically judge relevance, evidence quality, truth, or whether an uncertain source should outweigh a supporting source.'};
await fs.writeFile(path.join(root,'nostromo/integration/vajra-uncertainty-last-result.json'),JSON.stringify(result,null,2)+'\n','utf8');
console.log(JSON.stringify(result,null,2));
if(result.status!=='PASS')process.exitCode=1;
