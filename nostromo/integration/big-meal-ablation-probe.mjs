// ZENOMORPH big-meal causal bridge v0.1.0
// Converts only content-agnostic MUTHER topology from a prior meal into a Growing candidate,
// then tests that candidate absent vs present on the same held-out meal. No Stable authority.
import crypto from 'node:crypto';
import {
  createRuntimeState,
  registerCandidate,
  runAblationPair,
  evaluatePromotion
} from '../runtime/body-router.mjs';

const sha=value=>crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
const median=values=>{
  const xs=values.filter(Number.isFinite).sort((a,b)=>a-b);
  if(!xs.length)return 0;
  const m=Math.floor(xs.length/2);
  return xs.length%2?xs[m]:(xs[m-1]+xs[m])/2;
};
const mean=values=>values.length?values.reduce((a,b)=>a+b,0)/values.length:0;

export function deriveStructuralRoutingCandidate(priorMealResult){
  const affinities=priorMealResult?.muther?.affinities;
  if(!Array.isArray(affinities)||!affinities.length) throw new Error('PRIOR_MEAL_AFFINITIES_REQUIRED');
  const similarities=affinities.map(x=>Number(x.similarity)).filter(Number.isFinite);
  const spans=affinities.map(x=>Math.abs(Number(x.b)-Number(x.a))).filter(Number.isFinite);
  if(!similarities.length||!spans.length) throw new Error('PRIOR_MEAL_TOPOLOGY_INVALID');
  const candidate={
    id:`meal-topology-${String(priorMealResult.mealId||'prior')}-${sha({similarities,spans}).slice(0,12)}`,
    kind:'MUTHER_AFFINITY_TOPOLOGY_ROUTING_PRIOR',
    sourceMealId:priorMealResult.mealId||null,
    sourceSha256:priorMealResult?.provenance?.sourceSha256||null,
    parameters:{
      similarityMedian:Number(median(similarities).toFixed(6)),
      spanMedian:Number(median(spans).toFixed(6)),
      affinityCount:affinities.length
    },
    boundary:'CONTENT_AGNOSTIC STRUCTURAL PRIOR ONLY. NO SOURCE TEXT, TOPIC LABEL, CLAIM, SUMMARY OR SEMANTIC HINT IS RETAINED.',
    evidence:{
      isolated_generation:true,
      provenance:Boolean(priorMealResult?.provenance?.sourceSha256),
      stress:false,
      cross_organ:false,
      regression:false,
      held_out:false,
      cross_food_transfer:false,
      delayed_retest:false
    }
  };
  return candidate;
}

function defaultRoute(affinities,limit=12){
  return [...affinities]
    .sort((a,b)=>Number(b.similarity)-Number(a.similarity)||Number(a.a)-Number(b.a)||Number(a.b)-Number(b.b))
    .slice(0,limit);
}

function candidateRoute(affinities,candidate,limit=12){
  const simTarget=Number(candidate.parameters.similarityMedian)||0;
  const spanTarget=Math.max(1,Number(candidate.parameters.spanMedian)||1);
  return [...affinities]
    .map(edge=>{
      const similarity=Number(edge.similarity)||0;
      const span=Math.abs(Number(edge.b)-Number(edge.a));
      // Similarity still dominates; prior topology only changes the secondary routing pressure.
      const spanPenalty=Math.abs(span-spanTarget)/(spanTarget+1);
      const simPenalty=Math.abs(similarity-simTarget);
      const routingScore=similarity-(0.08*spanPenalty)-(0.04*simPenalty);
      return {...edge,routingScore:Number(routingScore.toFixed(8))};
    })
    .sort((a,b)=>b.routingScore-a.routingScore||Number(b.similarity)-Number(a.similarity)||Number(a.a)-Number(b.a))
    .slice(0,limit);
}

function routeSummary(edges){
  const pairIds=edges.map(x=>`${x.a}:${x.b}`);
  const spans=edges.map(x=>Math.abs(Number(x.b)-Number(x.a)));
  const similarities=edges.map(x=>Number(x.similarity)||0);
  const covered=new Set(edges.flatMap(x=>[Number(x.a),Number(x.b)]));
  return {
    pairIds,
    routeFingerprint:sha(pairIds),
    meanSimilarity:Number(mean(similarities).toFixed(6)),
    meanSpan:Number(mean(spans).toFixed(6)),
    uniqueChunkCoverage:covered.size
  };
}

export async function runMealTopologyAblation({priorMealResult,heldoutMealResult,state=null}={}){
  const heldAffinities=heldoutMealResult?.muther?.affinities;
  if(!Array.isArray(heldAffinities)||!heldAffinities.length) throw new Error('HELDOUT_MEAL_AFFINITIES_REQUIRED');
  const candidate=deriveStructuralRoutingCandidate(priorMealResult);
  const runtime=state||createRuntimeState();
  registerCandidate(runtime,candidate);
  const stableBefore=sha(runtime.stable);
  const task={
    kind:'HELDOUT_MUTHER_ROUTING',
    mealId:heldoutMealResult.mealId||null,
    sourceSha256:heldoutMealResult?.provenance?.sourceSha256||null,
    affinities:heldAffinities
  };
  const executor=async({task,candidate})=>{
    const selected=candidate?candidateRoute(task.affinities,candidate):defaultRoute(task.affinities);
    return {
      mealId:task.mealId,
      sourceSha256:task.sourceSha256,
      candidateApplied:Boolean(candidate),
      route:routeSummary(selected),
      authority:'SHADOW_ONLY_NO_STABLE_OUTPUT_AUTHORITY'
    };
  };
  const pair=await runAblationPair({task,state:runtime,candidateId:candidate.id,executor});
  const stableAfter=sha(runtime.stable);
  const promotion=evaluatePromotion(runtime,candidate.id);
  return {
    schema:'zenomorph-big-meal-ablation/v0.1',
    status:pair.receipt.causalEffectObserved?'CAUSAL_ROUTING_EFFECT_OBSERVED_NOT_TRANSFER_PROOF':'NO_CAUSAL_ROUTING_EFFECT_OBSERVED',
    candidate:{...candidate,evidence:{...candidate.evidence}},
    control:pair.control,
    exposed:pair.exposed,
    receipt:pair.receipt,
    stableUnchanged:stableBefore===stableAfter,
    promotion,
    interpretation:'A route difference proves only that the retained first-meal structural prior can causally alter held-out routing. It does NOT prove usefulness, learning, cross-food transfer, or promotion. cross_food_transfer remains false until independent robustness/usefulness criteria and delayed retest pass.'
  };
}
