// ZENOMORPH offspring qualification gauntlet v0.2.0
// Stress, provenance, explicit cross-food causal transfer, cross-organ propagation and regression evidence only.
// This runner has no promotion or Stable-write authority.
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import {runBigMeal} from './big-meal-runner.mjs';
import {searchFailureOreOffspring} from './big-meal-failure-ore-offspring.mjs';
import {runMealTopologyAblation} from './big-meal-ablation-probe.mjs';
import {evaluateHeldoutUsefulness} from './big-meal-usefulness-gate.mjs';
import {shroomFeedbackReadingRound} from './shroom-feedback-executor.mjs';

const sha=value=>crypto.createHash('sha256').update(typeof value==='string'?value:JSON.stringify(value)).digest('hex');
const manifests={
  prior:'nostromo/research/big-meals/pasquinelli-2026.json',
  development:'nostromo/research/big-meals/heldout-rfc9110-http-semantics-2022.json',
  validation:[
    'nostromo/research/big-meals/heldout-gutenberg-pride-prejudice-1813.json',
    'nostromo/research/big-meals/heldout-gutenberg-boston-cooking-school-1896.json'
  ]
};

function usefulnessInput(ablation){
  return {mealId:ablation?.control?.mealId||ablation?.exposed?.mealId||null,controlRoute:ablation?.control?.route,exposedRoute:ablation?.exposed?.route,receipt:ablation?.receipt,stableUnchanged:ablation?.stableUnchanged};
}

function deterministicMealFingerprint(meal){
  return sha({
    mealId:meal?.mealId,
    sourceSha256:meal?.provenance?.sourceSha256,
    muther:{chunkCount:meal?.muther?.chunkCount,affinities:meal?.muther?.affinities},
    gut:meal?.gut,
    vajra:meal?.vajra,
    shrooming:meal?.shrooming
  });
}

function stressMeal(meal,kind){
  const clone=structuredClone(meal);
  const affinities=clone?.muther?.affinities;
  if(!Array.isArray(affinities)||affinities.length<12) throw new Error('STRESS_AFFINITIES_REQUIRED');
  if(kind==='ORDER_REVERSAL') clone.muther.affinities=[...affinities].reverse();
  else if(kind==='SIMILARITY_QUANTIZATION') clone.muther.affinities=affinities.map(x=>({...x,similarity:Number(Number(x.similarity).toFixed(3))}));
  else if(kind==='TOP_EDGE_LOSS'){
    const sorted=[...affinities].sort((a,b)=>Number(b.similarity)-Number(a.similarity));
    const remove=`${sorted[0].a}:${sorted[0].b}`;
    clone.muther.affinities=affinities.filter(x=>`${x.a}:${x.b}`!==remove);
  } else throw new Error('UNKNOWN_STRESS');
  return clone;
}

async function loadEngines(){
  await import('../gut/gut-engine.js');
  await import('../vajra/vajra-engine.js');
  if(!globalThis.GutEngine||!globalThis.VajraEngine) throw new Error('CROSS_ORGAN_ENGINES_UNAVAILABLE');
}

async function cascade(route,mealId,label){
  const substrate=JSON.stringify({mealId,label,route});
  const gut=globalThis.GutEngine.digest({mealId:`${mealId}:${label}`,route},{source:`QUALIFICATION:${mealId}:${label}`,inheritedSubstrates:[substrate]});
  const gutText=String(gut?.summary||JSON.stringify(gut));
  const vajra=globalThis.VajraEngine.run(gutText.slice(0,7000),8);
  const vajraText=String(vajra?.targetRef||'')+'\n'+String(gutText).slice(0,5000);
  const shrooming=await shroomFeedbackReadingRound({text:vajraText,agents:10,round:1});
  return {
    gutFingerprint:sha({status:gut?.status,nutrients:gut?.nutrients,waste:gut?.waste,summary:gut?.summary}),
    vajraFingerprint:sha({status:vajra?.status,targetRef:vajra?.targetRef,trace:vajra?.trace}),
    shroomFingerprint:sha({status:shrooming?.status,count:shrooming?.count,sourceFingerprint:shrooming?.sourceFingerprint}),
    status:{gut:gut?.status||'EXECUTED',vajra:vajra?.status||'EXECUTED',shrooming:shrooming?.status||'EXECUTED'}
  };
}

