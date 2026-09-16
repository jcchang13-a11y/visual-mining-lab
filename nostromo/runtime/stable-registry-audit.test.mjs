import assert from 'node:assert/strict';
import {auditStableRegistry,CURRENT_REQUIRED_EVIDENCE} from './stable-registry-audit.mjs';

assert.equal(CURRENT_REQUIRED_EVIDENCE.length,9);
const base={revision:1,capabilities:[{
  id:'historical-p0.5',authority:'STABLE',incorporatedAt:'2026-09-14T18:32:01.554Z',
  evidence:{stress:true,provenance:true,cross_organ:true,regression:true,held_out:true,usefulness_validated:true,cross_food_transfer:true,delayed_retest:true}
}]};

const historical=auditStableRegistry(base,{attestations:[]});
assert.equal(historical.allCurrentGateSatisfied,false);
assert.deepEqual(historical.entries[0].missingCurrentEvidence,['isolated_generation']);
assert.match(historical.entries[0].interpretation,/DO NOT INVENT OR BACKFILL EVIDENCE/);

const requalified=auditStableRegistry(base,{attestations:[{
  candidateId:'historical-p0.5',evidence:{isolated_generation:true},historicalRegistryMutation:false
}]});
assert.equal(requalified.allCurrentGateSatisfied,true);
assert.deepEqual(requalified.entries[0].missingCurrentEvidence,[]);
assert.equal(requalified.entries[0].evidenceSources.isolated_generation,'POST_INCORPORATION_REQUALIFICATION_ATTESTATION');
assert.equal(base.capabilities[0].evidence.isolated_generation,undefined);
assert.equal(requalified.entries[0].historicalEvidenceUnmodified,true);

const current=auditStableRegistry({revision:2,capabilities:[{
  id:'current',authority:'STABLE',evidence:Object.fromEntries(CURRENT_REQUIRED_EVIDENCE.map(key=>[key,true]))
}]},{attestations:[]});
assert.equal(current.allCurrentGateSatisfied,true);
assert.deepEqual(current.entries[0].missingCurrentEvidence,[]);

console.log(JSON.stringify({status:'PASS',rule:'FRESH_REQUALIFICATION_MAY_SATISFY_CURRENT_GATE_WITHOUT_REWRITING_HISTORICAL_EVIDENCE'},null,2));
