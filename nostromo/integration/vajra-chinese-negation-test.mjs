import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
const root=process.cwd();
async function load(rel){const code=await fs.readFile(path.join(root,rel),'utf8');vm.runInThisContext(code,{filename:rel});}
await load('nostromo/vajra/vajra-engine.js');
await load('nostromo/vajra/receipt-uncertainty-guard.js');
await load('nostromo/gut/gut-engine.js');
const failures=[];
const check=(ok,type,detail)=>{if(!ok)failures.push({type,detail});};
const target='目前測試資料顯示 GUT 可以隔離重複污染。';
const base=globalThis.VajraEngine.run(target,6);
const contract=base.handoffs.find(x=>x.lens==='evidence');
check(Boolean(contract),'EVIDENCE_CONTRACT_MISSING',base.handoffs);
check(globalThis.VajraEngine.receiptChineseNegationGuardVersion==='0.1','CHINESE_NEGATION_GUARD_VERSION_MISSING',globalThis.VajraEngine.receiptChineseNegationGuardVersion);
const common={targetRef:contract.targetRef,clauseRef:contract.clauseRef,lens:'evidence',organ:contract.preferredOrgan,status:'EXECUTED',material:'此回傳包含具來源標記的測試觀察，並明確說明與目標命題的關係。'};
const adversarial=[
  ['不反駁','目前材料不反駁這個命題，但也沒有形成支持。'],
  ['不反證','目前材料不反證這個命題，仍不足以定案。'],
  ['不否證','目前材料不否證這個命題，不能因此視為成立。'],
  ['不證明','目前材料不證明這個命題，結論保持開放。'],
  ['不印證','目前材料不印證這個命題，仍需其他來源。'],
  ['不吻合','目前材料不吻合這個命題，但這不是反駁證據。'],
  ['不一致','目前材料不一致於這個命題，但不足以判定真假。']
];
const audit=[];
for(let i=0;i<adversarial.length;i++){
  const [label,relation]=adversarial[i];
  const receipt={...common,provenanceFingerprint:`zh-negation-${i+1}`,relationToTarget:relation};
  const applied=globalThis.VajraEngine.applyHandoffResults(base,[receipt]);
  const branch=applied.unresolved.find(x=>x.lens==='evidence');
  const rejected=applied.handoffResolution.rejectedReceipts.find(x=>x.provenance===receipt.provenanceFingerprint);
  check(applied.handoffResolution.resolved===0,`${label}_FALSE_RESOLUTION`,applied.handoffResolution);
  check(branch?.status==='UNRESOLVED',`${label}_BRANCH_CLOSED`,branch);
  check(rejected?.reasons?.includes('INDETERMINATE_RELATION'),`${label}_NEGATION_NOT_AUDITED`,rejected);
  audit.push({label,status:branch?.status,classification:rejected?.relationClassification,reasons:rejected?.reasons||[]});
}
const explicitSupport={...common,provenanceFingerprint:'zh-positive-support',relationToTarget:'此材料支持這個命題，且來源與觀察條件均已標記。'};
const supportApplied=globalThis.VajraEngine.applyHandoffResults(base,[explicitSupport]);
check(supportApplied.handoffResolution.resolved===1,'POSITIVE_SUPPORT_FALSELY_BLOCKED',supportApplied.handoffResolution);
const explicitRefute={...common,provenanceFingerprint:'zh-positive-refute',relationToTarget:'此材料反駁這個命題，並指出相同條件下的失敗觀察。'};
const refuteApplied=globalThis.VajraEngine.applyHandoffResults(base,[explicitRefute]);
check(refuteApplied.handoffResolution.resolved===1,'POSITIVE_REFUTE_FALSELY_BLOCKED',refuteApplied.handoffResolution);
const guarded=globalThis.VajraEngine.applyHandoffResults(base,[{...common,provenanceFingerprint:'zh-gut-regression',relationToTarget:'目前材料不反駁這個命題，但不能形成支持。'}]);
const gut=globalThis.GutEngine.digest({vajra:guarded},{source:'VAJRA_CHINESE_NEGATION_GUT_REGRESSION',inheritedSubstrates:[target]});
check(!gut.summary.includes(target),'GUT_TARGET_ECHO_AFTER_CHINESE_NEGATION_GUARD',gut.summary);
check(gut.ingested>0,'GUT_CROSS_ORGAN_REGRESSION_FAILED',{ingested:gut.ingested,absorbed:gut.absorbed,quarantined:gut.quarantined});
const result={schema:'zenomorph-vajra-chinese-negation-test/v0.1',completedAt:new Date().toISOString(),status:failures.length?'FAIL':'PASS',capability:'BARE_CHINESE_NEGATED_POLARITY_PRESERVES_UNCERTAINTY',finding:{before:'Bare Chinese negation forms such as 不反駁 could fall through the uncertainty guard and be lexically misread by the core polarity detector as directional REFUTES evidence.',after:'The bounded guard now treats bare 不+polarity verbs as indeterminate, preventing those receipts from closing a VAJRA handoff while leaving explicit positive 支持/反駁 receipts eligible.'},audit,crossOrgan:{gut:{ingested:gut.ingested,absorbed:gut.absorbed,quarantined:gut.quarantined,summarySample:gut.summary.slice(0,320)}},provenance:{engine:'nostromo/vajra/vajra-engine.js',guard:'nostromo/vajra/receipt-uncertainty-guard.js',test:'nostromo/integration/vajra-chinese-negation-test.mjs'},failures,boundary:'PASS proves only the listed bounded lexical Chinese negation cases and the tested GUT regression. It does not provide semantic negation understanding, truth adjudication, or complete Chinese grammar coverage.'};
await fs.writeFile(path.join(root,'nostromo/integration/vajra-chinese-negation-last-result.json'),JSON.stringify(result,null,2)+'\n','utf8');
console.log(JSON.stringify(result,null,2));
if(result.status!=='PASS')process.exitCode=1;
