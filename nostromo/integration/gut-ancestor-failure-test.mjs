import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';

const root=process.cwd();
const code=await fs.readFile(path.join(root,'nostromo/gut/gut-engine.js'),'utf8');
vm.runInThisContext(code,{filename:'nostromo/gut/gut-engine.js'});

const failures=[];
const check=(ok,type,detail)=>{if(!ok)failures.push({type,detail});};
const version=String(globalThis.GutEngine?.digest?.({ping:'pong'},{source:'NOSTROMO/gut-ancestor-failure-version-probe'})?.version||'unknown');

const failedBundle={
  organ:'DROPLET', status:'FAILED',
  claim:'Claim: this failed executor payload must not escape as a fresh claim.',
  evidence:'Evidence: this payload is structurally present but belongs to a failed execution.',
  question:'What should the next organ do with a failed upstream payload?'
};
const failedGut=globalThis.GutEngine.digest({failedBundle},{source:'NOSTROMO/gut-ancestor-failure-test'});

const terminalNonSuccessCases=['CANCELLED','TIMEOUT','TIMED_OUT','ABORTED','BLOCKED','SKIPPED'];
const terminalNonSuccessResults=terminalNonSuccessCases.map(status=>{
  const bundle={
    organ:'MU/TH/UR', status,
    claim:`Claim: payload from ${status} execution must not become a fresh downstream claim.`,
    evidence:`Evidence: payload from ${status} execution is present only for audit.`,
    question:`Question: should ${status} payload be treated as successful material?`
  };
  return {status,gut:globalThis.GutEngine.digest({bundle},{source:`NOSTROMO/gut-terminal-nonsuccess-${status.toLowerCase()}`})};
});

const machineContextCases=[
  {name:'execution-timeout',input:{execution:{timeout:'request exceeded 30 seconds'}},path:'root.execution.timeout'},
  {name:'job-blocked',input:{job:{blocked:'policy gate prevented execution'}},path:'root.job.blocked'},
  {name:'attempt-cancelled',input:{attempt:{cancelled:'upstream request cancelled externally'}},path:'root.attempt.cancelled'},
  {name:'request-timeout-reason',input:{request:{phase:{timeout:{reason:'remote dependency exceeded deadline'}}}},path:'root.request.phase.timeout.reason'}
].map(test=>({...test,gut:globalThis.GutEngine.digest(test.input,{source:`NOSTROMO/gut-machine-context-${test.name}`})}));

const healthyBundle={
  organ:'DROPLET', status:'EXECUTED',
  claim:'Claim: an invalid premise can still be a useful falsification target.',
  evidence:'Evidence: the measured error rate fell after the patch.',
  note:'The timeout setting is 30 seconds and the skipped-item label is discussed only as ordinary prose.',
  semanticTimeoutToken:'timeout', semanticSkippedToken:'skipped'
};
const healthyGut=globalThis.GutEngine.digest({healthyBundle},{source:'NOSTROMO/gut-ancestor-failure-control'});
const nonMachinePathControl={
  settings:{timeout:'30 seconds'},
  documentation:{blocked:'blocked is a state described in the protocol'},
  vocabulary:{cancelled:'cancelled is a lexical example rather than an execution result'}
};
const nonMachineGut=globalThis.GutEngine.digest(nonMachinePathControl,{source:'NOSTROMO/gut-machine-path-false-positive-control'});

const failedPayloadPaths=['root.failedBundle.claim','root.failedBundle.evidence','root.failedBundle.question'];
for(const p of failedPayloadPaths) check(failedGut.quarantine?.some(x=>x.path===p),'FAILED_ANCESTOR_PAYLOAD_ESCAPED',{path:p,quarantine:failedGut.quarantine,routes:failedGut.routes});
check(!failedGut.routes?.DROPLET?.items?.some(x=>x.path==='root.failedBundle.claim'),'FAILED_ANCESTOR_CLAIM_ROUTED',failedGut.routes?.DROPLET);
check(!failedGut.routes?.MUTHER?.items?.some(x=>x.path==='root.failedBundle.evidence'),'FAILED_ANCESTOR_EVIDENCE_ROUTED',failedGut.routes?.MUTHER);
check(!failedGut.routes?.SHROOMING?.items?.some(x=>x.path==='root.failedBundle.question'),'FAILED_ANCESTOR_QUESTION_ROUTED',failedGut.routes?.SHROOMING);
check(failedGut.quarantine?.filter(x=>x.path.startsWith('root.failedBundle.')).every(x=>x.provenance?.status==='FAILED'),'FAILED_ANCESTOR_STATUS_PROVENANCE_LOST',failedGut.quarantine);
check(failedGut.quarantine?.filter(x=>x.path.startsWith('root.failedBundle.')).every(x=>x.provenance?.inputSource==='NOSTROMO/gut-ancestor-failure-test'),'FAILED_ANCESTOR_INPUT_PROVENANCE_LOST',failedGut.quarantine);

