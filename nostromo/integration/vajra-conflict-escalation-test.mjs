import fs from 'node:fs/promises';
import vm from 'node:vm';
import {escalateVajraConflicts,ingestConflictEscalationReturns,integrateConflictAdjudicationContext} from './vajra-conflict-escalation.mjs';
const failures=[];
const contested={unresolved:[{targetRef:'t001',clauseRef:'c001',lens:'evidence',status:'CONTESTED_BY_RECEIPTS',contest:{status:'CONTESTED_BY_RECEIPTS',evidence:[
  {evidenceKey:'e-support',provenance:'source-A',polarity:'SUPPORTS',relation:'supports under condition A'},
  {evidenceKey:'e-refute',provenance:'source-B',polarity:'REFUTES',relation:'refutes under matched condition A'}
]}}]};
const out=escalateVajraConflicts(contested);
if(out.status!=='CONFLICT_ESCALATION_REQUIRED'||out.escalatedBranches!==1||out.closureBlocked!==true)failures.push({type:'ESCALATION_NOT_REQUIRED',out});
const packets=out.escalations[0]?.packets||[];
const targets=packets.map(p=>p.targetOrgan).sort();
if(JSON.stringify(targets)!==JSON.stringify(['DROPLET','MUTHER','SHROOMING']))failures.push({type:'THREE_ORGAN_ESCALATION_MISSING',targets});
if(packets.some(p=>p.closureAuthority!=='NONE'||p.status!=='OPEN'))failures.push({type:'FALSE_CLOSURE_AUTHORITY'});
if(packets.some(p=>p.targetRef!=='t001'||p.clauseRef!=='c001'||p.evidenceKeys.length!==2||p.provenanceRefs.length!==2))failures.push({type:'PROVENANCE_OR_SCOPE_LOST'});
if(packets.some(p=>!p.returnContract||p.returnContract.closureAuthority!=='NONE'||!p.returnContract.required?.includes('provenance')))failures.push({type:'RETURN_CONTRACT_MISSING_OR_UNSAFE'});
const packetIds=packets.map(p=>p.packetId);
if(new Set(packetIds).size!==packets.length||packetIds.some(x=>!x))failures.push({type:'PACKET_ID_COLLISION_OR_MISSING',packetIds});
const malformed=escalateVajraConflicts({handoffResolution:{contestedBranches:[{targetRef:'t2',clauseRef:'c2',lens:'evidence',status:'CONTESTED_BY_RECEIPTS',evidence:[
 {evidenceKey:'e1',provenance:'',polarity:'SUPPORTS'},{evidenceKey:'e2',provenance:'s2',polarity:'REFUTES'}]}]}});
if(malformed.quarantinedBranches!==1||malformed.escalatedBranches!==0||!malformed.quarantine[0]?.reasons?.includes('PROVENANCE'))failures.push({type:'MALFORMED_CONTEST_NOT_QUARANTINED',malformed});
const none=escalateVajraConflicts({unresolved:[]});
if(none.status!=='NO_CONTEST'||none.closureBlocked!==false)failures.push({type:'NO_CONTEST_FALSE_POSITIVE',none});

