// DROPLET claim verification CI test v1.0
import fs from 'node:fs/promises';
import {verifyClaim} from './droplet-claim-verify-executor.mjs';

const outPath='nostromo/integration/droplet-claim-verify-last-result.json';
const bundle={
  claim:'Magentic-One is a generalist multi-agent system published by Microsoft Research in November 2024.',
  evidence:[
    {id:'E1',source:'Microsoft Research',sourceClass:'OFFICIAL',relation:'SUPPORTS',date:'2024-11-04',fingerprint:'05b19aff31a0265e'},
    {id:'E2',source:'Microsoft Research publication record',sourceClass:'OFFICIAL',relation:'SUPPORTS',date:'2024-11',fingerprint:'164fbdd09a7f060f'}
  ]
};
let result;
try{
  const verification=verifyClaim(bundle);
  const failures=[];
  if(verification.status!=='EXECUTED') failures.push({type:'NOT_EXECUTED'});
  if(verification.verdict!=='SUPPORTED') failures.push({type:'UNEXPECTED_VERDICT',verdict:verification.verdict});
  if(verification.counts.authoritativeSupports<1) failures.push({type:'NO_AUTHORITATIVE_SUPPORT'});
  result={schema:'nostromo-droplet-claim-verify-test/v1.0',completedAt:new Date().toISOString(),status:failures.length?'FAIL':'PASS',verification,failures,boundary:'This test validates deterministic claim verdict computation from persisted redacted evidence. The underlying evidence was obtained by an actual public-web connector run; CI itself performs no search-engine discovery.'};
}catch(error){result={schema:'nostromo-droplet-claim-verify-test/v1.0',completedAt:new Date().toISOString(),status:'FAIL',failures:[{type:'UNCAUGHT',message:String(error?.message||error)}]};}
await fs.writeFile(outPath,JSON.stringify(result,null,2)+'\n','utf8');
console.log(JSON.stringify(result,null,2));
if(result.status!=='PASS') process.exitCode=1;
