// ZENOMORPH live cross-food causal runner v0.1.0
// Acquires two complete food bodies independently, then tests whether a content-agnostic
// structural candidate retained from the first meal causally changes routing on the second.
// No Stable authority; a routing difference is not transfer/promotion proof.
import fs from 'node:fs/promises';
import {runBigMeal} from './big-meal-runner.mjs';
import {runMealTopologyAblation} from './big-meal-ablation-probe.mjs';

export async function runLiveCrossFoodCausalProbe({
  priorManifest='nostromo/research/big-meals/pasquinelli-2026.json',
  heldoutManifest='nostromo/research/big-meals/heldout-rfc9110-http-semantics-2022.json',
  outputPath=null
}={}){
  const prior=await runBigMeal({manifestPath:priorManifest});
  const heldout=await runBigMeal({manifestPath:heldoutManifest});
  const ablation=await runMealTopologyAblation({priorMealResult:prior,heldoutMealResult:heldout});
  const result={
    schema:'zenomorph-live-cross-food-causal/v0.1',
    status:ablation.receipt?.causalEffectObserved?'LIVE_CAUSAL_ROUTING_EFFECT_OBSERVED_NOT_TRANSFER_PROOF':'LIVE_NO_CAUSAL_ROUTING_EFFECT_OBSERVED',
    observedAt:new Date().toISOString(),
    prior:{mealId:prior.mealId,sourceSha256:prior.provenance?.sourceSha256,mutherChunkCount:prior.muther?.chunkCount},
    heldout:{mealId:heldout.mealId,sourceSha256:heldout.provenance?.sourceSha256,mutherChunkCount:heldout.muther?.chunkCount},
    candidate:{id:ablation.candidate?.id,kind:ablation.candidate?.kind,parameters:ablation.candidate?.parameters,boundary:ablation.candidate?.boundary,evidence:ablation.candidate?.evidence},
    controlRoute:ablation.control?.route,
    exposedRoute:ablation.exposed?.route,
    receipt:ablation.receipt,
    stableUnchanged:ablation.stableUnchanged,
    promotion:ablation.promotion,
    interpretation:'This live probe establishes only whether a content-agnostic structural candidate derived from one complete food body can causally alter routing on an unlike complete held-out food. Usefulness, robustness, cross-food transfer and delayed retention remain separate gates.'
  };
  if(outputPath) await fs.writeFile(outputPath,JSON.stringify(result,null,2)+'\n','utf8');
  return result;
}

if(import.meta.url===`file://${process.argv[1]}`){
  const priorArg=process.argv.find(x=>x.startsWith('--prior='));
  const heldArg=process.argv.find(x=>x.startsWith('--heldout='));
  const outputArg=process.argv.find(x=>x.startsWith('--output='));
  const result=await runLiveCrossFoodCausalProbe({
    priorManifest:priorArg?priorArg.slice(8):undefined,
    heldoutManifest:heldArg?heldArg.slice(10):undefined,
    outputPath:outputArg?outputArg.slice(9):null
  });
  console.log(JSON.stringify(result,null,2));
}
