import fs from 'node:fs';
import {assessCapabilityEvidenceRoleSeparation} from '../gut/capability-evidence-role-separation.mjs';

const baseline=assessCapabilityEvidenceRoleSeparation({
  source:'registry alpha source 2026',
  permissions:['read public corpus'],
  interface:{inputs:'plain text document',outputs:'structured findings'}
});
if(baseline.status!=='PASS')throw new Error(`baseline rejected: ${JSON.stringify(baseline)}`);

const zeroWidthSpace=assessCapabilityEvidenceRoleSeparation({
  source:'registry alpha source 2026',
  authorization:{grant:'registry alpha so\u200Burce 2026'},
  interface:{inputs:'plain text document',outputs:'structured findings'}
});
if(zeroWidthSpace.status==='PASS'||zeroWidthSpace.reason!=='cross-role-evidence-format-control-laundering'){
  throw new Error(`zero-width-space laundering survived: ${JSON.stringify(zeroWidthSpace)}`);
}

const zeroWidthJoiner=assessCapabilityEvidenceRoleSeparation({
  provenance:{record:'registry alpha source 2026'},
  permission:'grant::registry alpha sour\u200Dce 2026::public',
  interface:{inputs:'plain text document',outputs:'structured findings'}
});
if(zeroWidthJoiner.status==='PASS'||zeroWidthJoiner.reason!=='cross-role-evidence-format-control-laundering'){
  throw new Error(`zero-width-joiner laundering survived: ${JSON.stringify(zeroWidthJoiner)}`);
}

const bidiIsolate=assessCapabilityEvidenceRoleSeparation({
  source:'registry alpha source 2026',
  authorization:{grant:'registry alpha \u2066source\u2069 2026'},
  contract:{inputs:'plain text document',outputs:'structured findings'}
});
if(bidiIsolate.status==='PASS'||bidiIsolate.reason!=='cross-role-evidence-format-control-laundering'){
  throw new Error(`bidi-control laundering survived: ${JSON.stringify(bidiIsolate)}`);
}

const distinct=assessCapabilityEvidenceRoleSeparation({
  source:'registry alpha source 2026',
  permissions:['read public cor\u200Bpus'],
  contract:{inputs:'plain text document',outputs:'structured evidence findings'}
});
if(distinct.status!=='PASS')throw new Error(`distinct format-bearing evidence falsely collided: ${JSON.stringify(distinct)}`);

for(const held of [zeroWidthSpace,zeroWidthJoiner,bidiIsolate]){
  if(held.bodyAdmission!==false||held.authorized!==false||held.executed!==false){
    throw new Error(`guard leaked authority: ${JSON.stringify(held)}`);
  }
}

const result={
  schema:'zenomorph-gut-capability-evidence-format-control-laundering-test/v0.2',
  status:'PASS',
  zeroWidthSpaceRejected:true,
  zeroWidthJoinerRejected:true,
  bidiFormatControlsRejected:true,
  distinctEvidencePreserved:true,
  originalObservedAtomsPreserved:true,
  authorizationGranted:false,
  executionGranted:false,
  bodyAdmissionGranted:false
};
fs.writeFileSync('nostromo/integration/gut-capability-evidence-format-control-laundering-last-result.json',JSON.stringify(result,null,2)+'\n');
console.log('PASS GUT format-control evidence laundering guard',JSON.stringify(result));
