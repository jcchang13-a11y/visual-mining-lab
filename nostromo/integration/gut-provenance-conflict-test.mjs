import assert from 'node:assert/strict';
import {assessForeignCapability,assessForeignCapabilityJson,capabilityAdmissionBoundary} from '../gut/capability-admission.mjs';
import {runHeldoutCrossOrganStress} from '../gut/capability-heldout-stress.mjs';

const baseCandidate={
  capabilityName:'Bounded Evidence Adapter',
  adapterId:'bounded-evidence',
  type:'connector capability',
  provider:'example-provider',
  source:'public-evidence-feed',
  provenanceFingerprint:'sha256:trusted-fingerprint',
  permissions:['public-read-only'],
  inputSchema:{claim:'string'},
  outputSchema:{evidence:'array'},
  contract:{outputType:'object'}
};

// Unit: matching host provenance keeps the candidate eligible for isolated testing.
const matching=assessForeignCapability(baseCandidate,{
  source:'public-evidence-feed',
  provenanceFingerprint:'sha256:trusted-fingerprint'
});
assert.equal(matching.classification,'FOREIGN_CAPABILITY');
assert.equal(matching.assimilationStage,'CANDIDATE_FOR_ISOLATED_TEST');

// Adversarial: a candidate may not overwrite or contradict host-observed provenance.
const conflicting=assessForeignCapability(baseCandidate,{
  source:'public-evidence-feed',
  provenanceFingerprint:'sha256:host-observed-different'
});
assert.equal(conflicting.status,'QUARANTINE');
assert.equal(conflicting.classification,'PROVENANCE_CONFLICT');
assert.equal(conflicting.assimilationStage,'CANDIDATE_QUARANTINED');
assert.equal(conflicting.conflictField,'provenanceFingerprint');
assert.equal(conflicting.declaredProvenance,'sha256:trusted-fingerprint');
assert.equal(conflicting.hostProvenance,'sha256:host-observed-different');

const conflictingSource=assessForeignCapabilityJson(JSON.stringify(baseCandidate),{
  source:'different-host-source',
  provenanceFingerprint:'sha256:trusted-fingerprint'
});
assert.equal(conflictingSource.status,'QUARANTINE');
assert.equal(conflictingSource.classification,'PROVENANCE_CONFLICT');
assert.equal(conflictingSource.conflictField,'source');
assert.equal(conflictingSource.trustBoundary,'UNTRUSTED_SERIALIZED_JSON');

// Cross-organ regression: matching provenance can still reach held-out downstream behavior,
// while conflicting provenance is stopped before any host-registered adapter or organ executes.
let adapterExecutions=0;
let organExecutions=0;
const capabilityRegistry={
  'bounded-evidence': input=>{
    adapterExecutions++;
    return {signal:'counterevidence',claim:input.claim};
  }
};
const organRegistry={
  VAJRA: ({foreignSignal})=>{
    organExecutions++;
    return {route:foreignSignal?.signal==='counterevidence'?'CHALLENGE':'HOLD'};
  }
};
const heldout=runHeldoutCrossOrganStress(baseCandidate,{claim:'A'},{
  capabilityRegistry,
  organRegistry,
  downstreamOrganId:'VAJRA',
  context:{source:'public-evidence-feed',provenanceFingerprint:'sha256:trusted-fingerprint'}
});
assert.equal(heldout.status,'PASS');
assert.equal(heldout.behaviorChanged,true);
assert.ok(adapterExecutions>0);
assert.ok(organExecutions>0);

adapterExecutions=0;
organExecutions=0;
const blockedAdmission=assessForeignCapability(baseCandidate,{
  source:'public-evidence-feed',
  provenanceFingerprint:'sha256:host-observed-different'
});
if(blockedAdmission.assimilationStage==='CANDIDATE_FOR_ISOLATED_TEST'){
  runHeldoutCrossOrganStress(baseCandidate,{claim:'A'},{capabilityRegistry,organRegistry,downstreamOrganId:'VAJRA'});
}
assert.equal(adapterExecutions,0);
assert.equal(organExecutions,0);
assert.equal(capabilityAdmissionBoundary.quarantinesConflictingHostAndCandidateProvenance,true);
assert.equal(capabilityAdmissionBoundary.version,'0.5');

console.log(JSON.stringify({
  schema:'zenomorph-gut-provenance-conflict-test/v0.1',
  status:'PASS',
  unit:'matching provenance remains sandbox-eligible',
  adversarial:'conflicting provenance is quarantined with both values preserved',
  crossOrgan:'conflict blocks execution; matching provenance still changes held-out VAJRA behavior',
  bodyAdmission:false,
  persistentMutation:false
},null,2));