for(const {status,gut} of terminalNonSuccessResults){
  const prefix='root.bundle.';
  for(const field of ['claim','evidence','question']) check(gut.quarantine?.some(x=>x.path===`${prefix}${field}`),'TERMINAL_NON_SUCCESS_PAYLOAD_ESCAPED',{status,field,quarantine:gut.quarantine,routes:gut.routes});
  check(!gut.routes?.DROPLET?.items?.some(x=>x.path===`${prefix}claim`),'TERMINAL_NON_SUCCESS_CLAIM_ROUTED',{status,route:gut.routes?.DROPLET});
  check(!gut.routes?.MUTHER?.items?.some(x=>x.path===`${prefix}evidence`),'TERMINAL_NON_SUCCESS_EVIDENCE_ROUTED',{status,route:gut.routes?.MUTHER});
  check(!gut.routes?.SHROOMING?.items?.some(x=>x.path===`${prefix}question`),'TERMINAL_NON_SUCCESS_QUESTION_ROUTED',{status,route:gut.routes?.SHROOMING});
  check(gut.quarantine?.filter(x=>x.path.startsWith(prefix)).every(x=>x.provenance?.status===status),'TERMINAL_NON_SUCCESS_STATUS_PROVENANCE_LOST',{status,quarantine:gut.quarantine});
}

for(const test of machineContextCases){
  check(test.gut.quarantine?.some(x=>x.path===test.path),'MACHINE_CONTEXT_TERMINAL_FAILURE_PATH_ESCAPED',{name:test.name,path:test.path,quarantine:test.gut.quarantine,routes:test.gut.routes});
  check(test.gut.routes?.HOLD?.items?.some(x=>x.path===test.path),'MACHINE_CONTEXT_FAILURE_NOT_HELD',{name:test.name,path:test.path,routes:test.gut.routes});
}

check(healthyGut.routes?.DROPLET?.items?.some(x=>x.path==='root.healthyBundle.claim'),'HEALTHY_CLAIM_FALSELY_QUARANTINED',healthyGut);
check(healthyGut.routes?.MUTHER?.items?.some(x=>x.path==='root.healthyBundle.evidence'),'HEALTHY_EVIDENCE_FALSELY_QUARANTINED',healthyGut);
check(!healthyGut.quarantine?.some(x=>x.path==='root.healthyBundle.note'),'ORDINARY_TIMEOUT_PROSE_FALSELY_QUARANTINED',healthyGut.quarantine);
for(const field of ['semanticTimeoutToken','semanticSkippedToken']){
  const p=`root.healthyBundle.${field}`;
  check(!healthyGut.quarantine?.some(x=>x.path===p),'BARE_TERMINAL_WORD_FALSELY_QUARANTINED',{path:p,quarantine:healthyGut.quarantine});
  check(healthyGut.nutrients?.some(x=>x.path===p),'BARE_TERMINAL_WORD_LOST_FROM_NUTRIENTS',{path:p,nutrients:healthyGut.nutrients});
}
for(const p of ['root.settings.timeout','root.documentation.blocked','root.vocabulary.cancelled']){
  check(!nonMachineGut.quarantine?.some(x=>x.path===p),'NON_MACHINE_TERMINAL_PATH_FALSELY_QUARANTINED',{path:p,quarantine:nonMachineGut.quarantine});
  check(nonMachineGut.nutrients?.some(x=>x.path===p),'NON_MACHINE_TERMINAL_PATH_LOST',{path:p,nutrients:nonMachineGut.nutrients});
}

const result={
  schema:'nostromo-gut-ancestor-failure-test/v0.6',
  completedAt:new Date().toISOString(),
  engineVersion:version,
  status:failures.length===0?'PASS':'FAIL',
  contractMode:'VERSION_INDEPENDENT_CAPABILITY_ASSERTION',
  regressionOrigin:{
    defect:'The guard test was hard-wired to GUT v0.2.27, so later compatible engines could execute all assertions successfully and still make the workflow fail at the enforcement step.',
    repair:'The test now asserts the ancestor-failure containment contract directly against the loaded engine. Engine version is audit metadata only and can no longer disable or invalidate the capability assertions.'
  },
  failedBundle:{quarantined:failedGut.quarantined,routeCounts:Object.fromEntries(Object.entries(failedGut.routes||{}).map(([k,v])=>[k,v.count]))},
  terminalNonSuccess:terminalNonSuccessResults.map(({status,gut})=>({status,quarantined:gut.quarantined,routeCounts:Object.fromEntries(Object.entries(gut.routes||{}).map(([k,v])=>[k,v.count]))})),
  machineContextPaths:machineContextCases.map(test=>({name:test.name,path:test.path,quarantined:test.gut.quarantine?.some(x=>x.path===test.path),routeCounts:Object.fromEntries(Object.entries(test.gut.routes||{}).map(([k,v])=>[k,v.count]))})),
  healthyControl:{quarantined:healthyGut.quarantined,routeCounts:Object.fromEntries(Object.entries(healthyGut.routes||{}).map(([k,v])=>[k,v.count]))},
  nonMachinePathControl:{quarantined:nonMachineGut.quarantined},
  failures,
  boundary:'This is a capability-contract regression test, not a version-promotion gate. It distinguishes terminal non-success executor context and bounded machine-execution failure paths from ordinary semantic prose/configuration. Version changes must not create false PASS or false FAIL; the loaded engine must satisfy the behavior directly.'
};
await fs.writeFile(path.join(root,'nostromo/integration/gut-ancestor-failure-last-result.json'),JSON.stringify(result,null,2)+'\n','utf8');
console.log(JSON.stringify(result,null,2));
if(failures.length)process.exitCode=1;
