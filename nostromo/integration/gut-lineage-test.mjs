import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';

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
check(sameLineage.version==='0.2.17','GUT_VERSION',sameLineage.version);
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

const result={
  schema:'nostromo-gut-lineage-test/v0.2.17',
  completedAt:new Date().toISOString(),
  status:failures.length===0?'PASS':'FAIL',
  sameLineage:{summaryItemCount:sameLineage.summaryItemCount,antiEcho:sameLineage.antiEcho,summary:sameLineage.summary},
  substantiveDifference:{summaryItemCount:substantiveDifference.summaryItemCount,antiEcho:substantiveDifference.antiEcho,summary:substantiveDifference.summary},
  failures,
  boundary:'PASS proves only that carry-summary diversity ignores volatile hexadecimal ref:/clause: identifiers when the surrounding content is otherwise the same, while preserving original nutrient atoms, provenance, and genuinely different substantive carry. It does not infer semantic equivalence beyond this explicit normalization rule.'
};
await fs.writeFile(path.join(root,'nostromo/integration/gut-lineage-last-result.json'),JSON.stringify(result,null,2)+'\n','utf8');
console.log(JSON.stringify(result,null,2));
if(result.status!=='PASS')process.exitCode=1;
