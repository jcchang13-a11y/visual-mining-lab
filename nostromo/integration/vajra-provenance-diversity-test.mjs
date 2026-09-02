import fs from 'node:fs/promises';
import {guardVajraAdjudicationProvenance,provenanceAudit,canonicalProvenance,canonicalMaterial} from './vajra-provenance-diversity-guard.mjs';
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
if(guarded.version!=='0.3.0')failures.push({type:'VERSION_REGRESSION',version:guarded.version});
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

// Adversarial thickening: different provenance labels must not hide exact/format-mutated replay of the same returned material across organs.
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

const distinctReturns=[
  {sourceOrgan:'DROPLET',provenance:'prov-a',material:'Independent material A with enough substantive length to be auditable.'},
  {sourceOrgan:'MUTHER',provenance:'prov-b',material:'Independent material B with enough substantive length to be auditable.'},
  {sourceOrgan:'SHROOMING',provenance:'prov-c',material:'Independent material C with enough substantive length to be auditable.'}
];
const distinctAudit=provenanceAudit(distinctReturns);
if(distinctAudit.status!=='PROVENANCE_LABELS_DISTINCT_NOT_INDEPENDENCE_PROOF'||distinctAudit.sourceIndependenceProven!==false||distinctAudit.sharedContent!==false)failures.push({type:'DISTINCT_RETURNS_FALSELY_UPGRADED_OR_COLLIDED',distinctAudit});
const partialAudit=provenanceAudit(distinctReturns.slice(0,2));
if(partialAudit.status!=='PARTIAL_PROVENANCE_COVERAGE'||partialAudit.complete!==false)failures.push({type:'PARTIAL_COVERAGE_FALSELY_COMPLETE',partialAudit});

const result={
  schema:'vajra-provenance-diversity-test/v0.3.0',completedAt:new Date().toISOString(),status:failures.length?'FAIL':'PASS',
  capability:'ADJUDICATION_PROVENANCE_DIVERSITY_AND_CROSS_ORGAN_CONTENT_REPLAY_GUARD',
  collisionCase:{status:guarded.status,audit:branch?.provenanceDiversityAudit,nextAction:branch?.nextAction,closureAuthority:branch?.closureAuthority},
  provenanceFormatMutationCase:mutationAudit,
  contentReplayCase:{status:replayGuarded.status,audit:contentReplayAudit,nextAction:replayGuardedBranch?.nextAction,closureAuthority:replayGuardedBranch?.closureAuthority},
  distinctCase:distinctAudit,partialCase:partialAudit,
  guards:{exactProvenanceReuseDetected:true,provenanceFormatMutationDetected:true,crossOrganContentReplayDetected:true,contentFormatMutationDetected:true,distinctProvenanceCannotHideReplay:true,replayChangesVajraBehavior:true,sourceIndependenceNeverInferred:true,rawReturnsPreserved:true},
  failures,
  boundary:'PASS proves deterministic detection of exact/bounded-format provenance reuse and cross-organ replay of the same sufficiently long canonical returned material even when provenance labels differ. It blocks premature conflict reassessment and preserves raw returns. It does not prove semantic equivalence beyond canonical identity, derivative-source relationships beyond observed replay, real-world source independence, cryptographic identity, or factual truth.'
};
await fs.writeFile('nostromo/integration/vajra-provenance-diversity-last-result.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));
if(failures.length)process.exit(1);
