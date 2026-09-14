// ZENOMORPH big-meal usefulness gate v0.1.0
// A persistent causal routing difference is not enough. This gate asks whether the
// candidate produces a Pareto-useful structural route on unlike held-out foods.
// No Stable authority; failure means "stable bias", not "learning".

const finite=(x,fallback=0)=>Number.isFinite(Number(x))?Number(x):fallback;

export function evaluateHeldoutUsefulness(heldout,{maxSimilarityLoss=0.01,minCoverageGain=1,minSimilarityGain=0.002}={}){
  const control=heldout?.controlRoute||{};
  const exposed=heldout?.exposedRoute||{};
  const controlCoverage=finite(control.uniqueChunkCoverage);
  const exposedCoverage=finite(exposed.uniqueChunkCoverage);
  const controlSimilarity=finite(control.meanSimilarity);
  const exposedSimilarity=finite(exposed.meanSimilarity);
  const coverageDelta=exposedCoverage-controlCoverage;
  const similarityDelta=exposedSimilarity-controlSimilarity;
  const causalEffect=heldout?.receipt?.causalEffectObserved===true;
  const stableUnchanged=heldout?.stableUnchanged===true;
  const nonDegrading=coverageDelta>=0 && similarityDelta>=-Math.abs(maxSimilarityLoss);
  const positiveGain=coverageDelta>=minCoverageGain || similarityDelta>=minSimilarityGain;
  const passed=causalEffect && stableUnchanged && nonDegrading && positiveGain;
  return {
    mealId:heldout?.mealId||null,
    causalEffect,
    stableUnchanged,
    control:{uniqueChunkCoverage:controlCoverage,meanSimilarity:controlSimilarity},
    exposed:{uniqueChunkCoverage:exposedCoverage,meanSimilarity:exposedSimilarity},
    deltas:{coverageDelta,similarityDelta:Number(similarityDelta.toFixed(6))},
    thresholds:{maxSimilarityLoss,minCoverageGain,minSimilarityGain},
    nonDegrading,
    positiveGain,
    passed,
    reason:passed?'PARETO_USEFUL_STRUCTURAL_CHANGE':!causalEffect?'NO_CAUSAL_EFFECT':!stableUnchanged?'STABLE_CHANGED':!nonDegrading?'DEGRADING_ROUTING_BIAS':'DIFFERENT_WITHOUT_POSITIVE_UTILITY'
  };
}

export function evaluateCrossFoodUsefulness(robustness,options={}){
  const heldouts=Array.isArray(robustness?.heldouts)?robustness.heldouts:[];
  const results=heldouts.map(x=>evaluateHeldoutUsefulness(x,options));
  const passedCount=results.filter(x=>x.passed).length;
  const allPassed=results.length>=2 && passedCount===results.length;
  return {
    schema:'zenomorph-big-meal-usefulness/v0.1',
    candidateId:robustness?.candidateId||null,
    heldoutCount:results.length,
    passedCount,
    crossFoodUsefulnessPassed:allPassed,
    results,
    promotion:{
      promotable:false,
      usefulness:allPassed,
      reason:allPassed?'USEFULNESS_EVIDENCE_ESTABLISHED_BUT_OTHER_PROMOTION_GATES_REMAIN':'USEFULNESS_NOT_ESTABLISHED'
    },
    interpretation:allPassed
      ? 'The same candidate caused a non-degrading positive structural gain on every unlike held-out food. This is usefulness evidence only; it is not permission to modify Stable.'
      : 'A durable routing difference that fails this gate is treated as a stable bias, not useful learning. It must not be promoted.'
  };
}
