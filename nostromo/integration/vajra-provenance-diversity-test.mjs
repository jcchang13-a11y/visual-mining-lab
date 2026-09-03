import fs from 'node:fs/promises';
import {guardVajraAdjudicationProvenance,provenanceAudit,canonicalProvenance,canonicalMaterial,boundedNearDuplicate,semanticOperatorSignature} from './vajra-provenance-diversity-guard.mjs';
const failures=[];

const baseEvidence=[
  {evidenceKey:'e-support',provenance:'source-A',polarity:'SUPPORTS',relation:'supports under condition A'},
  {evidenceKey:'e-refute',provenance:'source-B',polarity:'REFUTES',relation:'refutes under matched condition A'}
];
const shared='shared-upstream-fingerprint-001';
const collisionBranch={
  targetRef:'t001',clauseRef:'c001',lens:'evidence',status:'CONTESTED_WITH_ADJUDICATION_CONTEXT',
  contest:{status:'CONTESTED_BY_RECEIPTS',evidence:baseEvidence},
  adjudicationContext:{
    complete:true,receivedOrgans:['DROPLET','MUTHER','SHROOMING'],missingOrgans:[],
    byOrgan:{
      DROPLET:{sourceOrgan:'DROPLET',packetId:'p1',returnKey:'r1',provenance:shared,material:'Source-quality audit reused the same upstream evidence bundle.',relation:'The source comparison derives from the shared upstream evidence.'},
      MUTHER:{sourceOrgan:'MUTHER',packetId:'p2',returnKey:'r2',provenance:shared,material:'Context mining reused the same upstream evidence bundle.',relation:'The context interpretation derives from the shared upstream evidence.'},
      SHROOMING:{sourceOrgan:'SHROOMING',packetId:'p3',returnKey:'r3',provenance:'shroom-independent-trace',material:'Boundary stress was generated from a separate recorded trace.',relation:'The boundary reading is structurally separate from the shared upstream bundle.'}
    },closureAuthority:'NONE'
  },nextAction:'REASSESS_CONFLICT_WITH_DISCRIMINATING_CONDITION',nextQuestion:'old question',closureBlocked:true,closureAuthority:'NONE'
};
const guarded=guardVajraAdjudicationProvenance({unresolved:[collisionBranch],closureAuthority:'NONE'});
const branch=guarded.unresolved[0];
if(guarded.version!=='0.3.3')failures.push({type:'VERSION_REGRESSION',version:guarded.version});
if(guarded.status!=='UPSTREAM_REPLAY_GUARD_ACTIVE')failures.push({type:'COLLISION_GUARD_NOT_ACTIVE',guarded});
if(branch?.provenanceDiversityAudit?.sharedProvenance!==true||branch?.provenanceDiversityAudit?.collisions?.length!==1)failures.push({type:'SHARED_PROVENANCE_NOT_DETECTED',audit:branch?.provenanceDiversityAudit});
if(branch?.nextAction!=='AUDIT_SHARED_UPSTREAM_BEFORE_REASSESSMENT'||!/provenance|上游/.test(branch?.nextQuestion||''))failures.push({type:'COLLISION_DID_NOT_CHANGE_VAJRA_BEHAVIOR',nextAction:branch?.nextAction,nextQuestion:branch?.nextQuestion});
if(branch?.closureAuthority!=='NONE'||branch?.closureBlocked!==true)failures.push({type:'COLLISION_CREATED_FALSE_CLOSURE'});
if((branch?.contest?.evidence||[]).length!==2||branch.contest.evidence[0].provenance!=='source-A'||branch.contest.evidence[1].provenance!=='source-B')failures.push({type:'ORIGINAL_CONFLICT_EVIDENCE_LOST'});

const mutatedReturns=[
  {sourceOrgan:'DROPLET',provenance:'Shared-Upstream Fingerprint 001'},
  {sourceOrgan:'MUTHER',provenance:'shared_upstream-fingerprint_001'},
  {sourceOrgan:'SHROOMING',provenance:'independent-trace-003'}
];
const mutationAudit=provenanceAudit(mutatedReturns);
if(canonicalProvenance(mutatedReturns[0].provenance)!==canonicalProvenance(mutatedReturns[1].provenance))failures.push({type:'FORMAT_MUTATION_NOT_CANONICALIZED',mutationAudit});
if(mutationAudit.sharedProvenance!==true||mutationAudit.formatMutationCollisions!==1)failures.push({type:'FORMAT_MUTATION_COLLISION_BYPASSED_GUARD',mutationAudit});
if(mutationAudit.uniqueProvenanceCount!==2||mutationAudit.structurallyDistinctProvenanceLabels!==false)failures.push({type:'FORMAT_MUTATION_INFLATED_PROVENANCE_COUNT',mutationAudit});

