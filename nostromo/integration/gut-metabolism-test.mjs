import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import {runActiveExecutorLoop} from './active-orchestrator.mjs';

const root=process.cwd();
async function loadScript(rel){const code=await fs.readFile(path.join(root,rel),'utf8');vm.runInThisContext(code,{filename:rel});}
await loadScript('nostromo/gut/gut-engine.js');
await loadScript('nostromo/vajra/vajra-engine.js');

const failures=[];
const check=(ok,type,detail)=>{if(!ok)failures.push({type,detail});};

// Unit routing + provenance + failure handling.
const sample={
  claim:'Claim: all five organs are already semantically mature.',
  question:'What evidence would change this conclusion?',
  evidence:{source:'test-fixture',finding:'Evidence: current GUT began as a shallow router.'},
  contradiction:'Counterevidence: shallow routing contradicts the maturity claim.',
  uncertainty:'INDETERMINATE: semantic maturity is not yet measured.',
  failure:{status:'FAILED',error:'synthetic failure marker'},
  duplicateA:'same useful material',duplicateB:'same useful material'
};
const gut=globalThis.GutEngine.digest(sample,{source:'NOSTROMO/gut-metabolism-test'});
check(gut.version==='0.2.11','GUT_VERSION',gut.version);
check(gut.mode==='DETERMINISTIC_HEURISTIC_ROUTER','GUT_MODE',gut.mode);
check(gut.routes?.DROPLET?.count>=1,'CLAIM_NOT_ROUTED_TO_DROPLET',gut.routes?.DROPLET);
check(gut.routes?.SHROOMING?.count>=1,'QUESTION_NOT_ROUTED_TO_SHROOMING',gut.routes?.SHROOMING);
check(gut.routes?.VAJRA?.count>=1,'CONTRADICTION_NOT_ROUTED_TO_VAJRA',gut.routes?.VAJRA);
check(gut.routes?.MUTHER?.count>=1,'EVIDENCE_NOT_ROUTED_TO_MUTHER',gut.routes?.MUTHER);
check(gut.quarantined>=1,'FAILURE_NOT_QUARANTINED',gut.quarantine);
check(gut.excreted>=1,'DUPLICATE_NOT_EXCRETED',gut.waste);
check(gut.held>=1,'UNCERTAINTY_NOT_HELD',gut.hold);
check(gut.nutrients.every(x=>x.provenance?.inputSource==='NOSTROMO/gut-metabolism-test'),'PROVENANCE_LOST',gut.nutrients);

// Exact inherited material should disappear, but a truncated prefix must not be destructively removed.
const inherited='This inherited substrate is deliberately long enough to be recognized as prior-round material and must not be counted as novelty.';
const inheritedGut=globalThis.GutEngine.digest({reaction:`new observation before ${inherited} new observation after`},{source:'NOSTROMO/gut-inherited-test',inheritedSubstrates:[inherited]});
check(inheritedGut.antiEcho?.inheritedSubstrateStrippedCount>=1,'INHERITED_NOT_STRIPPED',inheritedGut.antiEcho);
check(!inheritedGut.summary.includes(inherited),'INHERITED_SURVIVED',inheritedGut.summary);
check(inheritedGut.summary.includes('new observation before')&&inheritedGut.summary.includes('new observation after'),'NOVEL_WRAPPER_LOST',inheritedGut.summary);
const longInherited='CLAIM SEARCH-ENGINE DISCOVERY connector evidence payload '.repeat(8).trim();
const partial=longInherited.slice(0,180);
const partialGut=globalThis.GutEngine.digest({reaction:`novel-prefix ${partial} novel-suffix`},{source:'NOSTROMO/gut-partial-test',inheritedSubstrates:[longInherited]});
check(partialGut.antiEcho?.inheritedSubstrateStrippedCount===0,'TRUNCATED_SUBSTRATE_STRIPPED',partialGut.antiEcho);
check(partialGut.summary.includes('novel-prefix')&&partialGut.summary.includes('novel-suffix'),'TRUNCATED_SUBSTRATE_CORRUPTED_WRAPPER',partialGut.summary);

