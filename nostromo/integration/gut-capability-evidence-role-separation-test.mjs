import fs from 'node:fs';
import {assessCapabilityEvidenceRoleSeparation} from '../gut/capability-evidence-role-separation.mjs';

const good={
  source:'vendor registry 2026-09-12',
  permissions:['read:public'],
  contract:{inputs:'text',outputs:'structured findings'}
};
const goodOut=assessCapabilityEvidenceRoleSeparation(good);
if(goodOut.status!=='PASS')throw new Error(`good role-separated evidence rejected: ${JSON.stringify(goodOut)}`);

const reused='vendor registry 2026-09-12';
const collision=assessCapabilityEvidenceRoleSeparation({
  source:reused,
  permissions:[reused],
  contract:{inputs:'text',outputs:'structured findings'}
});
if(collision.status==='PASS'||collision.reason!=='cross-role-evidence-reuse')throw new Error(`cross-role evidence reuse survived: ${JSON.stringify(collision)}`);

const wrappedCollision=assessCapabilityEvidenceRoleSeparation({
  source:'vendor registry 2026-09-12',
  permissions:['permission grant for vendor registry 2026-09-12'],
  contract:{inputs:'text',outputs:'structured findings'}
});
if(wrappedCollision.status==='PASS'||wrappedCollision.reason!=='cross-role-evidence-wrapped-reuse')throw new Error(`wrapped cross-role evidence reuse survived: ${JSON.stringify(wrappedCollision)}`);

const reverseWrappedCollision=assessCapabilityEvidenceRoleSeparation({
  source:'registry record: alpha-source-2026',
  authorization:{grant:'alpha-source-2026'},
  interface:{inputs:'text',outputs:'findings'}
});
if(reverseWrappedCollision.status==='PASS'||reverseWrappedCollision.reason!=='cross-role-evidence-wrapped-reuse')throw new Error(`reverse wrapped reuse survived: ${JSON.stringify(reverseWrappedCollision)}`);

const nestedCollision=assessCapabilityEvidenceRoleSeparation({
  provenance:{registry:{label:'alpha-source'}},
  authorization:{grant:{label:'alpha-source'}},
  interface:{inputs:'text',outputs:'findings'}
});
if(nestedCollision.status==='PASS'||nestedCollision.reason!=='cross-role-evidence-reuse')throw new Error(`nested cross-role reuse survived: ${JSON.stringify(nestedCollision)}`);

const upstreamPlaceholder=assessCapabilityEvidenceRoleSeparation({
  source:'unknown',
  permissions:['read:public'],
  contract:{inputs:'text',outputs:'structured findings'}
});
if(upstreamPlaceholder.status==='PASS'||upstreamPlaceholder.classification!=='UPSTREAM_EVIDENCE_QUALITY_NOT_PASSED')throw new Error('upstream placeholder gate was bypassed');

const result={
  schema:'zenomorph-gut-capability-evidence-role-separation-test/v0.2',
  status:'PASS',
  goodCase:goodOut.classification,
  crossRoleReuseRejected:true,
  wrappedCrossRoleReuseRejected:true,
  reverseWrappedCrossRoleReuseRejected:true,
  nestedCrossRoleReuseRejected:true,
  upstreamEvidenceQualityRequired:true,
  bodyAdmissionGranted:false
};
fs.writeFileSync('nostromo/integration/gut-capability-evidence-role-separation-last-result.json',JSON.stringify(result,null,2)+'\n');
console.log('PASS GUT evidence role-separation gate',JSON.stringify(result));