const replayA='The same upstream evidence says the intervention improved outcome X under bounded condition Y.';
const replayB='ＴＨＥ same upstream evidence — says the intervention improved outcome X under bounded condition Y!';
const contentReplayReturns=[
  {sourceOrgan:'DROPLET',provenance:'web-source-family-A',material:replayA},
  {sourceOrgan:'MUTHER',provenance:'drive-note-family-B',material:replayB},
  {sourceOrgan:'SHROOMING',provenance:'trace-family-C',material:'A separate boundary reading asks whether condition Y excludes the observed counterexample.'}
];
const contentReplayAudit=provenanceAudit(contentReplayReturns);
if(canonicalMaterial(replayA)!==canonicalMaterial(replayB))failures.push({type:'CONTENT_FORMAT_MUTATION_NOT_CANONICALIZED',contentReplayAudit});
if(contentReplayAudit.sharedProvenance!==false||contentReplayAudit.sharedContent!==true||contentReplayAudit.contentCollisions?.length!==1)failures.push({type:'DISTINCT_PROVENANCE_CONTENT_REPLAY_NOT_DETECTED',contentReplayAudit});
if(contentReplayAudit.contentFormatMutationCollisions!==1||contentReplayAudit.status!=='UPSTREAM_REPLAY_REVIEW_REQUIRED')failures.push({type:'CONTENT_REPLAY_DID_NOT_TRIGGER_REVIEW',contentReplayAudit});
const replayBranch={...collisionBranch,adjudicationContext:{...collisionBranch.adjudicationContext,byOrgan:{
  DROPLET:{...collisionBranch.adjudicationContext.byOrgan.DROPLET,provenance:contentReplayReturns[0].provenance,material:contentReplayReturns[0].material},
  MUTHER:{...collisionBranch.adjudicationContext.byOrgan.MUTHER,provenance:contentReplayReturns[1].provenance,material:contentReplayReturns[1].material},
  SHROOMING:{...collisionBranch.adjudicationContext.byOrgan.SHROOMING,provenance:contentReplayReturns[2].provenance,material:contentReplayReturns[2].material}
}}};
const replayGuarded=guardVajraAdjudicationProvenance({unresolved:[replayBranch],closureAuthority:'NONE'});
const replayGuardedBranch=replayGuarded.unresolved[0];
if(replayGuarded.status!=='UPSTREAM_REPLAY_GUARD_ACTIVE'||replayGuarded.provenanceDiversity?.contentCollisionBranches!==1)failures.push({type:'CONTENT_REPLAY_DID_NOT_ACTIVATE_BEHAVIOR_GUARD',replayGuarded});
if(replayGuardedBranch?.nextAction!=='AUDIT_CROSS_ORGAN_CONTENT_REPLAY_BEFORE_REASSESSMENT'||replayGuardedBranch?.closureBlocked!==true)failures.push({type:'CONTENT_REPLAY_DID_NOT_BLOCK_PREMATURE_REASSESSMENT',replayGuardedBranch});
if(replayGuardedBranch?.adjudicationContext?.byOrgan?.MUTHER?.material!==replayB)failures.push({type:'RAW_REPLAY_RETURN_MUTATED'});

