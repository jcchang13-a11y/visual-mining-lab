import assert from 'node:assert/strict';
import {auditStableRegistry,CURRENT_REQUIRED_EVIDENCE} from './stable-registry-audit.mjs';

assert.equal(CURRENT_REQUIRED_EVIDENCE.length,9);
const base={revision:1,capabilities:[{
  id:'historical-p0.5',authority:'STABLE',incorporatedAt:'2026-09-14T18:32:01.554Z',
  evidence:{stress:true,provenance:true,cross_organ:true,regression:true,held_out:true,usefulness_validated:true,cross_food_transfer:true,delayed_retest:true}
}]};

const historical=auditStableRegistry(base,{attestations:[]});
assert.equal(historical.allCurrentGateEvidencePresent,false);
assert.equal(historical.allFullyRequalifiedUnderCurrentGate,false);
assert.deepEqual(historical.entries[0].missingCurrentEvidence,['isolated_generation']);
assert.match(historical.entries[0].interpretation,/DO NOT INVENT OR BACKFILL EVIDENCE/);

const partlyRequalified=auditStableRegistry(base,{attestations:[{
  candidateId:'historical-p0.5',evidence:{isolated_generation:true},historicalRegistryMutation:false
}]});
assert.equal(partlyRequalified.allCurrentGateEvidencePresent,true);
assert.equal(partlyRequalified.allFullyRequalifiedUnderCurrentGate,false);
assert.deepEqual(partlyRequalified.entries[0].missingCurrentEvidence,[]);
assert.deepEqual(partlyRequalified.entries[0].freshlyRequalifiedEvidence,['isolated_generation']);
assert.equal(partlyRequalified.entries[0].missingFreshRequalification.length,8);
assert.match(partlyRequalified.entries[0].interpretation,/NOT ALL GATES HAVE FRESH/);
assert.equal(base.capabilities[0].evidence.isolated_generation,undefined);
assert.equal(partlyRequalified.entries[0].historicalEvidenceUnmodified,true);

const freshAll=Object.fromEntries(CURRENT_REQUIRED_EVIDENCE.map(key=>[key,true]));
const fullyRequalified=auditStableRegistry(base,{attestations:[{
  candidateId:'historical-p0.5',evidence:freshAll,historicalRegistryMutation:false
}]});
assert.equal(fullyRequalified.allCurrentGateEvidencePresent,true);
assert.equal(fullyRequalified.allFullyRequalifiedUnderCurrentGate,true);
assert.deepEqual(fullyRequalified.entries[0].missingFreshRequalification,[]);

console.log(JSON.stringify({status:'PASS',rule:'EVIDENCE_PRESENCE_MUST_NOT_MASQUERADE_AS_FULL_FRESH_REQUALIFICATION'},null,2));
