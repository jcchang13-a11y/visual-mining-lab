import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';

const root=process.cwd();
const resultPath=path.join(root,'nostromo/integration/gut-short-echo-last-result.json');
async function loadScript(rel){const code=await fs.readFile(path.join(root,rel),'utf8');vm.runInThisContext(code,{filename:rel});}
await loadScript('nostromo/gut/gut-engine.js');

const failures=[];
const check=(ok,type,detail)=>{if(!ok)failures.push({type,detail});};

const shortA='以 structure 位置重讀';
const shortB='主動尋找最小反例與破壞條件';
const fixture={carry:`${shortA}：${shortA}：${shortB}：${shortB}：真正的新材料應該保留`};
const out=globalThis.GutEngine.digest(fixture,{source:'NOSTROMO/gut-short-echo-adversarial'});

check(out.version==='0.2.11','VERSION_NOT_0_2_11',out.version);
check(out.antiEcho?.segmentEchoSuppressedCount===2,'SHORT_ADJACENT_ECHO_NOT_SUPPRESSED',out.antiEcho);
check((out.summary.match(/以 structure 位置重讀/g)||[]).length===1,'SHORT_ECHO_A_SURVIVED',out.summary);
check((out.summary.match(/主動尋找最小反例與破壞條件/g)||[]).length===1,'SHORT_ECHO_B_SURVIVED',out.summary);
check(out.summary.includes('真正的新材料應該保留'),'NOVEL_TAIL_LOST',out.summary);
check(out.nutrients.every(x=>x.provenance?.inputSource==='NOSTROMO/gut-short-echo-adversarial'),'PROVENANCE_LOST',out.nutrients);

const nearDuplicate={carry:'以 structure 位置重讀：以 counterexample 位置重讀：第二段雖然很像但不能刪掉'};
const nearOut=globalThis.GutEngine.digest(nearDuplicate,{source:'NOSTROMO/gut-short-echo-near-duplicate'});
check(nearOut.antiEcho?.segmentEchoSuppressedCount===0,'NEAR_DUPLICATE_OVERTRIMMED',nearOut.antiEcho);
check(nearOut.summary.includes('structure')&&nearOut.summary.includes('counterexample'),'NEAR_DUPLICATE_CONTENT_LOST',nearOut.summary);

const result={schema:'nostromo-gut-short-echo-test/v0.2.11',completedAt:new Date().toISOString(),status:failures.length===0?'PASS':'FAIL',fixture:{summary:out.summary,antiEcho:out.antiEcho},nearDuplicate:{summary:nearOut.summary,antiEcho:nearOut.antiEcho},failures,boundary:'PASS proves only conservative exact adjacent colon-delimited suppression for short repeated segments plus preservation of similar-but-not-identical material and provenance. It does not prove semantic novelty detection.'};
await fs.writeFile(resultPath,JSON.stringify(result,null,2)+'\n','utf8');
console.log(JSON.stringify(result,null,2));
if(result.status!=='PASS')process.exitCode=1;
