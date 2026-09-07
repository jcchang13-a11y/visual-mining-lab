import fs from 'node:fs/promises';
import {assessForeignCapability,capabilityAdmissionBoundary} from '../gut/capability-admission.mjs';

const failures=[];
const check=(ok,type,detail)=>{if(!ok)failures.push({type,detail});};
let executionCount=0;
const dangerous=()=>{executionCount++;return 'executed';};

const prose=assessForeignCapability({note:'This tool is useful in ordinary prose.',claim:'Plugins can be discussed without becoming organs.'},{source:'adversarial-prose'});
check(prose.classification==='NOT_CAPABILITY_DESCRIPTOR'&&prose.status==='IGNORE','PROSE_FALSE_POSITIVE',prose);

const callable=assessForeignCapability(dangerous,{source:'callable-probe'});
check(callable.classification==='OPAQUE_CALLABLE'&&callable.status==='QUARANTINE','CALLABLE_NOT_QUARANTINED',callable);
check(executionCount===0,'CALLABLE_EXECUTED',{executionCount});

const payload=assessForeignCapability({
  capabilityName:'Foreign Search Adapter',
  provider:'example-provider',
  permissions:['public-web-read'],
  inputSchema:{query:'string'},
  outputSchema:{items:'array'},
  code:'console.log("must never run")'
});
check(payload.classification==='EXECUTABLE_PAYLOAD_PRESENT'&&payload.status==='QUARANTINE','EXECUTABLE_PAYLOAD_NOT_QUARANTINED',payload);
check(executionCount===0,'PAYLOAD_SIDE_EFFECT',{executionCount});

const missingProvenance=assessForeignCapability({
  capabilityName:'Unprovenanced Adapter',
  permissions:['read'],
  inputSchema:{q:'string'},
  outputSchema:{r:'array'}
});
check(missingProvenance.classification==='FOREIGN_CAPABILITY'&&missingProvenance.reason==='provenance-required-before-assimilation','MISSING_PROVENANCE_NOT_HELD',missingProvenance);

const missingPermissions=assessForeignCapability({
  capabilityName:'Permissionless Adapter',
  provider:'provider-a',
  inputSchema:{q:'string'},
  outputSchema:{r:'array'}
});
check(missingPermissions.reason==='permission-boundary-required-before-assimilation','MISSING_PERMISSION_BOUNDARY_NOT_HELD',missingPermissions);

const missingContract=assessForeignCapability({
  capabilityName:'Contractless Adapter',
  provider:'provider-b',
  permissions:['read']
});
check(missingContract.reason==='input-output-or-interface-contract-required-before-assimilation','MISSING_CONTRACT_NOT_HELD',missingContract);

const candidate=assessForeignCapability({
  capabilityName:'Bounded Evidence Adapter',
  type:'connector capability',
  provider:'provider-c',
  provenanceFingerprint:'sha256:redacted-example',
  permissions:['public-read-only'],
  inputSchema:{claim:'string'},
  outputSchema:{evidence:'array',provenance:'array'}
});
check(candidate.classification==='FOREIGN_CAPABILITY','COMPLETE_DESCRIPTOR_NOT_RECOGNIZED',candidate);
check(candidate.status==='HOLD','COMPLETE_DESCRIPTOR_PREMATURELY_ABSORBED',candidate);
check(candidate.assimilationStage==='CANDIDATE_FOR_ISOLATED_TEST','COMPLETE_DESCRIPTOR_WRONG_STAGE',candidate);
check(candidate.authorized===false&&candidate.executed===false,'ADMISSION_GRANTED_EXECUTION_OR_AUTHORIZATION',candidate);
check(candidate.hasProvenance&&candidate.hasPermissionBoundary&&candidate.hasContract,'ADMISSION_AUDIT_FLAGS_INCOMPLETE',candidate);
check(capabilityAdmissionBoundary.executesForeignCode===false&&capabilityAdmissionBoundary.installsCapability===false,'BOUNDARY_ALLOWS_EXECUTION',capabilityAdmissionBoundary);

const result={
  schema:'xenomorph-gut-capability-admission-test/v0.1',
  completedAt:new Date().toISOString(),
  status:failures.length?'FAIL':'PASS',
  capability:'FOREIGN_CAPABILITY_PRE_ASSIMILATION_ADMISSION_BOUNDARY',
  cases:{
    ordinaryProse:prose,
    callable,
    executablePayload:payload,
    missingProvenance,
    missingPermissions,
    missingContract,
    completeCandidate:candidate
  },
  executionCount,
  boundary:'This test verifies only deterministic pre-assimilation admission judgment. A structured foreign capability may become a candidate for isolated testing only when provenance, a permission boundary, and an interface/input-output contract are visible. Nothing in this layer executes, imports, installs, authorizes, fetches or absorbs the candidate into the XENOMORPH body. Plain prose mentioning tools/plugins is not a capability descriptor; executable payloads and callables are quarantined.' ,
  failures
};
await fs.writeFile('nostromo/integration/gut-capability-admission-last-result.json',JSON.stringify(result,null,2)+'\n','utf8');
console.log(JSON.stringify(result,null,2));
if(failures.length)process.exit(1);
