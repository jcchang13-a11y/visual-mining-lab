import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';

const root=process.cwd();
const code=await fs.readFile(path.join(root,'nostromo/gut/gut-engine.js'),'utf8');
vm.runInThisContext(code,{filename:'nostromo/gut/gut-engine.js'});

const failures=[];
const check=(ok,type,detail)=>{if(!ok)failures.push({type,detail});};
const version=String(globalThis.GutEngine?.digest?.({ping:'pong'},{source:'NOSTROMO/gut-ancestor-failure-version-probe'})?.version||'unknown');
const promoted=version==='0.2.26';

const failedBundle={
  organ:'DROPLET',
  status:'FAILED',
  claim:'Claim: this failed executor payload must not escape as a fresh claim.',
  evidence:'Evidence: this payload is structurally present but belongs to a failed execution.',
  question:'What should the next organ do with a failed upstream payload?'
};
const failedGut=globalThis.GutEngine.digest({failedBundle},{source:'NOSTROMO/gut-ancestor-failure-test'});

const terminalNonSuccessCases=['CANCELLED','TIMEOUT','TIMED_OUT','ABORTED','BLOCKED','SKIPPED'];
const terminalNonSuccessResults=terminalNonSuccessCases.map(status=>{
  const bundle={
    organ:'MU/TH/UR',
    status,
    claim:`Claim: payload from ${status} execution must not become a fresh downstream claim.`,
    evidence:`Evidence: payload from ${status} execution is present only for audit.`,
    question:`Question: should ${status} payload be treated as successful material?`
  };
  return {status,gut:globalThis.GutEngine.digest({bundle},{source:`NOSTROMO/gut-terminal-nonsuccess-${status.toLowerCase()}`})};
});

const healthyBundle={
  organ:'DROPLET',
  status:'EXECUTED',
  claim:'Claim: an invalid premise can still be a useful falsification target.',
  evidence:'Evidence: the measured error rate fell after the patch.',
  note:'The timeout setting is 30 seconds and the skipped-item label is discussed only as ordinary prose.'
};
const healthyGut=globalThis.GutEngine.digest({healthyBundle},{source:'NOSTROMO/gut-ancestor-failure-control'});

