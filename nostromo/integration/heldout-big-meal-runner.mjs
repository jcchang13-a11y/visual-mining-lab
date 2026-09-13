// ZENOMORPH orthogonal held-out big-meal runner.
// Reuses the exact five-organ ingestion boundary used for the first formal meal.
import {runBigMeal} from './big-meal-runner.mjs';

const outputArg=process.argv.find(x=>x.startsWith('--output='));
const outputPath=outputArg?outputArg.slice(9):'zenomorph-heldout-big-meal-result.json';

const result=await runBigMeal({
  manifestPath:'nostromo/research/big-meals/heldout-concrete-sulfate-2024.json',
  outputPath
});

const wrapped={
  ...result,
  schema:'zenomorph-heldout-big-meal-result/v0.1',
  heldOut:true,
  comparisonBoundary:{
    priorMeal:'pasquinelli-2026-machine-organism-language',
    purpose:'CROSS_FOOD_BEHAVIOR_PROBE',
    evidenceAllowed:'Only behavioral/routing differences attributable to retained candidate machinery; topical overlap, summary similarity, shared vocabulary, and generic structural resemblance are not transfer evidence.',
    stableAdmission:false,
    delayedRetestRequired:true
  }
};

await import('node:fs/promises').then(({writeFile})=>writeFile(outputPath,JSON.stringify(wrapped,null,2)+'\n','utf8'));
console.log(JSON.stringify(wrapped,null,2));
