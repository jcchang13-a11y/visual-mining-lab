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
check(sameLineage.version==='0.2.25','GUT_VERSION',sameLineage.version);
check(sameLineage.nutrients.length===2,'SOURCE_NUTRIENTS_LOST',sameLineage.nutrients);
check(sameLineage.nutrients.every(x=>x.provenance?.inputSource===source),'PROVENANCE_LOST',sameLineage.nutrients);
check((sameLineage.antiEcho?.volatileLineageSuppressedCount||0)>=1,'VOLATILE_LINEAGE_NOT_SUPPRESSED',sameLineage.antiEcho);
check((sameLineage.summary.match(/哪個前提最可能先失效/g)||[]).length===1,'PROVENANCE_ONLY_ECHO_SURVIVED',sameLineage.summary);
check(sameLineage.carryRefCount>=4,'OUT_OF_BAND_LINEAGE_REFS_NOT_PRESERVED',sameLineage.carryRefs);
check(sameLineage.carryRefs.every(x=>x.provenance?.inputSource===source),'OUT_OF_BAND_LINEAGE_PROVENANCE_LOST',sameLineage.carryRefs);

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

const shortCjkPhrase='主動尋找最小反例與破壞條件';
const shortCjkNested=globalThis.GutEngine.digest({
  contradiction:`${shortCjkPhrase}：針對本輪 GENERAL 命題，${shortCjkPhrase}並檢查來源獨立性、替代因果與邊界條件`
},{source:`${source}/short-cjk-nested`});
check((shortCjkNested.summary.match(new RegExp(shortCjkPhrase,'g'))||[]).length===1,'SHORT_CJK_NESTED_ECHO_SURVIVED',shortCjkNested.summary);
check((shortCjkNested.nutrients[0]?.text.match(new RegExp(shortCjkPhrase,'g'))||[]).length===2,'SHORT_CJK_SOURCE_NUTRIENT_MUTATED',shortCjkNested.nutrients[0]);
check(shortCjkNested.nutrients[0]?.provenance?.inputSource===`${source}/short-cjk-nested`,'SHORT_CJK_PROVENANCE_LOST',shortCjkNested.nutrients[0]);
check((shortCjkNested.antiEcho?.nestedCarryClauseSuppressedCount||0)>=1,'SHORT_CJK_NESTED_SUPPRESSION_NOT_ACCOUNTED',shortCjkNested.antiEcho);

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

const recursiveCore='主動尋找最小反例與破壞條件：針對本輪 GENERAL 命題（ref:f792180f; clause:9c5ac71），重新檢查來源獨立性、替代因果與邊界條件。這段核心內容刻意保持一致，只讓外層包裝逐輪增加。';
const recursiveWrapperCarry=compactMetabolicCarry([
  `[CONTRADICTION->VAJRA] 以 counterexample 位置重讀：CONTRADICTION_CONDITIONED：${recursiveCore}`,
  `[CONTRADICTION->VAJRA] CONTRADICTION_CONDITIONED：以 counterexample 位置重讀：${recursiveCore}`,
  `[CONTRADICTION->VAJRA] CONTRADICTION_CONDITIONED：CONTRADICTION_CONDITIONED：以 counterexample 位置重讀：${recursiveCore}`,
  '[CONTRADICTION->VAJRA] 新證據顯示時間順序相反，而且來自另一個獨立來源，因此必須保留這條不同的反證材料，不能因為同一路由而消失。'
].join(' · '));
check(recursiveWrapperCarry.crossSegmentNearEchoSuppressed>=2,'RECURSIVE_WRAPPER_ECHO_NOT_SUPPRESSED',recursiveWrapperCarry);
check(recursiveWrapperCarry.outputSegments===2,'RECURSIVE_WRAPPER_OUTPUT_COUNT_UNEXPECTED',recursiveWrapperCarry);
check((recursiveWrapperCarry.text.match(/針對本輪 GENERAL 命題/g)||[]).length===1,'RECURSIVE_WRAPPER_CORE_REPEATED',recursiveWrapperCarry.text);
check(recursiveWrapperCarry.text.includes('新證據顯示時間順序相反'),'RECURSIVE_WRAPPER_DISTINCT_CONTENT_LOST',recursiveWrapperCarry.text);