const operatorPairs=[
  ['score > 10','score < 10'],
  ['A + B','A - B'],
  ['p = 0.05','p != 0.05'],
  ['x >= 4','x <= 4'],
  ['A * B','A / B'],
  ['A × B','A ÷ B']
];
for(const [a,b] of operatorPairs){
  if(canonicalMaterial(a)===canonicalMaterial(b))failures.push({type:'SEMANTIC_OPERATOR_COLLISION',a,b,canonical:canonicalMaterial(a)});
  if(semanticOperatorSignature(a).join('|')===semanticOperatorSignature(b).join('|'))failures.push({type:'SEMANTIC_OPERATOR_SIGNATURE_COLLISION',a,b,signatureA:semanticOperatorSignature(a),signatureB:semanticOperatorSignature(b)});
}
const operatorDistinctA='The threshold result is score > 10 under the registered measurement rule and retained analysis window.';
const operatorDistinctB='The threshold result is score < 10 under the registered measurement rule and retained analysis window.';
const operatorDistinctProbe=boundedNearDuplicate(operatorDistinctA,operatorDistinctB);
const operatorDistinctReturns=[
  {sourceOrgan:'DROPLET',provenance:'op-a',material:operatorDistinctA},
  {sourceOrgan:'MUTHER',provenance:'op-b',material:operatorDistinctB},
  {sourceOrgan:'SHROOMING',provenance:'op-c',material:'A separate boundary reading questions whether the threshold rule applies after the measurement window shifts.'}
];
const operatorDistinctAudit=provenanceAudit(operatorDistinctReturns);
if(operatorDistinctAudit.sharedContent===true)failures.push({type:'OPERATOR_DISTINCT_MATERIAL_FALSELY_EXACT_REPLAY',operatorDistinctAudit});
if(operatorDistinctProbe.match!==false||operatorDistinctProbe.mode!=='SEMANTIC_OPERATOR_DIVERGENCE')failures.push({type:'OPERATOR_DIVERGENCE_FALSELY_NEAR_REPLAY',operatorDistinctProbe});
if(operatorDistinctAudit.nearSharedContent!==false||operatorDistinctAudit.replayRisk!==false||operatorDistinctAudit.status!=='PROVENANCE_LABELS_DISTINCT_NOT_INDEPENDENCE_PROOF')failures.push({type:'OPERATOR_DIVERGENCE_FALSELY_BLOCKED_REASSESSMENT',operatorDistinctAudit});

const multiplicativeDistinctA='The registered model applies outcome = exposure * duration under the retained analysis window and calibrated scale.';
const multiplicativeDistinctB='The registered model applies outcome = exposure / duration under the retained analysis window and calibrated scale.';
const multiplicativeProbe=boundedNearDuplicate(multiplicativeDistinctA,multiplicativeDistinctB);
if(multiplicativeProbe.match!==false||multiplicativeProbe.mode!=='SEMANTIC_OPERATOR_DIVERGENCE')failures.push({type:'MULTIPLICATION_DIVISION_DIVERGENCE_FALSELY_NEAR_REPLAY',multiplicativeProbe});

const nearReplayA='The intervention improved outcome X under bounded condition Y after the measurement protocol excluded baseline drift and preserved the original comparison window.';
const nearReplayB='Context note: The intervention improved outcome X under bounded condition Y after the measurement protocol excluded baseline drift and preserved the original comparison window. [replayed]';
const nearReplayProbe=boundedNearDuplicate(nearReplayA,nearReplayB);
const nearReplayReturns=[
  {sourceOrgan:'DROPLET',provenance:'web-family-near-A',material:nearReplayA},
  {sourceOrgan:'MUTHER',provenance:'drive-family-near-B',material:nearReplayB},
  {sourceOrgan:'SHROOMING',provenance:'trace-family-near-C',material:'A genuinely different boundary reading asks whether outcome X disappears when the comparison window is shifted before intervention exposure.'}
];
const nearReplayAudit=provenanceAudit(nearReplayReturns);
if(!nearReplayProbe.match||nearReplayProbe.score<0.82)failures.push({type:'BOUNDED_NEAR_REPLAY_PROBE_MISSED',nearReplayProbe});
if(nearReplayAudit.sharedContent!==false||nearReplayAudit.nearSharedContent!==true||nearReplayAudit.nearContentCollisions?.length!==1)failures.push({type:'WRAPPER_NEAR_REPLAY_NOT_DETECTED',nearReplayAudit});
if(nearReplayAudit.status!=='UPSTREAM_REPLAY_REVIEW_REQUIRED')failures.push({type:'WRAPPER_NEAR_REPLAY_DID_NOT_TRIGGER_REVIEW',nearReplayAudit});
const nearReplayBranch={...collisionBranch,adjudicationContext:{...collisionBranch.adjudicationContext,byOrgan:{
  DROPLET:{...collisionBranch.adjudicationContext.byOrgan.DROPLET,provenance:nearReplayReturns[0].provenance,material:nearReplayReturns[0].material},
  MUTHER:{...collisionBranch.adjudicationContext.byOrgan.MUTHER,provenance:nearReplayReturns[1].provenance,material:nearReplayReturns[1].material},
  SHROOMING:{...collisionBranch.adjudicationContext.byOrgan.SHROOMING,provenance:nearReplayReturns[2].provenance,material:nearReplayReturns[2].material}
}}};
const nearGuarded=guardVajraAdjudicationProvenance({unresolved:[nearReplayBranch],closureAuthority:'NONE'});
const nearGuardedBranch=nearGuarded.unresolved[0];
if(nearGuarded.provenanceDiversity?.nearContentCollisionBranches!==1||nearGuardedBranch?.closureBlocked!==true)failures.push({type:'WRAPPER_NEAR_REPLAY_DID_NOT_CHANGE_VAJRA_BEHAVIOR',nearGuarded});
if(nearGuardedBranch?.adjudicationContext?.byOrgan?.MUTHER?.material!==nearReplayB)failures.push({type:'RAW_NEAR_REPLAY_RETURN_MUTATED'});

