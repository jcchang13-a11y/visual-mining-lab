import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import {runActiveExecutorLoop} from './active-orchestrator.mjs';

const root=process.cwd();
async function loadScript(rel){const code=await fs.readFile(path.join(root,rel),'utf8');vm.runInThisContext(code,{filename:rel});}
function assert(condition,message,detail){if(!condition){const e=new Error(message);e.detail=detail;throw e;}}

await loadScript('nostromo/gut/gut-engine.js');
await loadScript('nostromo/vajra/vajra-engine.js');

const sample={claim:'Claim: all five organs are already semantically mature.',question:'What evidence would change this conclusion?',evidence:{source:'test-fixture',finding:'Evidence: current GUT originally only flattened and deduplicated atoms.'},contradiction:'Counterevidence: shallow routing contradicts the maturity claim.',uncertainty:'INDETERMINATE: semantic maturity is not yet measured.',failure:{status:'FAILED',error:'synthetic failure marker'},duplicateA:'same useful material',duplicateB:'same useful material'};
const gut=globalThis.GutEngine.digest(sample,{source:'NOSTROMO/gut-metabolism-test'});
const failures=[];
function check(condition,type,detail){if(!condition)failures.push({type,detail});}
check(gut.version==='0.2.5','GUT_VERSION',gut.version);
check(gut.mode==='DETERMINISTIC_HEURISTIC_ROUTER','GUT_MODE',gut.mode);
check(gut.routes?.DROPLET?.count>=1,'CLAIM_NOT_ROUTED_TO_DROPLET',gut.routes?.DROPLET);
check(gut.routes?.SHROOMING?.count>=1,'QUESTION_NOT_ROUTED_TO_SHROOMING',gut.routes?.SHROOMING);
check(gut.routes?.VAJRA?.count>=1,'CONTRADICTION_NOT_ROUTED_TO_VAJRA',gut.routes?.VAJRA);
check(gut.routes?.MUTHER?.count>=1,'EVIDENCE_NOT_ROUTED_TO_MUTHER',gut.routes?.MUTHER);
check(gut.quarantined>=1,'FAILURE_NOT_QUARANTINED',gut.quarantine);
check(gut.excreted>=1,'DUPLICATE_NOT_EXCRETED',gut.waste);
check(gut.held>=1,'UNCERTAINTY_NOT_HELD',gut.hold);
check(gut.nutrients.every(x=>x.provenance?.inputSource==='NOSTROMO/gut-metabolism-test'),'PROVENANCE_LOST',gut.nutrients.filter(x=>x.provenance?.inputSource!=='NOSTROMO/gut-metabolism-test'));

const echoStem='Counterevidence: repeated recursive carry should not monopolize the next-round summary because this long prefix is deliberately identical across generated variants. ';
const echoFixture={a:echoStem+'variant A',b:echoStem+'variant B',c:echoStem+'variant C',question:'What novel signal remains after echo suppression?'};
const echoGut=globalThis.GutEngine.digest(echoFixture,{source:'NOSTROMO/gut-anti-echo-test'});
check(echoGut.antiEcho?.suppressedCount>=2,'ANTI_ECHO_NOT_SUPPRESSING',echoGut.antiEcho);
check((echoGut.summary.match(/repeated recursive carry/g)||[]).length===1,'ANTI_ECHO_SUMMARY_REPEAT',echoGut.summary);

const nested='[CONTRADICTION->VAJRA] Counterevidence: recursive carry repeats itself：[CONTRADICTION->VAJRA] Counterevidence: recursive carry repeats itself：[CONTRADICTION->VAJRA] Counterevidence: recursive carry repeats itself';
const nestedGut=globalThis.GutEngine.digest({carry:nested},{source:'NOSTROMO/gut-nested-echo-test'});
check(nestedGut.antiEcho?.nestedEchoAffectedAtoms===1,'NESTED_ECHO_ATOM_NOT_DETECTED',nestedGut.antiEcho);
check(nestedGut.antiEcho?.nestedEchoSuppressedCount>=2,'NESTED_ECHO_NOT_SUPPRESSED',nestedGut.antiEcho);
check(nestedGut.antiEcho?.routeTagsStripped>=1,'ROUTE_METADATA_NOT_STRIPPED',nestedGut.antiEcho);
check((nestedGut.summary.match(/\[CONTRADICTION->VAJRA\]/g)||[]).length===1,'NESTED_ECHO_SURVIVED_SUMMARY',nestedGut.summary);
check(!nestedGut.nutrients.some(x=>/\[[A-Z_]+->[A-Z/]+\]/.test(x.text)),'ROUTE_METADATA_SURVIVED_NUTRIENT',nestedGut.nutrients);