// Adversarial nested / intra-atom echo: long and short exact repetitions collapse; near-duplicates survive.
const nested='[CONTRADICTION->VAJRA] Counterevidence: recursive carry repeats itself：[CONTRADICTION->VAJRA] Counterevidence: recursive carry repeats itself：[CONTRADICTION->VAJRA] Counterevidence: recursive carry repeats itself';
const nestedGut=globalThis.GutEngine.digest({carry:nested},{source:'NOSTROMO/gut-nested-test'});
check(nestedGut.antiEcho?.nestedEchoSuppressedCount>=2,'NESTED_TAGGED_ECHO_NOT_SUPPRESSED',nestedGut.antiEcho);
check(!nestedGut.nutrients.some(x=>/\[[A-Z_]+->[A-Z/]+\]/.test(x.text)),'ROUTE_METADATA_SURVIVED',nestedGut.nutrients);
const shortA='以 structure 位置重讀';
const shortB='主動尋找最小反例與破壞條件';
const shortGut=globalThis.GutEngine.digest({carry:`${shortA}：${shortA}：${shortB}：${shortB}：真正的新材料應該保留`},{source:'NOSTROMO/gut-short-echo-test'});
check(shortGut.antiEcho?.segmentEchoSuppressedCount===2,'SHORT_ADJACENT_ECHO_NOT_SUPPRESSED',shortGut.antiEcho);
check((shortGut.summary.match(/以 structure 位置重讀/g)||[]).length===1,'SHORT_ECHO_A_SURVIVED',shortGut.summary);
check((shortGut.summary.match(/主動尋找最小反例與破壞條件/g)||[]).length===1,'SHORT_ECHO_B_SURVIVED',shortGut.summary);
check(shortGut.summary.includes('真正的新材料應該保留'),'SHORT_ECHO_REMOVED_NOVEL_TAIL',shortGut.summary);
const nearGut=globalThis.GutEngine.digest({carry:'以 structure 位置重讀：以 counterexample 位置重讀：第二段雖然很像但不能刪掉'},{source:'NOSTROMO/gut-near-duplicate-test'});
check(nearGut.antiEcho?.segmentEchoSuppressedCount===0,'NEAR_DUPLICATE_OVERTRIMMED',nearGut.antiEcho);
check(nearGut.summary.includes('structure')&&nearGut.summary.includes('counterexample'),'NEAR_DUPLICATE_CONTENT_LOST',nearGut.summary);

// Structured engineering snippets must not become fake semantic contradictions.
const structured='{"version":"2.3","round":"R113","task":"conflicting tasks and partial memory","continuity":"history preserved"}';
const structuredGut=globalThis.GutEngine.digest({snippet:structured},{source:'NOSTROMO/gut-structured-test'});
check(structuredGut.typeCounts?.RAW_STRUCTURED_SNIPPET===1,'STRUCTURED_SNIPPET_NOT_CLASSIFIED',structuredGut.typeCounts);
check((structuredGut.typeCounts?.CONTRADICTION||0)===0,'STRUCTURED_FALSE_CONTRADICTION',structuredGut.typeCounts);
check(structuredGut.routes?.MUTHER?.count===1,'STRUCTURED_NOT_ROUTED_TO_MUTHER',structuredGut.routes);

// Cross-organ regression: connector feedback must alter round input while GUT continues to digest and de-echo.
let active=null;
try{
  active=await runActiveExecutorLoop({rounds:3,seed:'GUT v0.2.11 feedback validation',mineQuery:'NOSTROMO',verifyUrl:'https://github.com/jcchang13-a11y/visual-mining-lab'});
  check(active.status==='PASS','ACTIVE_LOOP_FAIL',{status:active.status,completedRounds:active.completedRounds});
  check(active.feedback?.appliedRounds===2,'FEEDBACK_APPLIED_ROUNDS',active.feedback);
  check(active.feedback?.firstAppliedRound===2,'FEEDBACK_FIRST_ROUND',active.feedback);
  check(active.trace?.[0]?.feedback?.inputFingerprint!==active.trace?.[1]?.feedback?.inputFingerprint,'FEEDBACK_INPUT_NOT_CHANGED',active.trace?.map(x=>x.feedback?.inputFingerprint));
  check(active.trace?.every(x=>x.gut?.absorbed>0),'ACTIVE_GUT_EMPTY',active.trace?.map(x=>x.gut));
  check(active.trace?.slice(1).every(x=>(x.gut?.antiEcho?.inheritedSubstrateStrippedCount||0)>0),'ACTIVE_INHERITED_NOT_STRIPPED',active.trace?.map(x=>x.gut?.antiEcho));
}catch(error){failures.push({type:'ACTIVE_LOOP_EXCEPTION',message:String(error?.message||error)});}

const result={
  schema:'nostromo-gut-metabolism-test/v0.2.11',completedAt:new Date().toISOString(),status:failures.length===0?'PASS':'FAIL',
  gut:{version:gut.version,mode:gut.mode,typeCounts:gut.typeCounts,routeCounts:Object.fromEntries(Object.entries(gut.routes).map(([k,v])=>[k,v.count])),boundary:gut.boundary},
  antiEcho:{nested:nestedGut.antiEcho,shortAdjacent:shortGut.antiEcho,nearDuplicate:nearGut.antiEcho,inherited:inheritedGut.antiEcho,partialInherited:partialGut.antiEcho},
  feedback:active?{status:active.status,completedRounds:active.completedRounds,feedback:active.feedback,lastCarry:active.trace?.at(-1)?.carryOut||null,roundAntiEcho:active.trace?.map(x=>x.gut?.antiEcho),boundary:active.boundary}:null,
  failures,
  boundary:'PASS proves deterministic heuristic routing, provenance retention, quarantine/hold behavior, conservative exact inherited-substrate removal, exact tagged-payload de-echoing, short exact adjacent intra-atom echo suppression, near-duplicate preservation, structured-snippet protection, and a 3-round cross-organ connector-feedback regression. It does not prove semantic novelty, semantic correctness, or source truth.'
};
await fs.writeFile(path.join(root,'nostromo/integration/gut-metabolism-last-result.json'),JSON.stringify(result,null,2)+'\n','utf8');
console.log(JSON.stringify(result,null,2));
if(result.status!=='PASS')process.exitCode=1;
