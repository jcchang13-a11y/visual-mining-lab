import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import {compactMetabolicCarry} from './active-orchestrator.mjs';

const root=process.cwd();
const code=await fs.readFile(path.join(root,'nostromo/gut/gut-engine.js'),'utf8');
vm.runInThisContext(code,{filename:'nostromo/gut/gut-engine.js'});

const failures=[];
const check=(ok,type,detail)=>{if(!ok)failures.push({type,detail});};
const source='NOSTROMO/gut-lineage-adversarial-test';
const template=(ref,clause,tail='哪個前提最可能先失效？')=>`以 structure 位置重讀：主動尋找最小反例與破壞條件：針對本輪 UNIVERSAL+EMPIRICAL 命題（ref:${ref}; clause:${clause}），${tail}這段故意拉長，模擬跨輪 carry 只有 volatile provenance token 改變、其餘代謝內容完全相同的情況。`;

const sameLineage=globalThis.GutEngine.digest({
  contradictionA:template('abcdef12','12345678'),
  contradictionB:template('fedcba98','87654321')
},{source});
check(sameLineage.version==='0.2.19','GUT_VERSION',sameLineage.version);
check(sameLineage.nutrients.length===2,'SOURCE_NUTRIENTS_LOST',sameLineage.nutrients);
check(sameLineage.nutrients.every(x=>x.provenance?.inputSource===source),'PROVENANCE_LOST',sameLineage.nutrients);
check((sameLineage.antiEcho?.volatileLineageSuppressedCount||0)>=1,'VOLATILE_LINEAGE_NOT_SUPPRESSED',sameLineage.antiEcho);
check((sameLineage.summary.match(/哪個前提最可能先失效/g)||[]).length===1,'PROVENANCE_ONLY_ECHO_SURVIVED',sameLineage.summary);

const substantiveDifference=globalThis.GutEngine.digest({
  contradictionA:template('aaaaaa11','bbbbbb22','哪個前提最可能先失效？'),
  contradictionB:template('cccccc33','dddddd44','哪一份證據最需要重新驗證？')
},{source:`${source}/control`});
check(substantiveDifference.summaryItemCount===2,'SUBSTANTIVE_DIFFERENCE_OVERTRIMMED',substantiveDifference.summary);
check(substantiveDifference.summary.includes('哪個前提最可能先失效')&&substantiveDifference.summary.includes('哪一份證據最需要重新驗證'),'DISTINCT_CONTENT_LOST',substantiveDifference.summary);

const intraAtomA=template('111111aa','222222bb');
const intraAtomB=template('333333cc','444444dd');
const intraAtomDistinct=template('555555ee','666666ff','哪一份證據最需要重新驗證？');
const intraAtom=globalThis.GutEngine.digest({
  contradiction:`${intraAtomA}：中間保留不同觀察：${intraAtomB}：${intraAtomDistinct}`
},{source:`${source}/intra-atom`});
check((intraAtom.summary.match(/哪個前提最可能先失效/g)||[]).length===1,'INTRA_ATOM_VOLATILE_LINEAGE_ECHO_SURVIVED',intraAtom.summary);
check(intraAtom.summary.includes('中間保留不同觀察'),'INTRA_ATOM_DISTINCT_MIDDLE_LOST',intraAtom.summary);
check(intraAtom.summary.includes('哪一份證據最需要重新驗證'),'INTRA_ATOM_SUBSTANTIVE_DIFFERENCE_LOST',intraAtom.summary);
check((intraAtom.nutrients[0]?.text.match(/哪個前提最可能先失效/g)||[]).length===2,'INTRA_ATOM_SOURCE_NUTRIENT_MUTATED',intraAtom.nutrients[0]);
check(intraAtom.nutrients[0]?.provenance?.inputSource===`${source}/intra-atom`,'INTRA_ATOM_PROVENANCE_LOST',intraAtom.nutrients[0]);
check((intraAtom.antiEcho?.volatileLineageClauseSuppressedCount||0)>=1,'INTRA_ATOM_VOLATILE_LINEAGE_NOT_ACCOUNTED',intraAtom.antiEcho);