const packetByOrgan=Object.fromEntries(packets.map(p=>[p.targetOrgan,p]));
const goodReturns=[
  {packetId:packetByOrgan.DROPLET.packetId,sourceOrgan:'DROPLET',targetRef:'t001',clauseRef:'c001',status:'EXECUTED',provenance:'droplet-source-audit-01',material:'Two opposing evidence items originate from separate declared source families, but methodological comparability remains only partially established.',relation:'Source independence is provisionally stronger than before while comparable-condition coverage remains unresolved.'},
  {packetId:packetByOrgan.MUTHER.packetId,sourceOrgan:'MUTHER',targetRef:'t001',clauseRef:'c001',status:'EXECUTED',provenance:'muther-context-audit-01',material:'Repository context exposes a scope qualifier that narrows one supporting statement to condition A and leaves the broader formulation unsupported.',relation:'The disagreement may partly reflect scope mismatch, so the original contested branch should remain open.'},
  {packetId:packetByOrgan.SHROOMING.packetId,sourceOrgan:'SHROOMING',targetRef:'t001',clauseRef:'c001',status:'EXECUTED',provenance:'shroom-boundary-stress-01',material:'A boundary reading separates the claim into matched-condition and unmatched-condition cases, producing different judgments without erasing either evidence position.',relation:'The competing criterion changes which cases count as counterexamples and therefore requires explicit adjudication.'}
];
const intake=ingestConflictEscalationReturns(out,goodReturns);
if(intake.status!=='RETURNS_ACCEPTED_REVIEW_REQUIRED'||intake.acceptedReturns!==3||!intake.allPacketsReturned)failures.push({type:'VALID_RETURNS_NOT_ACCEPTED',intake});
if(intake.closureAuthority!=='NONE'||intake.closureBlocked!==true||intake.accepted.some(x=>x.closureAuthority!=='NONE'||x.receipt?.closureAuthority!=='NONE'))failures.push({type:'RETURN_INTAKE_FALSE_CLOSURE',intake});
if(JSON.stringify(Object.keys(intake.byOrgan).sort())!==JSON.stringify(['DROPLET','MUTHER','SHROOMING']))failures.push({type:'RETURN_ORGAN_DIVERSITY_LOST',byOrgan:intake.byOrgan});
if(intake.accepted.some(x=>x.targetRef!=='t001'||x.clauseRef!=='c001'||!x.provenance||!x.returnKey))failures.push({type:'RETURN_SCOPE_OR_PROVENANCE_LOST'});

// New feedback ability: accepted multi-organ returns must change VAJRA's next behavior without erasing the conflict.
const integrated=integrateConflictAdjudicationContext(contested,intake);
const contextualBranch=integrated.unresolved.find(x=>x.targetRef==='t001'&&x.clauseRef==='c001');
if(integrated.status!=='ADJUDICATION_CONTEXT_INTEGRATED'||integrated.adjudicationIntegration?.contextualizedBranches!==1)failures.push({type:'ADJUDICATION_CONTEXT_NOT_INTEGRATED',integrated});
if(contextualBranch?.status!=='CONTESTED_WITH_ADJUDICATION_CONTEXT'||contextualBranch?.closureBlocked!==true||contextualBranch?.closureAuthority!=='NONE')failures.push({type:'CONTEST_FALSELY_CLOSED_AFTER_CONTEXT',contextualBranch});
if(contextualBranch?.adjudicationContext?.complete!==true||JSON.stringify(contextualBranch?.adjudicationContext?.receivedOrgans)!==JSON.stringify(['DROPLET','MUTHER','SHROOMING']))failures.push({type:'THREE_ORGAN_CONTEXT_COVERAGE_LOST',context:contextualBranch?.adjudicationContext});
if(contextualBranch?.nextAction!=='REASSESS_CONFLICT_WITH_DISCRIMINATING_CONDITION'||!/最小可檢查條件/.test(contextualBranch?.nextQuestion||''))failures.push({type:'MULTI_ORGAN_RETURNS_DID_NOT_CHANGE_VAJRA_BEHAVIOR',nextAction:contextualBranch?.nextAction,nextQuestion:contextualBranch?.nextQuestion});
const preservedEvidence=contextualBranch?.contest?.evidence||[];
if(preservedEvidence.length!==2||preservedEvidence[0]?.provenance!=='source-A'||preservedEvidence[1]?.provenance!=='source-B')failures.push({type:'ORIGINAL_CONFLICT_PROVENANCE_LOST',preservedEvidence});
const partialIntake=ingestConflictEscalationReturns(out,[goodReturns[0]]);
const partialIntegrated=integrateConflictAdjudicationContext(contested,partialIntake);
const partialBranch=partialIntegrated.unresolved[0];
if(partialBranch?.nextAction!=='WAIT_FOR_ADDITIONAL_ADJUDICATION_CONTEXT'||partialBranch?.adjudicationContext?.complete!==false||partialBranch?.adjudicationContext?.missingOrgans?.length!==2)failures.push({type:'PARTIAL_CONTEXT_CREATED_PREMATURE_REASSESSMENT',partialBranch});
const unmatched=integrateConflictAdjudicationContext({unresolved:[]},{accepted:intake.accepted});
if(unmatched.adjudicationIntegration?.quarantinedReturns!==3||!unmatched.adjudicationIntegration?.quarantine?.every(x=>x.reasons?.includes('NO_MATCHING_CONTESTED_BRANCH')))failures.push({type:'UNMATCHED_CONTEXT_RETURN_NOT_QUARANTINED',unmatched});

