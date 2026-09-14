// ZENOMORPH failure-ore offspring delayed retention + usefulness gate v0.1.0
// A previously frozen offspring receipt is the identity anchor. A fresh execution must
// independently reselect the same offspring from the same provenance-bound foods and
// preserve usefulness on the independent validation foods. Parent delayed evidence is
// never inherited. Passing remains evidence only and cannot promote into Stable.
import fs from 'node:fs/promises';
import {runFailureOreOffspringRound} from './big-meal-failure-ore-offspring-runner.mjs';

export function evaluateOffspringDelayedRetention({frozenReceipt,freshRound}={}){
  const expectedCandidateId=frozenReceipt?.offspring?.candidateId||null;
  const freshCandidate=freshRound?.selected?.candidate||null;
  const candidateIdentityMatches=Boolean(expectedCandidateId&&freshCandidate?.id===expectedCandidateId);
  const pressureIdentityMatches=Number(freshCandidate?.parameters?.pressureScale)===Number(frozenReceipt?.offspring?.pressureScale);

  const expectedFood={
    prior:frozenReceipt?.foodIdentity?.prior||null,
    development:frozenReceipt?.foodIdentity?.development||null,
    validation:Array.isArray(frozenReceipt?.foodIdentity?.validation)?frozenReceipt.foodIdentity.validation:[]
  };
  const freshFood={
    prior:freshRound?.foodRoles?.prior||null,
    development:freshRound?.foodRoles?.development||null,
    validation:Array.isArray(freshRound?.foodRoles?.validation)?freshRound.foodRoles.validation:[]
  };
  const sameFood=(a,b)=>Boolean(a&&b&&a.mealId===b.mealId&&a.sourceSha256===b.sourceSha256);
  const priorIdentityMatches=sameFood(expectedFood.prior,freshFood.prior);
  const developmentIdentityMatches=sameFood(expectedFood.development,freshFood.development);
  const validationIdentityMatches=expectedFood.validation.length>=2&&
    expectedFood.validation.length===freshFood.validation.length&&
    expectedFood.validation.every((x,i)=>sameFood(x,freshFood.validation[i]));

  const parentDelayedEvidenceNotInherited=frozenReceipt?.promotion?.delayed_retest===false&&
    freshCandidate?.evidence?.delayed_retest===false;
  const freshCrossFoodUsefulnessPassed=freshRound?.offspringCrossFoodUsefulnessPassed===true;
  const freshValidationCount=Number(freshRound?.validationHeldoutCount||0);
  const freshStableUnchanged=freshRound?.stableUnchanged===true;
  const frozenStableUnchanged=frozenReceipt?.stableUnchanged===true;
  const failureOreActivated=freshRound?.selected?.failureOreActivation?.failureOreActivated===true;
  const freshDevelopmentUseful=freshRound?.selected?.developmentUsefulness?.passed===true;
  const freshValidationAllUseful=Array.isArray(freshRound?.validation?.foods)
    ? freshRound.validation.foods.length>=2&&freshRound.validation.foods.every(x=>x.passed===true)
    : freshCrossFoodUsefulnessPassed;

  const delayedRetentionPassed=[
    candidateIdentityMatches,pressureIdentityMatches,priorIdentityMatches,developmentIdentityMatches,
    validationIdentityMatches,parentDelayedEvidenceNotInherited,freshCrossFoodUsefulnessPassed,
    freshValidationCount>=2,freshStableUnchanged,frozenStableUnchanged,failureOreActivated,
    freshDevelopmentUseful,freshValidationAllUseful
  ].every(Boolean);

  return {
    schema:'zenomorph-failure-ore-offspring-delayed-retention/v0.1',
    status:delayedRetentionPassed
      ?'OFFSPRING_DELAYED_IDENTITY_AND_CROSS_FOOD_USEFULNESS_RETAINED_NOT_PROMOTION_PROOF'
      :'OFFSPRING_DELAYED_RETENTION_OR_USEFULNESS_NOT_ESTABLISHED',
    expectedCandidateId,
    freshCandidateId:freshCandidate?.id||null,
    candidateIdentityMatches,pressureIdentityMatches,
    priorIdentityMatches,developmentIdentityMatches,validationIdentityMatches,
    parentDelayedEvidenceNotInherited,
    freshCrossFoodUsefulnessPassed,freshValidationCount,
    freshStableUnchanged,frozenStableUnchanged,failureOreActivated,
    freshDevelopmentUseful,freshValidationAllUseful,
    delayedRetentionPassed,
    promotion:{
      promotable:false,
      failure_ore:true,
      delayed_retest:delayedRetentionPassed,
      usefulness_validated:delayedRetentionPassed,
      cross_food_transfer:false,
      incorporated:false,
      reason:delayedRetentionPassed
        ?'OFFSPRING_REAPPEARED_WITH_USEFULNESS_AFTER_DELAY; STRESS_PROVENANCE_CROSS_ORGAN_REGRESSION_AND_REMAINING_PROMOTION_GATES_STILL_REQUIRED'
        :'OFFSPRING_DELAYED_RETENTION_OR_USEFULNESS_GATE_FAILED'
    },
    boundary:'The frozen offspring receipt predates this execution and is identity evidence only. The fresh round must independently reselect the same child and re-pass development plus independent held-out usefulness without changing Stable. Parent delayed evidence cannot satisfy this gate. Even PASS does not authorize incorporation.'
  };
}

export async function runOffspringDelayedRetention({
  frozenReceiptPath='nostromo/research/big-meals/failure-ore-offspring-2026-09-14.json',
  outputPath=null
}={}){
  const frozenReceipt=JSON.parse(await fs.readFile(frozenReceiptPath,'utf8'));
  const freshRound=await runFailureOreOffspringRound();
  const result={...evaluateOffspringDelayedRetention({frozenReceipt,freshRound}),observedAt:new Date().toISOString(),freshRound};
  if(outputPath) await fs.writeFile(outputPath,JSON.stringify(result,null,2)+'\n','utf8');
  return result;
}

if(import.meta.url===`file://${process.argv[1]}`){
  const outputArg=process.argv.find(x=>x.startsWith('--output='));
  const receiptArg=process.argv.find(x=>x.startsWith('--receipt='));
  const result=await runOffspringDelayedRetention({
    frozenReceiptPath:receiptArg?receiptArg.slice('--receipt='.length):undefined,
    outputPath:outputArg?outputArg.slice('--output='.length):null
  });
  console.log(JSON.stringify(result,null,2));
}
