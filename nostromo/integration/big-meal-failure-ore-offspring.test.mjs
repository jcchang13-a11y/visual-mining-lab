import test from 'node:test';
import assert from 'node:assert/strict';
import {deriveStructuralRoutingCandidate,runMealTopologyAblation} from './big-meal-ablation-probe.mjs';
import {deriveFailureOreChild} from './big-meal-failure-ore-offspring.mjs';

const prior={
  mealId:'prior-meal',
  provenance:{sourceSha256:'prior-sha'},
  muther:{affinities:[
    {a:0,b:1,similarity:0.9},{a:0,b:3,similarity:0.8},{a:1,b:4,similarity:0.7},{a:2,b:5,similarity:0.6}
  ]}
};
const heldout={
  mealId:'heldout-meal',
  provenance:{sourceSha256:'heldout-sha'},
  muther:{affinities:Array.from({length:20},(_,i)=>({a:i%8,b:(i*3+1)%9,similarity:0.95-(i*0.02)}))}
};

test('rejected usefulness receipt becomes provenance-bound failure ore, not decoration',()=>{
  const parent=deriveStructuralRoutingCandidate(prior);
  const parentFailure={mealId:'development-food',passed:false,reason:'DEGRADING_ROUTING_BIAS',deltas:{similarityDelta:-0.010166}};
  const {child,activation}=deriveFailureOreChild({parentCandidate:parent,parentFailure,pressureScale:0.75});
  assert.equal(activation.status,'SANDBOX_CANDIDATE');
  assert.equal(activation.failureOreActivated,true);
  assert.equal(activation.incorporationAuthorized,false);
  assert.equal(child.parameters.pressureScale,0.75);
  assert.equal(child.evidence.failure_ore,true);
  assert.equal(child.evidence.delayed_retest,false);
  assert.match(child.id,/ore-p0_75$/);
});

test('bounded failure-ore child runs only in ablation and cannot modify Stable',async()=>{
  const parent=deriveStructuralRoutingCandidate(prior);
  const parentFailure={mealId:'development-food',passed:false,reason:'DEGRADING_ROUTING_BIAS',deltas:{similarityDelta:-0.010166}};
  const {child}=deriveFailureOreChild({parentCandidate:parent,parentFailure,pressureScale:0.5});
  const result=await runMealTopologyAblation({priorMealResult:prior,heldoutMealResult:heldout,candidateOverride:child});
  assert.equal(result.candidate.id,child.id);
  assert.equal(result.candidate.parameters.pressureScale,0.5);
  assert.equal(result.stableUnchanged,true);
  assert.equal(result.promotion.promotable,false);
});

test('offspring pressure cannot escape bounded structural range',async()=>{
  const parent=deriveStructuralRoutingCandidate(prior);
  const bad={...parent,id:'bad-child',parameters:{...parent.parameters,pressureScale:3}};
  await assert.rejects(()=>runMealTopologyAblation({priorMealResult:prior,heldoutMealResult:heldout,candidateOverride:bad}),/PRESSURE_SCALE_OUT_OF_BOUNDS/);
});
