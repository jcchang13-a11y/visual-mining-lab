import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
const root=process.cwd();
async function load(rel){const code=await fs.readFile(path.join(root,rel),'utf8');vm.runInThisContext(code,{filename:rel});}
await load('nostromo/vajra/vajra-engine.js');
await load('nostromo/vajra/receipt-uncertainty-guard.js');
await load('nostromo/vajra/modifier-negation-guard.js');
await load('nostromo/gut/gut-engine.js');
const failures=[];
const check=(ok,type,detail)=>{if(!ok)failures.push({type,detail});};
const target='目前測試資料顯示 GUT 可以隔離重複污染。';
const seed=globalThis.VajraEngine.run(target,6);
const contract=seed.handoffs.find(x=>x.lens==='evidence');
check(Boolean(contract),'EVIDENCE_CONTRACT_MISSING',seed.handoffs);
check(globalThis.VajraEngine.receiptChineseModifierNegationGuardVersion==='0.1','MODIFIER_NEGATION_GUARD_VERSION_MISSING',globalThis.VajraEngine.receiptChineseModifierNegationGuardVersion);
const common={targetRef:contract.targetRef,clauseRef:contract.clauseRef,lens:'evidence',organ:contract.preferredOrgan,status:'EXECUTED',material:'此回傳包含具來源標記的測試觀察，並明確說明與目標命題的關係。'};
const adversarial=[
  ['並非支持','這份材料並非支持這個命題，只能保留為待查。'],
  ['并不是反驳','這份材料并不是反驳這個命題，方向仍未確定。'],
  ['稱不上支持','現有觀察稱不上支持這個命題。'],
  ['不能算反駁','這個結果不能算反駁這個命題。'],
  ['難以支持','以目前範圍難以支持這個命題。'],
  ['尚不足以支持','這些結果尚不足以支持這個命題。'],
  ['不算證明','這批材料不算證明這個命題。']
];
const audit=[];
for(let i=0;i<adversarial.length;i++){
  const [label,relation]=adversarial[i];
  const caseBase=globalThis.VajraEngine.run(target,6);
  const receipt={...common,provenanceFingerprint:`zh-mod-neg-${i+1}`,relationToTarget:relation};
  const applied=globalThis.VajraEngine.applyHandoffResults(caseBase,[receipt]);
  const branch=applied.unresolved.find(x=>x.lens==='evidence');
  const rejected=applied.handoffResolution.rejectedReceipts.find(x=>x.provenance===receipt.provenanceFingerprint);
  check(applied.handoffResolution.resolved===0,`${label}_FALSE_RESOLUTION`,applied.handoffResolution);
  check(branch?.status==='UNRESOLVED',`${label}_BRANCH_CLOSED`,branch);
  check(rejected?.reasons?.includes('MODIFIER_WRAPPED_NEGATED_POLARITY'),`${label}_NOT_AUDITED`,rejected);
  check(rejected?.provenance===receipt.provenanceFingerprint,`${label}_PROVENANCE_LOST`,rejected);
  audit.push({label,status:branch?.status,classification:rejected?.relationClassification,reasons:rejected?.reasons||[],provenance:rejected?.provenance});
}
const positiveBase=globalThis.VajraEngine.run(target,6);
const positive={...common,provenanceFingerprint:'zh-mod-positive',relationToTarget:'這份材料支持這個命題，且來源與觀察條件均已標記。'};
const positiveApplied=globalThis.VajraEngine.applyHandoffResults(positiveBase,[positive]);
check(positiveApplied.handoffResolution.resolved===1,'POSITIVE_SUPPORT_FALSELY_BLOCKED',positiveApplied.handoffResolution);
const regressionBase=globalThis.VajraEngine.run(target,6);
const guarded=globalThis.VajraEngine.applyHandoffResults(regressionBase,[{...common,provenanceFingerprint:'zh-mod-gut-regression',relationToTarget:'這份材料並非支持這個命題，只能保持開放。'}]);
const gut=globalThis.GutEngine.digest({vajra:guarded},{source:'VAJRA_MODIFIER_NEGATION_GUT_REGRESSION',inheritedSubstrates:[target]});
check(!gut.summary.includes(target),'GUT_TARGET_ECHO_AFTER_MODIFIER_NEGATION_GUARD',gut.summary);
check(gut.ingested>0,'GUT_CROSS_ORGAN_REGRESSION_FAILED',{ingested:gut.ingested,absorbed:gut.absorbed,quarantined:gut.quarantined});
const result={schema:'zenomorph-vajra-modifier-negation-test/v0.1',completedAt:new Date().toISOString(),status:failures.length?'FAIL':'PASS',capability:'CHINESE_MODIFIER_WRAPPED_NEGATION_PRESERVES_UNCERTAINTY',finding:{before:'Modifier-wrapped Chinese negation could expose embedded direction tokens such as 支持 or 反駁 to lexical polarity detection and create false closure.',after:'The bounded add-on guard treats listed modifier-scoped direction constructions as indeterminate, preserves receipt provenance, leaves the VAJRA branch open, and prevents downstream GUT metabolism from inheriting a fabricated directional closure.'},audit,crossOrgan:{gut:{ingested:gut.ingested,absorbed:gut.absorbed,quarantined:gut.quarantined,summarySample:gut.summary.slice(0,320)}},provenance:{engine:'nostromo/vajra/vajra-engine.js',baseGuard:'nostromo/vajra/receipt-uncertainty-guard.js',modifierGuard:'nostromo/vajra/modifier-negation-guard.js',failureEvidence:'nostromo/failure-log/2026-09-07-vajra-modifier-negation.json',test:'nostromo/integration/vajra-modifier-negation-test.mjs'},failures,boundary:'PASS proves only the listed bounded Chinese modifier-negation forms and the tested GUT regression. It does not provide general semantic negation understanding or truth adjudication.'};
await fs.writeFile(path.join(root,'nostromo/integration/vajra-modifier-negation-last-result.json'),JSON.stringify(result,null,2)+'\n','utf8');
console.log(JSON.stringify(result,null,2));
if(result.status!=='PASS')process.exitCode=1;
