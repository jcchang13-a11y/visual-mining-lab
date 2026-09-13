import test from 'node:test';
import assert from 'node:assert/strict';
import {runMealTopologyAblation,deriveStructuralRoutingCandidate} from './big-meal-ablation-probe.mjs';

const prior={
  mealId:'pasquinelli-synthetic-fixture',
  provenance:{sourceSha256:'prior-sha'},
  muther:{affinities:[
    {a:0,b:2,similarity:0.42},{a:1,b:5,similarity:0.40},{a:2,b:8,similarity:0.37},
    {a:3,b:6,similarity:0.35},{a:4,b:10,similarity:0.34},{a:5,b:9,similarity:0.31}
  ]}
};

const heldout={
  mealId:'rfc9110-synthetic-fixture',
  provenance:{sourceSha256:'held-sha'},
  muther:{affinities:[
    {a:0,b:20,similarity:0.50},{a:1,b:19,similarity:0.49},{a:2,b:18,similarity:0.48},
    {a:3,b:7,similarity:0.475},{a:4,b:8,similarity:0.47},{a:5,b:9,similarity:0.465},
    {a:6,b:10,similarity:0.46},{a:7,b:11,similarity:0.455},{a:8,b:12,similarity:0.45},
    {a:9,b:13,similarity:0.445},{a:10,b:14,similarity:0.44},{a:11,b:15,similarity:0.435},
    {a:12,b:16,similarity:0.43},{a:13,b:17,similarity:0.425},{a:14,b:18,similarity:0.42}
  ]}
};

test('candidate retains topology and provenance but no source text or transfer claim',()=>{
  const candidate=deriveStructuralRoutingCandidate(prior);
  assert.equal(candidate.kind,'MUTHER_AFFINITY_TOPOLOGY_ROUTING_PRIOR');
  assert.equal(candidate.sourceSha256,'prior-sha');
  assert.equal(candidate.evidence.isolated_generation,true);
  assert.equal(candidate.evidence.provenance,true);
  assert.equal(candidate.evidence.cross_food_transfer,false);
  assert.equal(candidate.evidence.delayed_retest,false);
  assert.equal(JSON.stringify(candidate).includes('Machine, organism'),false);
});

test('same held-out task can be compared candidate absent vs present without Stable mutation',async()=>{
  const result=await runMealTopologyAblation({priorMealResult:prior,heldoutMealResult:heldout});
  assert.equal(result.stableUnchanged,true);
  assert.equal(result.control.candidateApplied,false);
  assert.equal(result.exposed.candidateApplied,true);
  assert.equal(result.receipt.causalEffectObserved,true);
  assert.notEqual(result.control.route.routeFingerprint,result.exposed.route.routeFingerprint);
  assert.equal(result.promotion.promotable,false);
  assert.ok(result.promotion.missing.includes('cross_food_transfer'));
  assert.ok(result.promotion.missing.includes('delayed_retest'));
  assert.equal(result.candidate.evidence.cross_food_transfer,false);
});