// Mutated replay adversary: a second content/provenance variant for the same issued packet must not amplify one organ's vote.
const mutatedReplay=[
  goodReturns[0],
  {...goodReturns[0],provenance:'droplet-source-audit-02',material:'A later variant claims stronger source independence and adds additional wording, but it still returns against the exact same issued DROPLET packet.',relation:'This mutated second return would overweight DROPLET if accepted as a second contribution for the same packet.'}
];
const mutatedReplayIntake=ingestConflictEscalationReturns(out,mutatedReplay);
if(mutatedReplayIntake.acceptedReturns!==1||mutatedReplayIntake.quarantinedReturns!==1||!mutatedReplayIntake.quarantine[0]?.reasons?.includes('PACKET_ALREADY_RETURNED'))failures.push({type:'MUTATED_PACKET_REPLAY_NOT_CONTAINED',mutatedReplayIntake});
if((mutatedReplayIntake.byOrgan?.DROPLET||0)!==1)failures.push({type:'MUTATED_PACKET_REPLAY_AMPLIFIED_ORGAN_WEIGHT',byOrgan:mutatedReplayIntake.byOrgan});

const adversarial=[
  {...goodReturns[0],sourceOrgan:'MUTHER'},goodReturns[0],goodReturns[0],
  {...goodReturns[1],provenance:''},{...goodReturns[2],material:'done',relation:'ok'},{...goodReturns[2],clauseRef:'wrong-clause'}
];
const hostile=ingestConflictEscalationReturns(out,adversarial);
const hostileReasons=new Set(hostile.quarantine.flatMap(x=>x.reasons||[]));
for(const reason of ['WRONG_RETURNING_ORGAN','REPLAY_DUPLICATE','PACKET_ALREADY_RETURNED','PROVENANCE_REQUIRED','INSUFFICIENT_RETURN_MATERIAL','INSUFFICIENT_TARGET_RELATION','CLAUSE_REF_MISMATCH'])if(!hostileReasons.has(reason))failures.push({type:'ADVERSARIAL_RETURN_GUARD_MISSING',reason,hostile});
if(hostile.closureAuthority!=='NONE'||hostile.closureBlocked!==true)failures.push({type:'HOSTILE_RETURN_FALSE_CLOSURE'});
const unknown=ingestConflictEscalationReturns(out,[{packetId:'not-a-packet',sourceOrgan:'DROPLET',targetRef:'t001',clauseRef:'c001',status:'EXECUTED',provenance:'p',material:'This return has enough text to look substantial but belongs to no issued packet.',relation:'It must not be attached to the contested branch.'}]);
if(!unknown.quarantine[0]?.reasons?.includes('UNKNOWN_PACKET'))failures.push({type:'UNKNOWN_PACKET_NOT_QUARANTINED',unknown});