const signatureEcho=globalThis.GutEngine.digest({
  contradiction:'CONTRADICTION_CONDITIONED：第一個反例要求重新檢查來源獨立性與測量時間：CONTRADICTION_CONDITIONED：第二個反例要求重新檢查替代因果與邊界條件'
},{source:`${source}/signature-echo`});
check((signatureEcho.summary.match(/CONTRADICTION_CONDITIONED/g)||[]).length===1,'LINEAGE_SIGNATURE_ECHO_SURVIVED',signatureEcho.summary);
check(signatureEcho.summary.includes('第一個反例要求重新檢查來源獨立性與測量時間')&&signatureEcho.summary.includes('第二個反例要求重新檢查替代因果與邊界條件'),'LINEAGE_SIGNATURE_DISTINCT_PROSE_LOST',signatureEcho.summary);
check((signatureEcho.nutrients[0]?.text.match(/CONTRADICTION_CONDITIONED/g)||[]).length===2,'LINEAGE_SIGNATURE_SOURCE_NUTRIENT_MUTATED',signatureEcho.nutrients[0]);
check(signatureEcho.nutrients[0]?.provenance?.inputSource===`${source}/signature-echo`,'LINEAGE_SIGNATURE_PROVENANCE_LOST',signatureEcho.nutrients[0]);
check((signatureEcho.antiEcho?.lineageSignatureSuppressedCount||0)>=1,'LINEAGE_SIGNATURE_SUPPRESSION_NOT_ACCOUNTED',signatureEcho.antiEcho);

const sharedCore='主動尋找最小反例與破壞條件：針對本輪 GENERAL 命題（ref:abcdef12; clause:12345678），哪個前提最可能先失效？這段故意拉長，模擬同一路由在相鄰器官輸出中只增加一層包裝但核心內容沒有改變。';
const nearDuplicateCarry=compactMetabolicCarry([
  `[CONTRADICTION->VAJRA] 以 counterexample 位置重讀：CONTRADICTION_CONDITIONED：${sharedCore}`,
  `[CONTRADICTION->VAJRA] CONTRADICTION_CONDITIONED：以 counterexample 位置重讀：${sharedCore.replace('abcdef12','fedcba98').replace('12345678','87654321')}`,
  '[CONTRADICTION->VAJRA] 另一份證據直接否定時間順序，因此需要重新檢查測量有效性、來源獨立性與替代因果。這是一條實質不同的反證材料，不能因為同一路由就被壓掉。'
].join(' · '));
check(nearDuplicateCarry.crossSegmentNearEchoSuppressed>=1,'CROSS_SEGMENT_NEAR_ECHO_NOT_SUPPRESSED',nearDuplicateCarry);
check(nearDuplicateCarry.outputSegments===2,'CROSS_SEGMENT_OUTPUT_COUNT_UNEXPECTED',nearDuplicateCarry);
check(nearDuplicateCarry.text.includes('另一份證據直接否定時間順序'),'CROSS_SEGMENT_DISTINCT_CONTENT_LOST',nearDuplicateCarry.text);

const result={
  schema:'nostromo-gut-lineage-test/v0.2.19-adversarial-lineage-signature',
  completedAt:new Date().toISOString(),
  status:failures.length===0?'PASS':'FAIL',
  sameLineage:{summaryItemCount:sameLineage.summaryItemCount,antiEcho:sameLineage.antiEcho,summary:sameLineage.summary},
  substantiveDifference:{summaryItemCount:substantiveDifference.summaryItemCount,antiEcho:substantiveDifference.antiEcho,summary:substantiveDifference.summary},
  intraAtom:{antiEcho:intraAtom.antiEcho,summary:intraAtom.summary,sourceNutrient:intraAtom.nutrients[0]?.text||null},
  lineageSignature:{antiEcho:signatureEcho.antiEcho,summary:signatureEcho.summary,sourceNutrient:signatureEcho.nutrients[0]?.text||null},
  crossSegmentNearEcho:nearDuplicateCarry,
  failures,
  boundary:'This adversarial test preserves source nutrients and provenance while checking cross-atom, intra-atom, repeated machine-lineage signature, and cross-segment volatile-lineage carry echo. PASS requires repeated standalone lineage signatures to collapse only at carry rendering, same-route near-duplicate recirculation segments to collapse, and substantively distinct prose to survive.'
};
await fs.writeFile(path.join(root,'nostromo/integration/gut-lineage-last-result.json'),JSON.stringify(result,null,2)+'\n','utf8');
console.log(JSON.stringify(result,null,2));
if(result.status!=='PASS')process.exitCode=1;