const lineageOnlyCarry=compactMetabolicCarry([
  '[CONTRADICTION->VAJRA] clause:9c5ac71',
  'clause:9c5ac71',
  'clause:9c5ac71',
  'ref:f792180f',
  '[EVIDENCE_OR_PROVENANCE->MUTHER] ref:f792180f',
  '[QUESTION->SHROOMING] 這是一條實質問題，必須保留而不能被 provenance token 去重邏輯吞掉。'
].join(' · '));
check(lineageOnlyCarry.lineageOnlySuppressed>=3,'LINEAGE_ONLY_TOKEN_ECHO_NOT_SUPPRESSED',lineageOnlyCarry);
check((lineageOnlyCarry.text.match(/clause[:：]9c5ac71/g)||[]).length===1,'CLAUSE_TOKEN_REPEATED',lineageOnlyCarry.text);
check((lineageOnlyCarry.text.match(/ref[:：]f792180f/g)||[]).length===1,'REF_TOKEN_REPEATED',lineageOnlyCarry.text);
check(lineageOnlyCarry.text.includes('這是一條實質問題'),'LINEAGE_ONLY_DISTINCT_CONTENT_LOST',lineageOnlyCarry.text);

const observedReplay=compactMetabolicCarry([
  '[CONTRADICTION->VAJRA] 以 counterexample 位置重讀：CONTRADICTION_CONDITIONED：主動尋找最小反例與破壞條件：針對本輪 GENERAL 命題（ref:f792180f; clause:9c5ac71），哪個前提最可能先失效？：VERIFIES AN EXPLICIT URL ONLY',
  '[CONTRADICTION->VAJRA] clause:9c5ac71',
  'clause:9c5ac71f',
  '[CLAIM->DROPLET] VERIFIES AN EXPLICIT URL ONLY; DOES NOT CLAIM SEARCH-ENGINE DISCOVERY',
  '[QUESTION->SHROOMING] 這是一條不同的未解問題，應該保留並進入下一輪閱讀。'
].join(' · '));
check(!/(?:^|[：·\s])(?:clause|ref)\s*(?:：|:)\s*[0-9a-f]{6,64}(?:$|[：·\s])/i.test(observedReplay.text.replace(/（ref:[^）]+）/g,'')),'OBSERVED_STANDALONE_LINEAGE_FRAGMENT_SURVIVED',observedReplay.text);
check(observedReplay.text.includes('VERIFIES AN EXPLICIT URL ONLY'),'OBSERVED_REPLAY_SUBSTANTIVE_MATERIAL_LOST',observedReplay.text);
check(observedReplay.text.includes('這是一條不同的未解問題'),'OBSERVED_REPLAY_DISTINCT_QUESTION_LOST',observedReplay.text);
check((observedReplay.lineageOnlySuppressed||0)>=1,'OBSERVED_REPLAY_LINEAGE_SUPPRESSION_NOT_ACCOUNTED',observedReplay);

const scaffoldCarry=compactMetabolicCarry([
  '[CONTRADICTION->VAJRA] CONTRADICTION：false：以 evidence 位置重讀：主動尋找最小反例與破壞條件',
  '[CLAIM->DROPLET] true',
  '[QUESTION->SHROOMING] false-positive 是一個完整語義片語，不能因為包含布林字樣就被刪掉。',
  '[EVIDENCE_OR_PROVENANCE->MUTHER] 200'
].join(' · '));
check(!/(?:^|[：·\s])(?:true|false|null|undefined)(?:$|[：·\s])/i.test(scaffoldCarry.text),'CARRY_SCAFFOLD_SCALAR_SURVIVED',scaffoldCarry.text);
check((scaffoldCarry.scaffoldScalarSuppressed||0)>=2,'CARRY_SCAFFOLD_SCALAR_NOT_ACCOUNTED',scaffoldCarry);
check(scaffoldCarry.text.includes('false-positive 是一個完整語義片語'),'SUBSTANTIVE_FALSE_PHRASE_OVERTRIMMED',scaffoldCarry.text);
check(scaffoldCarry.text.includes('200'),'NUMERIC_SCALAR_OVERTRIMMED',scaffoldCarry.text);
check(scaffoldCarry.text.includes('主動尋找最小反例與破壞條件'),'SCAFFOLD_CONTROL_SUBSTANTIVE_CLAUSE_LOST',scaffoldCarry.text);