if(promoted){
  const failedPayloadPaths=['root.failedBundle.claim','root.failedBundle.evidence','root.failedBundle.question'];
  for(const p of failedPayloadPaths)check(failedGut.quarantine?.some(x=>x.path===p),'FAILED_ANCESTOR_PAYLOAD_ESCAPED',{path:p,quarantine:failedGut.quarantine,routes:failedGut.routes});
  check(!failedGut.routes?.DROPLET?.items?.some(x=>x.path==='root.failedBundle.claim'),'FAILED_ANCESTOR_CLAIM_ROUTED',failedGut.routes?.DROPLET);
  check(!failedGut.routes?.MUTHER?.items?.some(x=>x.path==='root.failedBundle.evidence'),'FAILED_ANCESTOR_EVIDENCE_ROUTED',failedGut.routes?.MUTHER);
  check(!failedGut.routes?.SHROOMING?.items?.some(x=>x.path==='root.failedBundle.question'),'FAILED_ANCESTOR_QUESTION_ROUTED',failedGut.routes?.SHROOMING);
  check(failedGut.quarantine?.filter(x=>x.path.startsWith('root.failedBundle.')).every(x=>x.provenance?.status==='FAILED'),'FAILED_ANCESTOR_STATUS_PROVENANCE_LOST',failedGut.quarantine);
  check(failedGut.quarantine?.filter(x=>x.path.startsWith('root.failedBundle.')).every(x=>x.provenance?.inputSource==='NOSTROMO/gut-ancestor-failure-test'),'FAILED_ANCESTOR_INPUT_PROVENANCE_LOST',failedGut.quarantine);

  for(const {status,gut} of terminalNonSuccessResults){
    const prefix='root.bundle.';
    for(const field of ['claim','evidence','question'])check(gut.quarantine?.some(x=>x.path===`${prefix}${field}`),'TERMINAL_NON_SUCCESS_PAYLOAD_ESCAPED',{status,field,quarantine:gut.quarantine,routes:gut.routes});
    check(!gut.routes?.DROPLET?.items?.some(x=>x.path===`${prefix}claim`),'TERMINAL_NON_SUCCESS_CLAIM_ROUTED',{status,route:gut.routes?.DROPLET});
    check(!gut.routes?.MUTHER?.items?.some(x=>x.path===`${prefix}evidence`),'TERMINAL_NON_SUCCESS_EVIDENCE_ROUTED',{status,route:gut.routes?.MUTHER});
    check(!gut.routes?.SHROOMING?.items?.some(x=>x.path===`${prefix}question`),'TERMINAL_NON_SUCCESS_QUESTION_ROUTED',{status,route:gut.routes?.SHROOMING});
    check(gut.quarantine?.filter(x=>x.path.startsWith(prefix)).every(x=>x.provenance?.status===status),'TERMINAL_NON_SUCCESS_STATUS_PROVENANCE_LOST',{status,quarantine:gut.quarantine});
  }

  check(healthyGut.routes?.DROPLET?.items?.some(x=>x.path==='root.healthyBundle.claim'),'HEALTHY_CLAIM_FALSELY_QUARANTINED',healthyGut);
  check(healthyGut.routes?.MUTHER?.items?.some(x=>x.path==='root.healthyBundle.evidence'),'HEALTHY_EVIDENCE_FALSELY_QUARANTINED',healthyGut);
  check(!healthyGut.quarantine?.some(x=>x.path==='root.healthyBundle.note'),'ORDINARY_TIMEOUT_PROSE_FALSELY_QUARANTINED',healthyGut.quarantine);
}else{
  failures.push({type:'UNEXPECTED_GUT_VERSION',detail:{expected:'0.2.26',actual:version}});
}

const result={
  schema:'nostromo-gut-ancestor-failure-test/v0.3',
  completedAt:new Date().toISOString(),
  engineVersion:version,
  status:failures.length===0?'PASS':'FAIL',
  promoted,
  failedBundle:{quarantined:failedGut.quarantined,routeCounts:Object.fromEntries(Object.entries(failedGut.routes||{}).map(([k,v])=>[k,v.count])),quarantine:failedGut.quarantine?.map(x=>({path:x.path,type:x.type,reason:x.reason,provenance:x.provenance}))},
  terminalNonSuccess:terminalNonSuccessResults.map(({status,gut})=>({status,quarantined:gut.quarantined,routeCounts:Object.fromEntries(Object.entries(gut.routes||{}).map(([k,v])=>[k,v.count])),quarantine:gut.quarantine?.map(x=>({path:x.path,type:x.type,reason:x.reason,provenance:x.provenance}))})),
  healthyControl:{quarantined:healthyGut.quarantined,routeCounts:Object.fromEntries(Object.entries(healthyGut.routes||{}).map(([k,v])=>[k,v.count]))},
  failures,
  boundary:'This adversarial test distinguishes terminal non-success executor-envelope context from ordinary semantic prose. On GUT v0.2.26, FAILED plus CANCELLED, TIMEOUT, TIMED_OUT, ABORTED, BLOCKED and SKIPPED ancestor statuses must quarantine descendant payload atoms before they can be routed as fresh claims/evidence/questions, while an EXECUTED ancestor must not quarantine useful prose merely because it discusses words such as invalid, error, timeout or skipped. This is structural execution-context containment, not semantic truth or source-quality judgment.'
};
await fs.writeFile(path.join(root,'nostromo/integration/gut-ancestor-failure-last-result.json'),JSON.stringify(result,null,2)+'\n','utf8');
console.log(JSON.stringify(result,null,2));
if(failures.length)process.exitCode=1;
