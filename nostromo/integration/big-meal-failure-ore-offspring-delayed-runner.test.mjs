import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluateOffspringDelayedRetention} from './big-meal-failure-ore-offspring-delayed-runner.mjs';

const candidateId='parent-ore-p0_5';
function foods(){
  return {
    prior:{mealId:'prior',sourceSha256:'p'},
    development:{mealId:'dev',sourceSha256:'d'},
    validation:[{mealId:'v1',sourceSha256:'1'},{mealId:'v2',sourceSha256:'2'}]
  };
}
function fixture(){
  const frozenFoods=foods();
  const freshFoods=foods();
  return {
    frozenReceipt:{
      offspring:{candidateId,pressureScale:0.5},stableUnchanged:true,
      promotion:{delayed_retest:false},foodIdentity:frozenFoods
    },
    freshRound:{
      selected:{
        candidate:{id:candidateId,parameters:{pressureScale:0.5},evidence:{delayed_retest:false}},
        failureOreActivation:{failureOreActivated:true},developmentUsefulness:{passed:true}
      },
      foodRoles:freshFoods,offspringCrossFoodUsefulnessPassed:true,validationHeldoutCount:2,
      validation:{foods:[{passed:true},{passed:true}]},stableUnchanged:true
    }
  };
}

test('passes only when same offspring independently returns useful and Stable unchanged',()=>{
  const result=evaluateOffspringDelayedRetention(fixture());
  assert.equal(result.delayedRetentionPassed,true);
  assert.equal(result.promotion.delayed_retest,true);
  assert.equal(result.promotion.usefulness_validated,true);
  assert.equal(result.promotion.promotable,false);
  assert.equal(result.promotion.incorporated,false);
});

test('cannot inherit delayed evidence from frozen parent/offspring receipt',()=>{
  const x=fixture(); x.frozenReceipt.promotion.delayed_retest=true;
  const result=evaluateOffspringDelayedRetention(x);
  assert.equal(result.parentDelayedEvidenceNotInherited,false);
  assert.equal(result.delayedRetentionPassed,false);
});

test('fails on identity drift, validation degradation, food drift, or Stable mutation',()=>{
  for(const mutate of [
    x=>{x.freshRound.selected.candidate.id='different-child';},
    x=>{x.freshRound.validation.foods[1].passed=false;},
    x=>{x.freshRound.foodRoles.validation[1].sourceSha256='changed';},
    x=>{x.freshRound.stableUnchanged=false;}
  ]){
    const x=fixture(); mutate(x);
    assert.equal(evaluateOffspringDelayedRetention(x).delayedRetentionPassed,false);
  }
});
