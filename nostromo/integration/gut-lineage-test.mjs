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

// New adversarial case: the same provenance-only lineage can recur inside one carry atom.
// Cross-atom diversity already suppresses it, but intra-atom carry compaction must do the same
// without mutating the nutrient atom or deleting a genuinely different middle clause.
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

const result={
  schema:'nostromo-gut-lineage-test/v0.2.17-adversarial-intra-atom',
  completedAt:new Date().toISOString(),
  status:failures.length===0?'PASS':'FAIL',
  sameLineage:{summaryItemCount:sameLineage.summaryItemCount,antiEcho:sameLineage.antiEcho,summary:sameLineage.summary},
  substantiveDifference:{summaryItemCount:substantiveDifference.summaryItemCount,antiEcho:substantiveDifference.antiEcho,summary:substantiveDifference.summary},
  intraAtom:{antiEcho:intraAtom.antiEcho,summary:intraAtom.summary,sourceNutrient:intraAtom.nutrients[0]?.text||null},
  failures,
  boundary:'This adversarial test preserves source nutrients and provenance while checking both cross-atom and intra-atom volatile-lineage carry echo. A FAIL on INTRA_ATOM_VOLATILE_LINEAGE_ECHO_SURVIVED is evidence of a rendering-layer metabolic echo defect, not a source-data corruption claim.'
};
await fs.writeFile(path.join(root,'nostromo/integration/gut-lineage-last-result.json'),JSON.stringify(result,null,2)+'\n','utf8');
console.log(JSON.stringify(result,null,2));
if(result.status!=='PASS')process.exitCode=1;
