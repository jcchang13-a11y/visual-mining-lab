import fs from 'node:fs';
import {assessCapabilityEvidenceRoleSeparation} from '../gut/capability-evidence-role-separation.mjs';

const baseline=assessCapabilityEvidenceRoleSeparation({
  source:'registry alpha source 2026',
  permissions:['read:public'],
  interface:{inputs:'text',outputs:'findings'}
});
if(baseline.status!=='PASS')throw new Error(`baseline rejected: ${JSON.stringify(baseline)}`);

const punctuated=assessCapabilityEvidenceRoleSeparation({
  source:'registry alpha source 2026',
  authorization:{grant:'registry-alpha/source—2026'},
  interface:{inputs:'text',outputs:'findings'}
});
if(punctuated.status==='PASS'||punctuated.reason!=='cross-role-evidence-separator-laundering'){
  throw new Error(`punctuation laundering survived: ${JSON.stringify(punctuated)}`);
}

const wrappedPunctuated=assessCapabilityEvidenceRoleSeparation({
  provenance:{record:'alpha source registry 2026'},
  permission:'grant::alpha-source-registry/2026::public',
  interface:{inputs:'text',outputs:'findings'}
});
if(wrappedPunctuated.status==='PASS'||wrappedPunctuated.reason!=='cross-role-evidence-separator-laundering'){
  throw new Error(`separator wrapped laundering survived: ${JSON.stringify(wrappedPunctuated)}`);
}

const distinct=assessCapabilityEvidenceRoleSeparation({
  source:'registry alpha source 2026',
  permissions:['read public corpus'],
  contract:{inputs:'plain text document',outputs:'structured evidence findings'}
});
if(distinct.status!=='PASS')throw new Error(`distinct evidence falsely collided: ${JSON.stringify(distinct)}`);

const result={
  schema:'zenomorph-gut-capability-evidence-separator-laundering-test/v0.1',
  status:'PASS',
  punctuationFragmentationRejected:true,
  separatorWrappedReuseRejected:true,
  distinctEvidencePreserved:true,
  bodyAdmissionGranted:false
};
fs.writeFileSync('nostromo/integration/gut-capability-evidence-separator-laundering-last-result.json',JSON.stringify(result,null,2)+'\n');
console.log('PASS GUT separator laundering guard',JSON.stringify(result));
