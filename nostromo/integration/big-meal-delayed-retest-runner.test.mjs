import test from 'node:test';
import assert from 'node:assert/strict';
import {deriveStructuralRoutingCandidate} from './big-meal-ablation-probe.mjs';

const prior={
  mealId:'prior-fixture',
  provenance:{sourceSha256:'prior-sha'},
  muther:{affinities:[
    {a:0,b:2,similarity:0.42},{a:1,b:5,similarity:0.40},{a:2,b:8,similarity:0.37},
    {a:3,b:6,similarity:0.35},{a:4,b:10,similarity:0.34},{a:5,b:9,similarity:0.31}
  ]}
};

test('candidate identity is deterministic across delayed derivation from the same provenance and topology',()=>{
  const first=deriveStructuralRoutingCandidate(prior);
  const later=deriveStructuralRoutingCandidate(JSON.parse(JSON.stringify(prior)));
  assert.equal(first.id,later.id);
  assert.deepEqual(first.parameters,later.parameters);
  assert.equal(first.sourceSha256,'prior-sha');
  assert.equal(first.boundary.includes('NO SOURCE TEXT'),true);
});

test('candidate identity changes when retained topology changes',()=>{
  const first=deriveStructuralRoutingCandidate(prior);
  const changed=JSON.parse(JSON.stringify(prior));
  changed.muther.affinities[0].similarity=0.91;
  const second=deriveStructuralRoutingCandidate(changed);
  assert.notEqual(first.id,second.id);
});
