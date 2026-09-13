// ZENOMORPH multi-food causal robustness runner v0.1.0
// Tests the same content-agnostic structural candidate from one prior meal against two unlike held-out foods.
// Even repeated causal effects do not establish promotion; delayed retention and usefulness remain separate gates.
import fs from 'node:fs/promises';
import {runBigMeal} from './big-meal-runner.mjs';
import {runMealTopologyAblation} from './big-meal-ablation-probe.mjs';

export async function runCrossFoodRobustnessProbe({
  priorManifest='nostromo/research/big-meals/pasquinelli-2026.json',
  heldoutManifests=[
    'nostromo/research/big-meals/heldout-rfc9110-http-semantics-2022.json',
    'nostromo/research/big-meals/heldout-gutenberg-pride-prejudice-1813.json'
  ],
  outputPath=null
}={}){
  const prior=await runBigMeal({manifestPath:priorManifest});
  const heldouts=[];
  for(const manifestPath of heldoutManifests){
    const meal=await runBigMeal({manifestPath});
    const ablation=await runMealTopologyAblation({priorMealResult:prior,heldoutMealResult:meal});
    heldouts.push({
      manifestPath,
      mealId:meal.mealId,
      sourceSha256:meal.provenance?.sourceSha256,
      mutherChunkCount:meal.muther?.chunkCount,
      candidateId:ablation.candidate?.id,
      controlRoute:ablation.control?.route,
      exposedRoute:ablation.exposed?.route,
      receipt:ablation.receipt,
      stableUnchanged:ablation.stableUnchanged,
      promotion:ablation.promotion
    });
  }
  const candidateIds=[...new Set(heldouts.map(x=>x.candidateId).filter(Boolean))];
  const stableUnchanged=heldouts.every(x=>x.stableUnchanged===true);
  const causalEffects=heldouts.filter(x=>x.receipt?.causalEffectObserved===true).length;
  const sameCandidate=candidateIds.length===1;
  const crossFoodCausalRobustness=sameCandidate&&causalEffects===heldouts.length&&heldouts.length>=2;
  const result={
    schema:'zenomorph-cross-food-robustness/v0.1',
    status:crossFoodCausalRobustness?'MULTI_FOOD_CAUSAL_ROUTING_EFFECT_OBSERVED_NOT_TRANSFER_PROOF':'MULTI_FOOD_CAUSAL_ROBUSTNESS_NOT_ESTABLISHED',
    observedAt:new Date().toISOString(),
    prior:{mealId:prior.mealId,sourceSha256:prior.provenance?.sourceSha256,mutherChunkCount:prior.muther?.chunkCount},
    candidateId:candidateIds[0]||null,
    sameCandidate,
    heldouts,
    causalEffects,
    heldoutCount:heldouts.length,
    crossFoodCausalRobustness,
    stableUnchanged,
    promotion:{
      promotable:false,
      cross_food_transfer:false,
      delayed_retest:false,
      reason:crossFoodCausalRobustness?'REPEATED_CAUSAL_ROUTING_EFFECT_REQUIRES_DELAYED_RETENTION_AND_USEFULNESS_VALIDATION':'CROSS_FOOD_CAUSAL_ROBUSTNESS_NOT_ESTABLISHED'
    },
    interpretation:'This probe asks only whether the identical content-agnostic candidate can reproducibly alter routing on two unlike complete held-out foods. Repeated routing effects are stronger than a one-food ablation but still are not evidence of useful learning, durable transfer, or Stable-worthy incorporation.'
  };
  if(outputPath) await fs.writeFile(outputPath,JSON.stringify(result,null,2)+'\n','utf8');
  return result;
}

if(import.meta.url===`file://${process.argv[1]}`){
  const outputArg=process.argv.find(x=>x.startsWith('--output='));
  const result=await runCrossFoodRobustnessProbe({outputPath:outputArg?outputArg.slice(9):null});
  console.log(JSON.stringify(result,null,2));
}
