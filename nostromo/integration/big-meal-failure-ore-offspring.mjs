// ZENOMORPH big-meal failure-ore offspring search v0.1.0
// A rejected persistent routing bias may become ore for a smaller structural offspring.
// Selection is performed only on a development food; unlike validation foods remain held out.
// No semantic/topic hints are imported and no result has Stable authority.
import {deriveStructuralRoutingCandidate,runMealTopologyAblation} from './big-meal-ablation-probe.mjs';
import {evaluateHeldoutUsefulness,evaluateCrossFoodUsefulness} from './big-meal-usefulness-gate.mjs';
import {evaluateFailureOreActivation} from '../muther/internal-mutation-failure-ore.mjs';

const fixed=n=>Number(Number(n).toFixed(6));

function usefulnessInput(ablation){
  return {
    mealId:ablation?.control?.mealId||ablation?.exposed?.mealId||null,
    controlRoute:ablation?.control?.route,
    exposedRoute:ablation?.exposed?.route,
    receipt:ablation?.receipt,
    stableUnchanged:ablation?.stableUnchanged
  };
}

export function deriveFailureOreChild({parentCandidate,parentFailure,pressureScale}={}){
  if(!parentCandidate?.id||parentFailure?.passed!==false) throw new Error('REJECTED_PARENT_FAILURE_REQUIRED');
  const scale=Number(pressureScale);
  if(!Number.isFinite(scale)||scale<0||scale>2||scale===Number(parentCandidate?.parameters?.pressureScale??1)) throw new Error('VALID_MUTATED_PRESSURE_SCALE_REQUIRED');
  const parentScale=fixed(parentCandidate?.parameters?.pressureScale??1);
  const topologyIdentity=[parentCandidate.parameters?.similarityMedian,parentCandidate.parameters?.spanMedian,parentCandidate.parameters?.affinityCount].join('|');
  const failureRef=`${parentFailure.mealId||'development'}:${parentFailure.reason||'FAILED_USEFULNESS'}`;
  const specimens=[
    {
      id:'parent-routing-phenotype',kind:'version',traits:[
        {dimension:'routing_pressure',value:String(parentScale),provenance:{artifactRef:parentCandidate.id,versionRef:'rejected-parent'}},
        {dimension:'topology_identity',value:topologyIdentity,provenance:{artifactRef:parentCandidate.id,versionRef:'rejected-parent'}}
      ]
    },
    {
      id:'usefulness-failure-ore',kind:'failure',traits:[
        {dimension:'failure_reason',value:String(parentFailure.reason||'FAILED_USEFULNESS'),provenance:{artifactRef:failureRef,versionRef:'usefulness-gate'}},
        {dimension:'similarity_delta',value:String(parentFailure?.deltas?.similarityDelta??0),provenance:{artifactRef:failureRef,versionRef:'usefulness-gate'}}
      ]
    }
  ];
  const childId=`${parentCandidate.id}-ore-p${String(scale).replace('.','_')}`;
  const proposal={
    candidateId:childId,
    traits:[
      {
        dimension:'routing_pressure',value:String(fixed(scale)),operation:'distort',derivedFrom:[
          {specimenId:'parent-routing-phenotype',sourceDimension:'routing_pressure'},
          {specimenId:'usefulness-failure-ore',sourceDimension:'similarity_delta'}
        ]
      },
      {
        dimension:'topology_identity',value:topologyIdentity,operation:'inherit',derivedFrom:[
          {specimenId:'parent-routing-phenotype',sourceDimension:'topology_identity'}
        ]
      }
    ]
  };
  const activation=evaluateFailureOreActivation({specimens,proposal});
  if(activation.status!=='SANDBOX_CANDIDATE'||activation.failureOreActivated!==true) throw new Error(`FAILURE_ORE_NOT_ACTIVATED:${activation.reason||activation.status}`);
  const child={
    ...parentCandidate,
    id:childId,
    parameters:{...parentCandidate.parameters,pressureScale:fixed(scale)},
    evidence:{...parentCandidate.evidence,failure_ore:true,cross_food_transfer:false,delayed_retest:false,incorporated:false},
    lineage:{parentCandidateId:parentCandidate.id,failureMealId:parentFailure.mealId||null,failureReason:parentFailure.reason||null,mutation:'BOUNDED_STRUCTURAL_PRESSURE_DISTORTION'},
    boundary:'CONTENT_AGNOSTIC FAILURE-ORE OFFSPRING. ONLY STRUCTURAL ROUTING PRESSURE CHANGED; NO SOURCE TEXT, TOPIC, CLAIM, SUMMARY OR SEMANTIC HINT RETAINED. SHADOW/GROWING ONLY.'
  };
  return {child,activation};
}

