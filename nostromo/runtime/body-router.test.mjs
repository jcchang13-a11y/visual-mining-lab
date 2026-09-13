import assert from 'node:assert/strict';
import {createRuntimeState,runTask,registerCandidate,evaluatePromotion,promoteCandidate} from './body-router.mjs';

const state=createRuntimeState({stableCapabilities:[{id:'baseline'}]});

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

registerCandidate(state,{id:'candidate-1',kind:'route',evidence:{
  isolated_generation:true,
  stress:true,
  provenance:true,
  cross_organ:true,
  regression:true,
  held_out:true,
  delayed_retest:false
}});
let gate=evaluatePromotion(state,'candidate-1');
assert.equal(gate.promotable,false);
assert.deepEqual(gate.missing,['delayed_retest']);
assert.throws(()=>promoteCandidate(state,'candidate-1'),/PROMOTION_BLOCKED/);

state.growing.candidates[0].evidence.delayed_retest=true;
gate=evaluatePromotion(state,'candidate-1');
assert.equal(gate.promotable,true);
promoteCandidate(state,'candidate-1');
assert.equal(state.stable.capabilities.some(x=>x.id==='candidate-1'),true);
assert.equal(state.growing.candidates[0].status,'incorporated');

console.log(JSON.stringify({status:'PASS',stableRevision:state.stable.revision,growingRevision:state.growing.revision,shadowRevision:state.shadow.revision,gate:'7/7'},null,2));
