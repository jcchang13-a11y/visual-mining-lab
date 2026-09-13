// ZENOMORPH delayed cross-food retention runner v0.1.0
// Re-acquires the prior meal and unlike held-out foods in a later execution,
// derives the same content-agnostic structural candidate again, and checks
// whether the same candidate identity still causes the same class of routing divergence.
// Passing this gate is delayed-retention evidence only; it is not usefulness or promotion proof.
import fs from 'node:fs/promises';
import {runBigMeal} from './big-meal-runner.mjs';
import {runMealTopologyAblation,deriveStructuralRoutingCandidate} from './big-meal-ablation-probe.mjs';

export async function runDelayedRetest({
  priorManifest='nostromo/research/big-meals/pasquinelli-2026.json',
  heldoutManifests=[
    'nostromo/research/big-meals/heldout-rfc9110-http-semantics-2022.json',
    'nostromo/research/big-meals/heldout-gutenberg-pride-prejudice-1813.json'
  ],
  expectedCandidateId=null,
  expectedPriorSha256=null,
  outputPath=null
}={}){
  const prior=await runBigMeal({manifestPath:priorManifest});
  const candidate=deriveStructuralRoutingCandidate(prior);
  const priorIdentityMatches=!expectedPriorSha256||prior.provenance?.sourceSha256===expectedPriorSha256;
  const candidateIdentityMatches=!expectedCandidateId||candidate.id===expectedCandidateId;

  const heldouts=[];
  for(const manifestPath of heldoutManifests){
    const meal=await runBigMeal({manifestPath});
    const ablation=await runMealTopologyAblation({priorMealResult:prior,heldoutMealResult:meal});
    heldouts.push({
      manifestPath,
      mealId:meal.mealId,
      sourceSha256:meal.provenance?.sourceSha256,
      candidateId:ablation.candidate?.id,
      causalEffectObserved:ablation.receipt?.causalEffectObserved===true,
      controlRouteFingerprint:ablation.control?.route?.routeFingerprint||null,
      exposedRouteFingerprint:ablation.exposed?.route?.routeFingerprint||null,
      stableUnchanged:ablation.stableUnchanged===true
    });
  }

  const sameCandidateAcrossHeldouts=heldouts.every(x=>x.candidateId===candidate.id);
  const causalEffectRetained=heldouts.length>=2&&heldouts.every(x=>x.causalEffectObserved===true);
  const stableUnchanged=heldouts.every(x=>x.stableUnchanged===true);
  const delayedRetentionPassed=priorIdentityMatches&&candidateIdentityMatches&&sameCandidateAcrossHeldouts&&causalEffectRetained&&stableUnchanged;

  const result={
    schema:'zenomorph-delayed-cross-food-retest/v0.1',
    status:delayedRetentionPassed?'DELAYED_CROSS_FOOD_CAUSAL_EFFECT_RETAINED_NOT_PROMOTION_PROOF':'DELAYED_RETENTION_NOT_ESTABLISHED',
    observedAt:new Date().toISOString(),
    prior:{mealId:prior.mealId,sourceSha256:prior.provenance?.sourceSha256},
    candidate:{id:candidate.id,kind:candidate.kind,parameters:candidate.parameters,boundary:candidate.boundary},
    expected:{candidateId:expectedCandidateId,priorSha256:expectedPriorSha256},
    priorIdentityMatches,
    candidateIdentityMatches,
    sameCandidateAcrossHeldouts,
    causalEffectRetained,
    stableUnchanged,
    delayedRetentionPassed,
    heldouts,
    promotion:{
      promotable:false,
      cross_food_transfer:false,
      delayed_retest:delayedRetentionPassed,
      usefulness_validated:false,
      reason:delayedRetentionPassed?'DELAYED_CAUSAL_RETENTION_OBSERVED_BUT_USEFULNESS_AND_FULL_PROMOTION_GATES_REMAIN':'DELAYED_RETENTION_NOT_ESTABLISHED'
    },
    interpretation:'A later independent execution reproduced the same content-agnostic candidate identity and its causal routing effect across unlike held-out foods. This is delayed-retention evidence only. It does not establish usefulness, semantic transfer, or Stable-worthy incorporation.'
  };
  if(outputPath) await fs.writeFile(outputPath,JSON.stringify(result,null,2)+'\n','utf8');
  return result;
}

if(import.meta.url===`file://${process.argv[1]}`){
  const outputArg=process.argv.find(x=>x.startsWith('--output='));
  const candidateArg=process.argv.find(x=>x.startsWith('--expected-candidate='));
  const priorShaArg=process.argv.find(x=>x.startsWith('--expected-prior-sha256='));
  const result=await runDelayedRetest({
    outputPath:outputArg?outputArg.slice(9):null,
    expectedCandidateId:candidateArg?candidateArg.slice('--expected-candidate='.length):null,
    expectedPriorSha256:priorShaArg?priorShaArg.slice('--expected-prior-sha256='.length):null
  });
  console.log(JSON.stringify(result,null,2));
}