export async function runOffspringQualification({outputPath=null}={}){
  const frozen=JSON.parse(await fs.readFile('nostromo/research/big-meals/failure-ore-offspring-delayed-2026-09-14.json','utf8'));
  const prior=await runBigMeal({manifestPath:manifests.prior});
  const development=await runBigMeal({manifestPath:manifests.development});
  const validation=[];
  for(const p of manifests.validation) validation.push(await runBigMeal({manifestPath:p}));
  const offspringRound=await searchFailureOreOffspring({priorMealResult:prior,developmentMealResult:development,validationMealResults:validation});
  const candidate=offspringRound?.selected?.candidate;
  if(!candidate) throw new Error('QUALIFICATION_CANDIDATE_REQUIRED');

  const identityMatchesFrozen=candidate.id===frozen?.offspring?.freshCandidateId && Number(candidate?.parameters?.pressureScale)===Number(frozen?.offspring?.pressureScale);
  const candidateText=JSON.stringify(candidate);
  const forbiddenValidationTokens=validation.flatMap(x=>[x.mealId,x.provenance?.sourceSha256]).filter(Boolean);
  const noValidationLeak=forbiddenValidationTokens.every(token=>!candidateText.includes(String(token)));
  const sourceBound=candidate.sourceMealId===prior.mealId && candidate.sourceSha256===prior.provenance?.sourceSha256;
  const lineageBound=candidate?.lineage?.failureMealId===development.mealId && candidate?.lineage?.mutation==='BOUNDED_STRUCTURAL_PRESSURE_DISTORTION';
  const provenancePassed=Boolean(identityMatchesFrozen&&noValidationLeak&&sourceBound&&lineageBound&&candidate?.evidence?.incorporated===false);

  const rawAblations=[];
  for(const meal of validation){
    const a=await runMealTopologyAblation({priorMealResult:prior,heldoutMealResult:meal,candidateOverride:candidate});
    rawAblations.push(a);
  }

  // Explicitly reconcile cross-food transfer instead of inferring it from generic held-out/usefulness labels.
  // Each food must independently show a causal route change and pass the frozen usefulness gate, while Stable remains unchanged.
  const crossFoodCases=rawAblations.map((ablation,i)=>{
    const usefulness=evaluateHeldoutUsefulness(usefulnessInput(ablation));
    const causalEffectObserved=Boolean(ablation?.receipt?.causalEffectObserved);
    return {
      mealId:validation[i]?.mealId||ablation?.control?.mealId||null,
      sourceSha256:validation[i]?.provenance?.sourceSha256||ablation?.control?.sourceSha256||null,
      causalEffectObserved,
      usefulnessPassed:Boolean(usefulness?.passed),
      reason:usefulness?.reason||null,
      deltas:usefulness?.deltas||null,
      stableUnchanged:Boolean(ablation?.stableUnchanged),
      passed:Boolean(causalEffectObserved&&usefulness?.passed&&ablation?.stableUnchanged)
    };
  });
  const distinctCrossFoodSources=new Set(crossFoodCases.map(x=>`${x.mealId}:${x.sourceSha256}`)).size===crossFoodCases.length;
  const crossFoodTransferPassed=crossFoodCases.length>=2&&distinctCrossFoodSources&&crossFoodCases.every(x=>x.passed);

  const stressCases=[];
  for(const meal of validation){
    for(const kind of ['ORDER_REVERSAL','SIMILARITY_QUANTIZATION','TOP_EDGE_LOSS']){
      const stressed=stressMeal(meal,kind);
      const ablation=await runMealTopologyAblation({priorMealResult:prior,heldoutMealResult:stressed,candidateOverride:candidate});
      const usefulness=evaluateHeldoutUsefulness(usefulnessInput(ablation));
      stressCases.push({mealId:meal.mealId,kind,passed:usefulness.passed,reason:usefulness.reason,deltas:usefulness.deltas,stableUnchanged:ablation.stableUnchanged});
    }
  }
  const stressPassed=stressCases.length===validation.length*3 && stressCases.every(x=>x.passed&&x.stableUnchanged);

  await loadEngines();
  const crossOrgan=[];
  for(const ablation of rawAblations){
    const control=await cascade(ablation.control.route,ablation.control.mealId,'control');
    const exposed=await cascade(ablation.exposed.route,ablation.exposed.mealId,'exposed');
    const propagated={
      gut:control.gutFingerprint!==exposed.gutFingerprint,
      vajra:control.vajraFingerprint!==exposed.vajraFingerprint,
      shrooming:control.shroomFingerprint!==exposed.shroomFingerprint
    };
    crossOrgan.push({mealId:ablation.control.mealId,propagated,allPropagated:Object.values(propagated).every(Boolean),control:control.status,exposed:exposed.status,stableUnchanged:ablation.stableUnchanged});
  }
  const crossOrganPassed=crossOrgan.length>=2&&crossOrgan.every(x=>x.allPropagated&&x.stableUnchanged);

  const repeatValidation=[];
  for(let i=0;i<validation.length;i++){
    const repeat=await runMealTopologyAblation({priorMealResult:prior,heldoutMealResult:validation[i],candidateOverride:candidate});
    repeatValidation.push({
      mealId:validation[i].mealId,
      controlRouteSame:repeat.control.route.routeFingerprint===rawAblations[i].control.route.routeFingerprint,
      exposedRouteSame:repeat.exposed.route.routeFingerprint===rawAblations[i].exposed.route.routeFingerprint,
      stableUnchanged:repeat.stableUnchanged
    });
  }
  const priorRepeat=await runBigMeal({manifestPath:manifests.prior});
  const ingestionDeterministic=deterministicMealFingerprint(prior)===deterministicMealFingerprint(priorRepeat);
  const regressionPassed=ingestionDeterministic&&repeatValidation.every(x=>x.controlRouteSame&&x.exposedRouteSame&&x.stableUnchanged);

  const qualificationPassed=provenancePassed&&crossFoodTransferPassed&&stressPassed&&crossOrganPassed&&regressionPassed;
  const result={
    schema:'zenomorph-offspring-qualification/v0.2',observedAt:new Date().toISOString(),
    candidate:{id:candidate.id,pressureScale:candidate.parameters?.pressureScale,identityMatchesFrozen},
    provenance:{passed:provenancePassed,noValidationLeak,sourceBound,lineageBound},
    crossFoodTransfer:{passed:crossFoodTransferPassed,distinctSources:distinctCrossFoodSources,foods:crossFoodCases,boundary:'Cross-food transfer requires independent causal route differences plus usefulness on at least two frozen held-out foods. It is evidence only, not Stable authority.'},
    stress:{passed:stressPassed,cases:stressCases},
    crossOrgan:{passed:crossOrganPassed,foods:crossOrgan,boundary:'Causal route differences were propagated through isolated GUT→VAJRA→SHROOMING shadow cascades only. This does not grant Stable authority.'},
    regression:{passed:regressionPassed,ingestionDeterministic,repeatValidation},
    stableUnchanged:rawAblations.every(x=>x.stableUnchanged)&&stressCases.every(x=>x.stableUnchanged)&&repeatValidation.every(x=>x.stableUnchanged),
    qualificationPassed,
    promotion:{promotable:false,incorporated:false,evidence:{stress:stressPassed,provenance:provenancePassed,cross_organ:crossOrganPassed,regression:regressionPassed,held_out:true,usefulness_validated:crossFoodCases.every(x=>x.usefulnessPassed),cross_food_transfer:crossFoodTransferPassed,delayed_retest:Boolean(frozen?.delayedRetentionPassed&&frozen?.stableUnchanged&&frozen?.offspring?.candidateIdentityMatches&&frozen?.offspring?.pressureIdentityMatches)},reason:qualificationPassed?'QUALIFICATION_AND_EXPLICIT_CROSS_FOOD_TRANSFER_PASSED; FULL PROMOTION RECEIPT AND A SEPARATE GUARDED INCORPORATION STEP ARE STILL REQUIRED':'ONE_OR_MORE_QUALIFICATION_GATES_FAILED; RETAIN IN GROWING_SHADOW'},
    boundary:'QUALIFICATION EVIDENCE ONLY. No code path in this runner may call promoteCandidate or mutate Stable.'
  };
  if(outputPath) await fs.writeFile(outputPath,JSON.stringify(result,null,2)+'\n','utf8');
  return result;
}

if(import.meta.url===`file://${process.argv[1]}`){
  const outputArg=process.argv.find(x=>x.startsWith('--output='));
  const result=await runOffspringQualification({outputPath:outputArg?outputArg.slice(9):null});
  console.log(JSON.stringify(result,null,2));
}
