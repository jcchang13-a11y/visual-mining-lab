import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';

const root=process.cwd();
const code=await fs.readFile(path.join(root,'nostromo/gut/gut-engine.js'),'utf8');
vm.runInThisContext(code,{filename:'nostromo/gut/gut-engine.js'});

const failures=[];
const check=(ok,type,detail)=>{if(!ok)failures.push({type,detail});};
const version=String(globalThis.GutEngine?.digest?.({ping:'pong'},{source:'NOSTROMO/gut-ancestor-failure-version-probe'})?.version||'unknown');
const promoted=version==='0.2.25';

const failedBundle={
  organ:'DROPLET',
  status:'FAILED',
  claim:'Claim: this failed executor payload must not escape as a fresh claim.',
  evidence:'Evidence: this payload is structurally present but belongs to a failed execution.',
  question:'What should the next organ do with a failed upstream payload?'
};
const failedGut=globalThis.GutEngine.digest({failedBundle},{source:'NOSTROMO/gut-ancestor-failure-test'});

const healthyBundle={
  organ:'DROPLET',
  status:'EXECUTED',
  claim:'Claim: an invalid premise can still be a useful falsification target.',
  evidence:'Evidence: the measured error rate fell after the patch.'
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
  check(healthyGut.routes?.DROPLET?.items?.some(x=>x.path==='root.healthyBundle.claim'),'HEALTHY_CLAIM_FALSELY_QUARANTINED',healthyGut);
  check(healthyGut.routes?.MUTHER?.items?.some(x=>x.path==='root.healthyBundle.evidence'),'HEALTHY_EVIDENCE_FALSELY_QUARANTINED',healthyGut);
}else{
  failures.push({type:'UNEXPECTED_GUT_VERSION',detail:{expected:'0.2.25',actual:version}});
}

const result={
  schema:'nostromo-gut-ancestor-failure-test/v0.2',
  completedAt:new Date().toISOString(),
  engineVersion:version,
  status:failures.length===0?'PASS':'FAIL',
  promoted,
  failedBundle:{quarantined:failedGut.quarantined,routeCounts:Object.fromEntries(Object.entries(failedGut.routes||{}).map(([k,v])=>[k,v.count])),quarantine:failedGut.quarantine?.map(x=>({path:x.path,type:x.type,reason:x.reason,provenance:x.provenance}))},
  healthyControl:{quarantined:healthyGut.quarantined,routeCounts:Object.fromEntries(Object.entries(healthyGut.routes||{}).map(([k,v])=>[k,v.count]))},
  failures,
  boundary:'This adversarial test distinguishes executor-envelope failure context from ordinary semantic prose. On GUT v0.2.25, a FAILED ancestor status must quarantine descendant payload atoms before they can be routed as fresh claims/evidence/questions, while an EXECUTED ancestor must not quarantine useful prose merely because it contains words such as invalid or error. This is structural execution-context containment, not semantic truth or source-quality judgment.'
};
await fs.writeFile(path.join(root,'nostromo/integration/gut-ancestor-failure-last-result.json'),JSON.stringify(result,null,2)+'\n','utf8');
console.log(JSON.stringify(result,null,2));
if(failures.length)process.exitCode=1;
