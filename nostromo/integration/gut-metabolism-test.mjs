import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import {runActiveExecutorLoop} from './active-orchestrator.mjs';

const root=process.cwd();
async function loadScript(rel){const code=await fs.readFile(path.join(root,rel),'utf8');vm.runInThisContext(code,{filename:rel});}
function assert(condition,message,detail){if(!condition){const e=new Error(message);e.detail=detail;throw e;}}

await loadScript('nostromo/gut/gut-engine.js');
await loadScript('nostromo/vajra/vajra-engine.js');

const sample={
  claim:'Claim: all five organs are already semantically mature.',
  question:'What evidence would change this conclusion?',
  evidence:{source:'test-fixture',finding:'Evidence: current GUT v0.1 only flattened and deduplicated atoms.'},
  contradiction:'Counterevidence: shallow routing contradicts the maturity claim.',
  uncertainty:'INDETERMINATE: semantic maturity is not yet measured.',
  failure:{status:'FAILED',error:'synthetic poison marker'},
  duplicateA:'same useful material',duplicateB:'same useful material'
};
const gut=globalThis.GutEngine.digest(sample,{source:'NOSTROMO/gut-metabolism-test'});
const failures=[];
function check(condition,type,detail){if(!condition)failures.push({type,detail});}
check(gut.version==='0.2','GUT_VERSION',gut.version);
check(gut.mode==='DETERMINISTIC_HEURISTIC_ROUTER','GUT_MODE',gut.mode);
check(gut.routes?.DROPLET?.count>=1,'CLAIM_NOT_ROUTED_TO_DROPLET',gut.routes?.DROPLET);
check(gut.routes?.SHROOMING?.count>=1,'QUESTION_NOT_ROUTED_TO_SHROOMING',gut.routes?.SHROOMING);
check(gut.routes?.VAJRA?.count>=1,'CONTRADICTION_NOT_ROUTED_TO_VAJRA',gut.routes?.VAJRA);
check(gut.routes?.MUTHER?.count>=1,'EVIDENCE_NOT_ROUTED_TO_MUTHER',gut.routes?.MUTHER);
check(gut.quarantined>=1,'FAILURE_NOT_QUARANTINED',gut.quarantine);
check(gut.excreted>=1,'DUPLICATE_NOT_EXCRETED',gut.waste);
check(gut.held>=1,'UNCERTAINTY_NOT_HELD',gut.hold);
check(gut.nutrients.every(x=>x.provenance?.inputSource==='NOSTROMO/gut-metabolism-test'),'PROVENANCE_LOST',gut.nutrients.filter(x=>x.provenance?.inputSource!=='NOSTROMO/gut-metabolism-test'));

let active=null;
try{
  active=await runActiveExecutorLoop({rounds:3,seed:'GUT v0.2 feedback validation',mineQuery:'NOSTROMO',verifyUrl:'https://github.com/jcchang13-a11y/visual-mining-lab'});
  check(active.status==='PASS','ACTIVE_LOOP_FAIL',{status:active.status,completedRounds:active.completedRounds});
  check(active.feedback?.appliedRounds===2,'FEEDBACK_APPLIED_ROUNDS',active.feedback);
  check(active.feedback?.firstAppliedRound===2,'FEEDBACK_FIRST_ROUND',active.feedback);
  check(active.trace?.[0]?.feedback?.applied===false&&active.trace?.[1]?.feedback?.applied===true,'FEEDBACK_TRACE_FLAG',active.trace?.map(x=>x.feedback));
  check(active.trace?.[0]?.feedback?.inputFingerprint!==active.trace?.[1]?.feedback?.inputFingerprint,'FEEDBACK_INPUT_NOT_CHANGED',active.trace?.map(x=>x.feedback?.inputFingerprint));
  check(active.trace?.every(x=>x.gut?.absorbed>0),'ACTIVE_GUT_EMPTY',active.trace?.map(x=>x.gut));
}catch(error){failures.push({type:'ACTIVE_LOOP_EXCEPTION',message:String(error?.message||error)});}

const result={
  schema:'nostromo-gut-metabolism-test/v0.2',
  completedAt:new Date().toISOString(),
  status:failures.length===0?'PASS':'FAIL',
  gut:{version:gut.version,mode:gut.mode,ingested:gut.ingested,absorbed:gut.absorbed,excreted:gut.excreted,quarantined:gut.quarantined,held:gut.held,typeCounts:gut.typeCounts,routeCounts:Object.fromEntries(Object.entries(gut.routes).map(([k,v])=>[k,v.count])),boundary:gut.boundary},
  feedback:active?{status:active.status,completedRounds:active.completedRounds,feedback:active.feedback,boundary:active.boundary}:null,
  failures,
  boundary:'PASS proves deterministic heuristic classification, quarantine/hold/excretion, destination routing, provenance propagation, and explicit application of persisted redacted connector feedback from round 2. It does not prove semantic correctness, source truth, or live connector re-execution inside GitHub Actions.'
};
await fs.writeFile(path.join(root,'nostromo/integration/gut-metabolism-last-result.json'),JSON.stringify(result,null,2)+'\n','utf8');
console.log(JSON.stringify(result,null,2));
assert(result.status==='PASS','GUT_METABOLISM_TEST_FAILED',failures);
