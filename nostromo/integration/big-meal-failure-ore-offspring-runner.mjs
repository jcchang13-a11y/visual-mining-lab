// ZENOMORPH live failure-ore offspring runner v0.1.0
// Uses RFC 9110 only as development pressure, then validates the selected structural offspring
// on narrative fiction and procedural/reference prose. No validation food participates in selection.
import fs from 'node:fs/promises';
import {runBigMeal} from './big-meal-runner.mjs';
import {searchFailureOreOffspring} from './big-meal-failure-ore-offspring.mjs';

export async function runFailureOreOffspringRound({outputPath=null}={}){
  const prior=await runBigMeal({manifestPath:'nostromo/research/big-meals/pasquinelli-2026.json'});
  const development=await runBigMeal({manifestPath:'nostromo/research/big-meals/heldout-rfc9110-http-semantics-2022.json'});
  const validation=[];
  for(const manifestPath of [
    'nostromo/research/big-meals/heldout-gutenberg-pride-prejudice-1813.json',
    'nostromo/research/big-meals/heldout-gutenberg-boston-cooking-school-1896.json'
  ]) validation.push(await runBigMeal({manifestPath}));

  const result=await searchFailureOreOffspring({
    priorMealResult:prior,
    developmentMealResult:development,
    validationMealResults:validation
  });
  const wrapped={
    ...result,
    observedAt:new Date().toISOString(),
    foodRoles:{
      prior:{mealId:prior.mealId,sourceSha256:prior.provenance?.sourceSha256},
      development:{mealId:development.mealId,sourceSha256:development.provenance?.sourceSha256},
      validation:validation.map(x=>({mealId:x.mealId,sourceSha256:x.provenance?.sourceSha256}))
    }
  };
  if(outputPath) await fs.writeFile(outputPath,JSON.stringify(wrapped,null,2)+'\n','utf8');
  return wrapped;
}

if(import.meta.url===`file://${process.argv[1]}`){
  const outputArg=process.argv.find(x=>x.startsWith('--output='));
  const result=await runFailureOreOffspringRound({outputPath:outputArg?outputArg.slice(9):null});
  console.log(JSON.stringify(result,null,2));
}