const gutCode=await fs.readFile('nostromo/gut/gut-engine.js','utf8').catch(()=>null);
let gut=null,gutReturns=null,gutIntegrated=null;
if(gutCode){
  vm.runInThisContext(gutCode,{filename:'gut-engine.js'});
  gut=globalThis.GutEngine?.digest(out,{source:'VAJRA_CONFLICT_ESCALATION'});
  gutReturns=globalThis.GutEngine?.digest(intake,{source:'VAJRA_CONFLICT_RETURN_INTAKE'});
  gutIntegrated=globalThis.GutEngine?.digest(integrated,{source:'VAJRA_ADJUDICATION_CONTEXT'});
  if(!gut?.absorbed||!gutReturns?.absorbed||!gutIntegrated?.absorbed)failures.push({type:'GUT_CANNOT_DIGEST_ESCALATION_RETURNS_OR_CONTEXT'});
  if(/resolved_by_receipt|truth_certified|claim settled/i.test(`${gut?.summary||''} ${gutReturns?.summary||''} ${gutIntegrated?.summary||''}`))failures.push({type:'GUT_FALSE_CLOSURE_LEAK'});
}
const result={
  schema:'nostromo-vajra-conflict-escalation-test/v0.4.0',completedAt:new Date().toISOString(),status:failures.length?'FAIL':'PASS',
  guards:{
    multiOrganEscalation:targets.length===3,closureRemainsBlocked:out.closureBlocked===true,provenancePreserved:packets.every(p=>p.provenanceRefs.length===2),packetIdsUnique:new Set(packetIds).size===packets.length&&packetIds.every(Boolean),returnContractsPresent:packets.every(p=>p.returnContract?.closureAuthority==='NONE'),malformedContestQuarantined:malformed.quarantinedBranches===1,noContestNoFalsePositive:none.status==='NO_CONTEST',threeOrganReturnsAccepted:intake.acceptedReturns===3&&intake.allPacketsReturned,returnIntakeNoClosure:intake.closureAuthority==='NONE'&&intake.closureBlocked===true,multiOrganContextChangesNextAction:contextualBranch?.nextAction==='REASSESS_CONFLICT_WITH_DISCRIMINATING_CONDITION',contextClosureStillBlocked:contextualBranch?.closureBlocked===true&&contextualBranch?.closureAuthority==='NONE',originalConflictPreserved:preservedEvidence.length===2,partialContextWaitsForMissingOrgans:partialBranch?.nextAction==='WAIT_FOR_ADDITIONAL_ADJUDICATION_CONTEXT',unmatchedContextQuarantined:unmatched.adjudicationIntegration?.quarantinedReturns===3,mutatedPacketReplayContained:mutatedReplayIntake.acceptedReturns===1&&mutatedReplayIntake.quarantine[0]?.reasons?.includes('PACKET_ALREADY_RETURNED'),adversarialReturnsQuarantined:['WRONG_RETURNING_ORGAN','REPLAY_DUPLICATE','PACKET_ALREADY_RETURNED','PROVENANCE_REQUIRED','INSUFFICIENT_RETURN_MATERIAL','INSUFFICIENT_TARGET_RELATION','CLAUSE_REF_MISMATCH'].every(r=>hostileReasons.has(r)),unknownPacketQuarantined:unknown.quarantine[0]?.reasons?.includes('UNKNOWN_PACKET')||false,gutRegression:gut?gut.absorbed>0&&gutReturns?.absorbed>0&&gutIntegrated?.absorbed>0:null
  },
  sample:out,returnIntake:intake,contextIntegration:integrated,mutatedReplaySummary:{accepted:mutatedReplayIntake.acceptedReturns,quarantined:mutatedReplayIntake.quarantinedReturns,reasons:mutatedReplayIntake.quarantine.flatMap(x=>x.reasons||[])},adversarialSummary:{accepted:hostile.acceptedReturns,quarantined:hostile.quarantinedReturns,reasons:[...hostileReasons].sort()},failures,
  boundary:'PASS proves deterministic conflict escalation, packet-correlated return intake, one-return-per-issued-packet replay containment, and a feedback step in which accepted DROPLET/MUTHER/SHROOMING adjudication material changes VAJRA nextAction/nextQuestion while preserving the original opposing evidence, provenance, closure block and no-truth-authority boundary. Mutating text or provenance cannot turn the same issued packet into extra organ weight. Complete three-organ context is coverage only, not semantic adjudication or proof of source independence.'
};
await fs.writeFile('nostromo/integration/vajra-conflict-escalation-last-result.json',JSON.stringify(result,null,2)+'\n','utf8');
console.log(JSON.stringify(result,null,2));
if(failures.length)process.exitCode=1;