import fs from 'node:fs';
import {assessCapabilityEvidenceQuality} from '../gut/capability-evidence-quality.mjs';

const good={
  source:'vendor registry 2026-09-12',
  permissions:['read:public'],
  contract:{inputs:'text',outputs:'structured findings'}
};
const goodOut=assessCapabilityEvidenceQuality(good);
if(goodOut.status!=='PASS')throw new Error(`good evidence rejected: ${JSON.stringify(goodOut)}`);

const placeholders=['unknown','N/A','ｔｏｄｏ',' TBD ','pending','not provided','placeholder','changeme'];
const rejected=[];
for(const token of placeholders){
  const out=assessCapabilityEvidenceQuality({
    source:token,
    permissions:['read:public'],
    contract:{inputs:'text',outputs:'structured findings'}
  });
  if(out.status==='PASS'||out.reason!=='semantic-placeholder-evidence'){
    throw new Error(`placeholder laundering survived for ${JSON.stringify(token)}: ${JSON.stringify(out)}`);
  }
  rejected.push(token);
}

const nested=assessCapabilityEvidenceQuality({
  source:{provider:{label:'unknown'}},
  permissions:['read:public'],
  contract:{inputs:'text',outputs:'structured findings'}
});
if(nested.status==='PASS'||nested.reason!=='semantic-placeholder-evidence')throw new Error('nested semantic placeholder survived');

const scalar=assessCapabilityEvidenceQuality({
  source:true,
  permissions:['read:public'],
  contract:{inputs:'text',outputs:'structured findings'}
});
if(scalar.status==='PASS'||scalar.reason!=='scalar-placeholder-evidence')throw new Error('scalar placeholder survived');

let getterRan=false;
const accessor={permissions:['read:public'],contract:{inputs:'text',outputs:'structured findings'}};
Object.defineProperty(accessor,'source',{enumerable:true,get(){getterRan=true;return 'vendor';}});
const accessorOut=assessCapabilityEvidenceQuality(accessor);
if(getterRan)throw new Error('evidence accessor executed');
if(accessorOut.status!=='QUARANTINE'||accessorOut.reason!=='accessor-evidence')throw new Error('accessor evidence did not fail closed');

const result={
  schema:'zenomorph-gut-capability-evidence-quality-test/v0.1',
  status:'PASS',
  goodCase:goodOut.classification,
  rejectedSemanticPlaceholders:rejected,
  nestedPlaceholderRejected:true,
  scalarPlaceholderRejected:true,
  accessorExecuted:false,
  bodyAdmissionGranted:false
};
fs.writeFileSync('nostromo/integration/gut-capability-evidence-quality-last-result.json',JSON.stringify(result,null,2)+'\n');
console.log('PASS GUT semantic evidence-quality gate',JSON.stringify(result));