const delimiterCollisionSource='第一個反例要求保留來源脈絡 · [QUESTION->SHROOMING] 這段其實只是同一個 nutrient 內的文字，不是新的 top-level carry item · clause:9c5ac71';
const delimiterCollision=globalThis.GutEngine.digest({
  contradiction:delimiterCollisionSource
},{source:`${source}/delimiter-collision`});
check((delimiterCollision.antiEcho?.carryDelimiterNeutralizedCount||0)===2,'CARRY_DELIMITER_COLLISION_NOT_ACCOUNTED',delimiterCollision.antiEcho);
check(!delimiterCollision.summary.includes(' · '),'CARRY_DELIMITER_COLLISION_SURVIVED_SINGLE_ITEM_SUMMARY',delimiterCollision.summary);
check((delimiterCollision.summary.match(/ ∙ /g)||[]).length===2,'CARRY_DELIMITER_COLLISION_RENDER_UNEXPECTED',delimiterCollision.summary);
check((delimiterCollision.nutrients[0]?.text.match(/·/g)||[]).length===2,'CARRY_DELIMITER_SOURCE_NUTRIENT_MUTATED',delimiterCollision.nutrients[0]);
check(delimiterCollision.nutrients[0]?.provenance?.inputSource===`${source}/delimiter-collision`,'CARRY_DELIMITER_PROVENANCE_LOST',delimiterCollision.nutrients[0]);
const delimiterCarry=compactMetabolicCarry(delimiterCollision.summary);
check(delimiterCarry.inputSegments===1&&delimiterCarry.outputSegments===1,'CARRY_DELIMITER_CREATED_PSEUDO_SEGMENTS',delimiterCarry);
check(delimiterCarry.text.includes(' ∙ '),'CARRY_DELIMITER_READABLE_SEPARATOR_LOST',delimiterCarry.text);

const result={
  schema:'nostromo-gut-lineage-test/v0.2.25-carry-scalar-guard',
  completedAt:new Date().toISOString(),
  status:failures.length===0?'PASS':'FAIL',
  sameLineage:{summaryItemCount:sameLineage.summaryItemCount,antiEcho:sameLineage.antiEcho,summary:sameLineage.summary,carryRefs:sameLineage.carryRefs},
  substantiveDifference:{summaryItemCount:substantiveDifference.summaryItemCount,antiEcho:substantiveDifference.antiEcho,summary:substantiveDifference.summary},
  intraAtom:{antiEcho:intraAtom.antiEcho,summary:intraAtom.summary,sourceNutrient:intraAtom.nutrients[0]?.text||null},
  shortCjkNested:{antiEcho:shortCjkNested.antiEcho,summary:shortCjkNested.summary,sourceNutrient:shortCjkNested.nutrients[0]?.text||null},
  lineageSignature:{antiEcho:signatureEcho.antiEcho,summary:signatureEcho.summary,sourceNutrient:signatureEcho.nutrients[0]?.text||null},
  crossSegmentNearEcho:nearDuplicateCarry,
  recursiveWrapperCarry,
  lineageOnlyCarry,
  observedReplay,
  scaffoldCarry,
  delimiterCollision:{summary:delimiterCollision.summary,sourceNutrient:delimiterCollision.nutrients[0]?.text||null,antiEcho:delimiterCollision.antiEcho,carry:delimiterCarry},
  failures,
  boundary:'This adversarial test preserves source nutrients and provenance while checking cross-atom, intra-atom, short-CJK nested-clause, repeated machine-lineage signature, cross-segment volatile-lineage carry echo, recursive wrapper growth, repeated short ref/clause-only carry fragments, a replay derived from the previously observed malformed carry, bare boolean/null carry scaffold leakage, and top-level middle-dot delimiter collision inside a single nutrient. Bare true/false/null/undefined tokens may be removed only from carry rendering; numeric scalars and substantive phrases containing those words remain. v0.2.25 requires machine hexadecimal lineage identifiers to remain available through the bounded out-of-band carryRefs ledger with provenance while prose summary remains eligible for anti-echo cleanup. PASS does not certify semantic identity or truth.'
};
await fs.writeFile(path.join(root,'nostromo/integration/gut-lineage-last-result.json'),JSON.stringify(result,null,2)+'\n','utf8');
console.log(JSON.stringify(result,null,2));
if(result.status!=='PASS')process.exitCode=1;
