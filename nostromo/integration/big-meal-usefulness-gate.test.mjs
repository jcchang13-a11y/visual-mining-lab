import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluateHeldoutUsefulness,evaluateCrossFoodUsefulness} from './big-meal-usefulness-gate.mjs';

const heldout=({mealId='x',controlCoverage=10,exposedCoverage=12,controlSimilarity=0.7,exposedSimilarity=0.695,causal=true,stable=true}={})=>({
  mealId,
  controlRoute:{uniqueChunkCoverage:controlCoverage,meanSimilarity:controlSimilarity},
  exposedRoute:{uniqueChunkCoverage:exposedCoverage,meanSimilarity:exposedSimilarity},
  receipt:{causalEffectObserved:causal},
  stableUnchanged:stable
});

test('passes a non-degrading positive structural gain',()=>{
  const x=evaluateHeldoutUsefulness(heldout());
  assert.equal(x.passed,true);
  assert.equal(x.reason,'PARETO_USEFUL_STRUCTURAL_CHANGE');
});

test('rejects a durable difference that only degrades routing',()=>{
  const x=evaluateHeldoutUsefulness(heldout({exposedCoverage:10,exposedSimilarity:0.66}));
  assert.equal(x.passed,false);
  assert.equal(x.reason,'DEGRADING_ROUTING_BIAS');
});

test('rejects difference without positive utility',()=>{
  const x=evaluateHeldoutUsefulness(heldout({exposedCoverage:10,exposedSimilarity:0.699}));
  assert.equal(x.passed,false);
  assert.equal(x.reason,'DIFFERENT_WITHOUT_POSITIVE_UTILITY');
});

test('cross-food gate requires at least two unlike heldouts and all must pass',()=>{
  const pass=evaluateCrossFoodUsefulness({candidateId:'c',heldouts:[heldout({mealId:'a'}),heldout({mealId:'b',exposedCoverage:11})]});
  assert.equal(pass.crossFoodUsefulnessPassed,true);
  assert.equal(pass.promotion.promotable,false);
  const fail=evaluateCrossFoodUsefulness({candidateId:'c',heldouts:[heldout({mealId:'a'}),heldout({mealId:'b',exposedCoverage:10,exposedSimilarity:0.699})]});
  assert.equal(fail.crossFoodUsefulnessPassed,false);
});