export async function searchFailureOreOffspring({priorMealResult,developmentMealResult,validationMealResults=[],scales=[0,0.25,0.5,0.75,1.25,1.5]}={}){
  if(!priorMealResult||!developmentMealResult) throw new Error('PRIOR_AND_DEVELOPMENT_MEALS_REQUIRED');
  const parentCandidate=deriveStructuralRoutingCandidate(priorMealResult);
  const parentAblation=await runMealTopologyAblation({priorMealResult,heldoutMealResult:developmentMealResult});
  const parentFailure=evaluateHeldoutUsefulness(usefulnessInput(parentAblation));
  if(parentFailure.passed){
    return {schema:'zenomorph-big-meal-failure-ore-offspring/v0.1',status:'HOLD_PARENT_NOT_REJECTED',parentCandidateId:parentCandidate.id,parentDevelopmentUsefulness:parentFailure,promotion:{promotable:false}};
  }

  const variants=[];
  for(const scale of scales){
    if(Number(scale)===Number(parentCandidate.parameters.pressureScale)) continue;
    const {child,activation}=deriveFailureOreChild({parentCandidate,parentFailure,pressureScale:scale});
    const ablation=await runMealTopologyAblation({priorMealResult,heldoutMealResult:developmentMealResult,candidateOverride:child});
    const usefulness=evaluateHeldoutUsefulness(usefulnessInput(ablation));
    variants.push({pressureScale:Number(scale),candidate:child,failureOreActivation:activation,usefulness,stableUnchanged:ablation.stableUnchanged});
  }

  const passing=variants.filter(x=>x.usefulness.passed&&x.stableUnchanged===true)
    .sort((a,b)=>Math.abs(a.pressureScale-1)-Math.abs(b.pressureScale-1)||b.usefulness.deltas.similarityDelta-a.usefulness.deltas.similarityDelta);
  const selected=passing[0]||null;
  if(!selected){
    return {
      schema:'zenomorph-big-meal-failure-ore-offspring/v0.1',status:'NO_USEFUL_OFFSPRING_ON_DEVELOPMENT_FOOD',
      parentCandidateId:parentCandidate.id,parentDevelopmentUsefulness:parentFailure,variants:variants.map(v=>({pressureScale:v.pressureScale,usefulness:v.usefulness})),
      stableUnchanged:variants.every(v=>v.stableUnchanged===true),promotion:{promotable:false,reason:'FAILURE_ORE_SEARCH_DID_NOT_ESCAPE_REJECTED_PHENOTYPE'}
    };
  }

  const heldouts=[];
  for(const meal of validationMealResults){
    const ablation=await runMealTopologyAblation({priorMealResult,heldoutMealResult:meal,candidateOverride:selected.candidate});
    heldouts.push({...usefulnessInput(ablation),candidateId:selected.candidate.id,sourceSha256:meal?.provenance?.sourceSha256||null});
  }
  const robustness={candidateId:selected.candidate.id,heldouts};
  const validationUsefulness=evaluateCrossFoodUsefulness(robustness);
  const stableUnchanged=selected.stableUnchanged===true&&heldouts.every(x=>x.stableUnchanged===true);
  const offspringCrossFoodUsefulnessPassed=validationUsefulness.crossFoodUsefulnessPassed===true&&stableUnchanged;
  return {
    schema:'zenomorph-big-meal-failure-ore-offspring/v0.1',
    status:offspringCrossFoodUsefulnessPassed?'FAILURE_ORE_OFFSPRING_SURVIVED_INDEPENDENT_CROSS_FOOD_USEFULNESS':'FAILURE_ORE_OFFSPRING_FAILED_INDEPENDENT_VALIDATION',
    parentCandidateId:parentCandidate.id,
    parentDevelopmentUsefulness:parentFailure,
    searchedPressureScales:variants.map(v=>v.pressureScale),
    selected:{candidate:selected.candidate,failureOreActivation:selected.failureOreActivation,developmentUsefulness:selected.usefulness},
    validation:validationUsefulness,
    validationHeldoutCount:heldouts.length,
    offspringCrossFoodUsefulnessPassed,
    stableUnchanged,
    promotion:{
      promotable:false,
      failure_ore:true,
      cross_food_transfer:false,
      delayed_retest:false,
      reason:offspringCrossFoodUsefulnessPassed?'INDEPENDENT_USEFULNESS_SURVIVED_BUT_DELAYED_RETENTION_AND_FULL_PROMOTION_GATES_REMAIN':'INDEPENDENT_VALIDATION_FAILED'
    },
    boundary:'Development food may shape selection pressure only through a provenance-bound failure receipt. Validation foods are not used to choose the offspring. Even a surviving offspring remains isolated from Stable until delayed and all remaining promotion gates pass.'
  };
}