const segment='A long repeated segment that represents inherited carry content and should only occur once in the normalized atom';
const segmentGut=globalThis.GutEngine.digest({carry:`${segment}：${segment}：new material survives`},{source:'NOSTROMO/gut-segment-echo-test'});
check(segmentGut.antiEcho?.segmentEchoSuppressedCount===1,'SEGMENT_ECHO_NOT_SUPPRESSED',segmentGut.antiEcho);
check((segmentGut.summary.match(/A long repeated segment/g)||[]).length===1,'SEGMENT_ECHO_SURVIVED_SUMMARY',segmentGut.summary);
check(segmentGut.summary.includes('new material survives'),'SEGMENT_ECHO_REMOVED_NOVEL_MATERIAL',segmentGut.summary);

let active=null;
try{
  active=await runActiveExecutorLoop({rounds:3,seed:'GUT v0.2.5 feedback validation',mineQuery:'NOSTROMO',verifyUrl:'https://github.com/jcchang13-a11y/visual-mining-lab'});
  check(active.status==='PASS','ACTIVE_LOOP_FAIL',{status:active.status,completedRounds:active.completedRounds});
  check(active.feedback?.appliedRounds===2,'FEEDBACK_APPLIED_ROUNDS',active.feedback);
  check(active.feedback?.firstAppliedRound===2,'FEEDBACK_FIRST_ROUND',active.feedback);
  check(active.trace?.[0]?.feedback?.applied===false&&active.trace?.[1]?.feedback?.applied===true,'FEEDBACK_TRACE_FLAG',active.trace?.map(x=>x.feedback));
  check(active.trace?.[0]?.feedback?.inputFingerprint!==active.trace?.[1]?.feedback?.inputFingerprint,'FEEDBACK_INPUT_NOT_CHANGED',active.trace?.map(x=>x.feedback?.inputFingerprint));
  check(active.trace?.every(x=>x.gut?.absorbed>0),'ACTIVE_GUT_EMPTY',active.trace?.map(x=>x.gut));
  check(!active.trace?.at(-1)?.carryOut?.includes(':[CONTRADICTION->VAJRA]'),'ACTIVE_ROUTE_METADATA_ECHO',active.trace?.at(-1)?.carryOut);
}catch(error){failures.push({type:'ACTIVE_LOOP_EXCEPTION',message:String(error?.message||error)});}

const result={schema:'nostromo-gut-metabolism-test/v0.2.5',completedAt:new Date().toISOString(),status:failures.length===0?'PASS':'FAIL',gut:{version:gut.version,mode:gut.mode,ingested:gut.ingested,absorbed:gut.absorbed,excreted:gut.excreted,quarantined:gut.quarantined,held:gut.held,typeCounts:gut.typeCounts,routeCounts:Object.fromEntries(Object.entries(gut.routes).map(([k,v])=>[k,v.count])),antiEcho:echoGut.antiEcho,nestedAntiEcho:nestedGut.antiEcho,segmentAntiEcho:segmentGut.antiEcho,boundary:gut.boundary},feedback:active?{status:active.status,completedRounds:active.completedRounds,feedback:active.feedback,lastCarry:active.trace?.at(-1)?.carryOut||null,boundary:active.boundary}:null,failures,boundary:'PASS proves deterministic heuristic classification, quarantine/hold/excretion, destination routing, provenance propagation, prefix-diversity suppression, nested route-tag echo cutoff, inherited route-metadata stripping, adjacent long-segment echo collapse, and explicit application of persisted redacted connector feedback from round 2. It does not prove semantic correctness, source truth, or live connector re-execution inside GitHub Actions.'};
await fs.writeFile(path.join(root,'nostromo/integration/gut-metabolism-last-result.json'),JSON.stringify(result,null,2)+'\n','utf8');
console.log(JSON.stringify(result,null,2));
assert(result.status==='PASS','GUT_METABOLISM_TEST_FAILED',failures);
