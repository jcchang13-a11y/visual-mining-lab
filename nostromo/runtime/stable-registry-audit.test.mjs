import assert from 'node:assert/strict';
import {auditStableRegistry,CURRENT_REQUIRED_EVIDENCE} from './stable-registry-audit.mjs';

assert.equal(CURRENT_REQUIRED_EVIDENCE.length,9);

const historical=auditStableRegistry({revision:1,capabilities:[{
  id:'historical-p0.5',authority:'STABLE',incorporatedAt:'2026-09-14T18:32:01.554Z',
  evidence:{stress:true,provenance:true,cross_organ:true,regression:true,held_out:true,usefulness_validated:true,cross_food_transfer:true,delayed_retest:true}
}]});
assert.equal(historical.allCurrentGateSatisfied,false);
assert.deepEqual(historical.entries[0].missingCurrentEvidence,['isolated_generation']);
assert.match(historical.entries[0].interpretation,/DO NOT INVENT OR BACKFILL EVIDENCE/);

const current=auditStableRegistry({revision:2,capabilities:[{
  id:'current',authority:'STABLE',evidence:Object.fromEntries(CURRENT_REQUIRED_EVIDENCE.map(key=>[key,true]))
}]});
assert.equal(current.allCurrentGateSatisfied,true);
assert.deepEqual(current.entries[0].missingCurrentEvidence,[]);

console.log(JSON.stringify({status:'PASS',rule:'HISTORICAL_STABLE_AUTHORITY_DOES_NOT_IMPLY_CURRENT_9_OF_9_QUALIFICATION',historicalMissing:historical.entries[0].missingCurrentEvidence},null,2));
