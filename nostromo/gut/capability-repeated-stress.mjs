/* ZENOMORPH / NOSTROMO repeated held-out capability stress gate v0.1
 * Requires a foreign capability to survive multiple independent positive/negative held-out cases
 * before it may be considered for explicit incorporation. This gate does NOT install or mutate the body.
 */
import { runHeldoutCrossOrganStress } from './capability-heldout-stress.mjs';

function cleanExpectation(value){
  return value===true||value===false?value:null;
}

export function runRepeatedHeldoutStress(candidate,cases,{capabilityRegistry={},organRegistry={},downstreamOrganId,context={}}={}){
  const base={
    schema:'zenomorph-capability-repeated-heldout-stress/v0.1',
    organism:'ZENOMORPH',
    habitat:'NOSTROMO',
    bodyAdmission:false,
    installed:false,
    persistentMutation:false,
    assimilationStage:'REPEATED_HELDOUT_BLOCKED'
  };
  if(!Array.isArray(cases)||cases.length<3){
    return {...base,status:'BLOCKED',reason:'at-least-three-independent-heldout-cases-required',executedCases:0};
  }
  const normalized=cases.map((entry,index)=>({
    id:String(entry?.id||`case-${index+1}`).slice(0,80),
    input:entry?.input,
    baselineSignal:entry?.baselineSignal??null,
    expectedChange:cleanExpectation(entry?.expectedChange)
  }));
  if(normalized.some(x=>x.expectedChange===null)){
    return {...base,status:'BLOCKED',reason:'each-heldout-case-must-declare-expectedChange',executedCases:0};
  }
  const results=[];
  for(const entry of normalized){
    const result=runHeldoutCrossOrganStress(candidate,entry.input,{capabilityRegistry,organRegistry,downstreamOrganId,baselineSignal:entry.baselineSignal,context});
    results.push({id:entry.id,expectedChange:entry.expectedChange,result});
    if(['BLOCKED','FAILED','QUARANTINE'].includes(result.status)){
      return {...base,status:'HOLD',reason:'heldout-case-did-not-complete-cleanly',executedCases:results.length,results};
    }
  }
  const fingerprints=results.map(x=>x.result?.isolatedTrial?.inputFingerprint).filter(Boolean);
  const distinctInputs=new Set(fingerprints).size===normalized.length;
  const expectationMatches=results.every(x=>x.result?.behaviorChanged===x.expectedChange);
  const hasPositive=normalized.some(x=>x.expectedChange===true);
  const hasNegative=normalized.some(x=>x.expectedChange===false);
  const provenance=results.map(x=>x.result?.provenanceFingerprint||null);
  const provenanceStable=provenance.every(x=>x&&x===provenance[0]);
  const passed=distinctInputs&&expectationMatches&&hasPositive&&hasNegative&&provenanceStable;
  return {
    ...base,
    status:passed?'PASS':'HOLD',
    assimilationStage:passed?'REPEATED_HELDOUT_PROFILE_VERIFIED':'REPEATED_HELDOUT_INCONCLUSIVE',
    reason:passed?'foreign-capability-survived-independent-positive-and-negative-heldout-profile':'repeated-heldout-evidence-insufficient',
    executedCases:results.length,
    distinctInputs,
    expectationMatches,
    hasPositive,
    hasNegative,
    provenanceStable,
    provenanceFingerprint:provenance[0]||null,
    results,
    rollbackEvidence:'all trials ephemeral; no capability installation, registry mutation, or persistent body-state mutation performed'
  };
}

export const repeatedHeldoutBoundary=Object.freeze({
  version:'0.1',
  minimumCases:3,
  requiresDistinctInputs:true,
  requiresPositiveAndNegativeCases:true,
  requiresStableProvenance:true,
  requiresExpectedBehaviorProfile:true,
  persistentMutation:false,
  bodyAdmissionOnPass:false,
  nextStage:'explicit incorporation candidate with reversible body-state trial'
});