const distinctReturns=[
  {sourceOrgan:'DROPLET',provenance:'prov-a',material:'Independent material A with enough substantive length to be auditable and a distinct measurement description.'},
  {sourceOrgan:'MUTHER',provenance:'prov-b',material:'Independent material B with enough substantive length to be auditable and a separate historical mechanism.'},
  {sourceOrgan:'SHROOMING',provenance:'prov-c',material:'Independent material C with enough substantive length to be auditable and a competing boundary interpretation.'}
];
const distinctAudit=provenanceAudit(distinctReturns);
if(distinctAudit.status!=='PROVENANCE_LABELS_DISTINCT_NOT_INDEPENDENCE_PROOF'||distinctAudit.sourceIndependenceProven!==false||distinctAudit.sharedContent!==false||distinctAudit.nearSharedContent!==false)failures.push({type:'DISTINCT_RETURNS_FALSELY_UPGRADED_OR_COLLIDED',distinctAudit});
const partialAudit=provenanceAudit(distinctReturns.slice(0,2));
if(partialAudit.status!=='PARTIAL_PROVENANCE_COVERAGE'||partialAudit.complete!==false)failures.push({type:'PARTIAL_COVERAGE_FALSELY_COMPLETE',partialAudit});

const result={
  schema:'vajra-provenance-diversity-test/v0.3.3',completedAt:new Date().toISOString(),status:failures.length?'FAIL':'PASS',
  capability:'ADJUDICATION_PROVENANCE_DIVERSITY_OPERATOR_DIVERGENCE_AWARE_EXACT_AND_BOUNDED_NEAR_CONTENT_REPLAY_GUARD',
  collisionCase:{status:guarded.status,audit:branch?.provenanceDiversityAudit,nextAction:branch?.nextAction,closureAuthority:branch?.closureAuthority},
  provenanceFormatMutationCase:mutationAudit,
  contentReplayCase:{status:replayGuarded.status,audit:contentReplayAudit,nextAction:replayGuardedBranch?.nextAction,closureAuthority:replayGuardedBranch?.closureAuthority},
  operatorPreservationCase:{pairs:operatorPairs,probe:operatorDistinctProbe,multiplicativeProbe,audit:operatorDistinctAudit},
  nearReplayCase:{probe:nearReplayProbe,audit:nearReplayAudit,status:nearGuarded.status,nextAction:nearGuardedBranch?.nextAction,closureAuthority:nearGuardedBranch?.closureAuthority},
  distinctCase:distinctAudit,partialCase:partialAudit,
  guards:{exactProvenanceReuseDetected:true,provenanceFormatMutationDetected:true,crossOrganContentReplayDetected:true,contentFormatMutationDetected:true,semanticOperatorsPreserved:true,multiplicationDivisionOperatorsPreserved:true,operatorDivergenceOverridesLexicalNearReplay:true,boundedWrapperNearReplayDetected:true,distinctProvenanceCannotHideReplay:true,replayChangesVajraBehavior:true,sourceIndependenceNeverInferred:true,rawReturnsPreserved:true},
  failures,
  boundary:'PASS proves deterministic detection of exact/bounded-format provenance reuse, operator-preserving exact canonical cross-organ content replay, and bounded high-overlap lexical replay when one organ lightly wraps another organ’s sufficiently long material. Comparison, equality, addition/subtraction, multiplication and division operators are protected. When both materials contain explicit operators and their operator signatures diverge, lexical overlap no longer falsely collapses them into near replay. This is syntactic operator protection, not semantic theorem proving. Raw returns remain preserved and source independence is never inferred.'
};
await fs.writeFile('nostromo/integration/vajra-provenance-diversity-last-result.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));
if(failures.length)process.exit(1);
