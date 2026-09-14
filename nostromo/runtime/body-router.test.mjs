import assert from 'node:assert/strict';
import {createRuntimeState,runTask,runAblationPair,registerCandidate,evaluatePromotion,promoteCandidate} from './body-router.mjs';

const state=createRuntimeState({stableCapabilities:[{id:'baseline'}]});
assert.equal(state.ingestionPolicy.rule,'EDIBLE_DOES_NOT_IMPLY_ABSORBABLE');

const result=await runTask({
  task:{kind:'probe',payload:'same-input'},
  state,
  stableExecutor:async()=>({answer:'stable-answer',mutated:false}),
  growingExecutor:async({body})=>{body.candidates.push({id:'illegal-shadow-mutation'});return {answer:'experimental-answer'};}
});

assert.equal(result.official.answer,'stable-answer');
assert.equal(state.stable.capabilities.length,1,'shadow must not mutate stable body');
assert.equal(state.growing.candidates.length,0,'shadow works on a clone, not live growing state');
assert.equal(result.comparison.differs,true);
assert.equal(result.comparison.authority,'SHADOW_HAS_NO_OUTPUT_AUTHORITY');

registerCandidate(state,{id:'candidate-1',kind:'route',payload:{routeBias:'retain-provenance'},evidence:{
  isolated_generation:true,
  stress:true,
  provenance:true,
  cross_organ:true,
  regression:true,
  held_out:true,
  cross_food_transfer:false,
  delayed_retest:true
}});
let gate=evaluatePromotion(state,'candidate-1');
assert.equal(gate.promotable,false);
assert.deepEqual(gate.missing,['cross_food_transfer']);
assert.equal(gate.rule,'EDIBLE_DOES_NOT_IMPLY_ABSORBABLE');
assert.throws(()=>promoteCandidate(state,'candidate-1'),/DIRECT_PROMOTION_DISABLED:USE_GUARDED_INCORPORATION/);

const ablation=await runAblationPair({
  task:{kind:'held-out',payload:'orthogonal-food'},
  state,
  candidateId:'candidate-1',
  executor:async({body,candidate})=>({
    route:body.candidates.some(x=>x.id==='candidate-1')?'candidate-route':'control-route',
    candidateSeen:Boolean(candidate)
  })
});
assert.equal(ablation.control.route,'control-route');
assert.equal(ablation.exposed.route,'candidate-route');
assert.equal(ablation.receipt.causalEffectObserved,true);
assert.equal(ablation.receipt.authority,'ABLATION_HAS_NO_STABLE_OUTPUT_AUTHORITY');
assert.equal(state.stable.capabilities.length,1,'ablation cannot mutate stable body');
assert.equal(state.shadow.ablationReceipts.length,1);

state.growing.candidates[0].evidence.cross_food_transfer=true;
gate=evaluatePromotion(state,'candidate-1');
assert.equal(gate.promotable,true,'8/8 means qualified for guarded promotion receipt, not direct Stable mutation');
assert.throws(()=>promoteCandidate(state,'candidate-1'),/DIRECT_PROMOTION_DISABLED:USE_GUARDED_INCORPORATION/);
assert.equal(state.stable.capabilities.some(x=>x.id==='candidate-1'),false,'qualified candidate cannot enter Stable through legacy runtime helper');
assert.equal(state.growing.candidates[0].status,'candidate');

console.log(JSON.stringify({status:'PASS',stableRevision:state.stable.revision,growingRevision:state.growing.revision,shadowRevision:state.shadow.revision,ablationReceipts:state.shadow.ablationReceipts.length,gate:'8/8_QUALIFICATION_ONLY',directPromotion:'DISABLED',ingestionRule:state.ingestionPolicy.rule},null,2));
