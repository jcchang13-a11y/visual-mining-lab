import assert from 'node:assert/strict';
import {createRuntimeState,runTask,runAblationPair,registerCandidate,evaluatePromotion,promoteCandidate,behavioralProjection} from './body-router.mjs';

const state=createRuntimeState({stableCapabilities:[{id:'baseline'}]});
assert.equal(state.ingestionPolicy.rule,'EDIBLE_DOES_NOT_IMPLY_ABSORBABLE');
assert.equal(state.promotionGate.required.includes('usefulness_validated'),true);

const result=await runTask({task:{kind:'probe',payload:'same-input'},state,stableExecutor:async()=>({answer:'stable-answer',mutated:false}),growingExecutor:async({body})=>{body.candidates.push({id:'illegal-shadow-mutation'});return {answer:'experimental-answer'};}});
assert.equal(result.official.answer,'stable-answer'); assert.equal(state.stable.capabilities.length,1); assert.equal(state.growing.candidates.length,0); assert.equal(result.comparison.differs,true); assert.equal(result.comparison.authority,'SHADOW_HAS_NO_OUTPUT_AUTHORITY');

const envelopeOnlyState=createRuntimeState({stableCapabilities:[{id:'baseline'}]});
const envelopeOnly=await runTask({task:{kind:'probe',payload:'identical-behavior'},state:envelopeOnlyState,stableExecutor:async({mode})=>({schema:'envelope',mode,authority:'OFFICIAL_STABLE_OUTPUT',result:{answer:'same',route:['a','b']}}),growingExecutor:async({mode})=>({schema:'envelope',mode,authority:'SHADOW_ONLY_NO_OUTPUT_AUTHORITY',result:{answer:'same',route:['a','b']}})});
assert.notEqual(envelopeOnly.comparison.stableEnvelopeFingerprint,envelopeOnly.comparison.shadowEnvelopeFingerprint); assert.equal(envelopeOnly.comparison.stableBehaviorFingerprint,envelopeOnly.comparison.shadowBehaviorFingerprint); assert.equal(envelopeOnly.comparison.differs,false); assert.deepEqual(behavioralProjection(envelopeOnly.official),{answer:'same',route:['a','b']});

const keyOrderState=createRuntimeState({stableCapabilities:[{id:'baseline'}]});
const keyOrderOnly=await runTask({task:{kind:'probe',payload:'key-order'},state:keyOrderState,stableExecutor:async()=>({result:{answer:'same',metrics:{coverage:4,similarity:0.91}}}),growingExecutor:async()=>({result:{metrics:{similarity:0.91,coverage:4},answer:'same'}})});
assert.equal(keyOrderOnly.comparison.differs,false,'object key insertion order is not behavioral divergence');

registerCandidate(state,{id:'candidate-1',kind:'route',payload:{routeBias:'retain-provenance'},evidence:{isolated_generation:true,stress:true,provenance:true,cross_organ:true,regression:true,held_out:true,usefulness_validated:false,cross_food_transfer:false,delayed_retest:true}});
let gate=evaluatePromotion(state,'candidate-1'); assert.equal(gate.promotable,false); assert.deepEqual(gate.missing,['usefulness_validated','cross_food_transfer']);
assert.throws(()=>promoteCandidate(state,'candidate-1'),/DIRECT_PROMOTION_DISABLED:USE_GUARDED_INCORPORATION/);

const ablation=await runAblationPair({task:{kind:'held-out',payload:'orthogonal-food'},state,candidateId:'candidate-1',executor:async({body,candidate})=>({result:{route:body.candidates.some(x=>x.id==='candidate-1')?'candidate-route':'control-route',candidateSeen:Boolean(candidate)}})});
assert.equal(ablation.control.result.route,'control-route'); assert.equal(ablation.exposed.result.route,'candidate-route'); assert.equal(ablation.receipt.causalEffectObserved,true); assert.equal(ablation.receipt.authority,'ABLATION_HAS_NO_STABLE_OUTPUT_AUTHORITY'); assert.equal(state.stable.capabilities.length,1); assert.equal(state.shadow.ablationReceipts.length,1);

const ablationEnvelopeState=createRuntimeState({stableCapabilities:[{id:'baseline'}],candidates:[{id:'candidate-envelope',evidence:{}}]});
const ablationEnvelopeOnly=await runAblationPair({task:{kind:'held-out',payload:'envelope-only'},state:ablationEnvelopeState,candidateId:'candidate-envelope',executor:async({mode})=>mode==='ablation-control'?{mode,authority:'CONTROL',result:{answer:'same',metrics:{a:1,b:2}}}:{authority:'EXPOSED',mode,result:{metrics:{b:2,a:1},answer:'same'}}});
assert.notEqual(ablationEnvelopeOnly.receipt.controlEnvelopeFingerprint,ablationEnvelopeOnly.receipt.exposedEnvelopeFingerprint); assert.equal(ablationEnvelopeOnly.receipt.controlFingerprint,ablationEnvelopeOnly.receipt.exposedFingerprint); assert.equal(ablationEnvelopeOnly.receipt.causalEffectObserved,false,'envelope/key-order-only ablation difference is not causal evidence');

state.growing.candidates[0].evidence.cross_food_transfer=true;
gate=evaluatePromotion(state,'candidate-1'); assert.equal(gate.promotable,false); assert.deepEqual(gate.missing,['usefulness_validated']);
state.growing.candidates[0].evidence.usefulness_validated=true;
gate=evaluatePromotion(state,'candidate-1'); assert.equal(gate.promotable,true);
assert.throws(()=>promoteCandidate(state,'candidate-1'),/DIRECT_PROMOTION_DISABLED:USE_GUARDED_INCORPORATION/); assert.equal(state.stable.capabilities.some(x=>x.id==='candidate-1'),false); assert.equal(state.growing.candidates[0].status,'candidate');

console.log(JSON.stringify({status:'PASS',stableRevision:state.stable.revision,growingRevision:state.growing.revision,shadowRevision:state.shadow.revision,ablationReceipts:state.shadow.ablationReceipts.length,envelopeOnlyDifferenceRejected:!envelopeOnly.comparison.differs,keyOrderDifferenceRejected:!keyOrderOnly.comparison.differs,ablationEnvelopeFalseEffectRejected:!ablationEnvelopeOnly.receipt.causalEffectObserved,gate:'9/9_QUALIFICATION_ONLY_INCLUDING_USEFULNESS',directPromotion:'DISABLED',ingestionRule:state.ingestionPolicy.rule},null,2));
