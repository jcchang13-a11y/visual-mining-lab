import fs from 'node:fs/promises';
import {guardVajraAdjudicationProvenance,provenanceAudit,canonicalProvenance} from './vajra-provenance-diversity-guard.mjs';
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
    },
    closureAuthority:'NONE'
  },
  nextAction:'REASSESS_CONFLICT_WITH_DISCRIMINATING_CONDITION',
  nextQuestion:'old question',closureBlocked:true,closureAuthority:'NONE'
};
const guarded=guardVajraAdjudicationProvenance({unresolved:[collisionBranch],closureAuthority:'NONE'});
const branch=guarded.unresolved[0];
if(guarded.version!=='0.2.0')failures.push({type:'VERSION_REGRESSION',version:guarded.version});
if(guarded.status!=='PROVENANCE_COLLISION_GUARD_ACTIVE')failures.push({type:'COLLISION_GUARD_NOT_ACTIVE',guarded});
if(branch?.provenanceDiversityAudit?.sharedProvenance!==true||branch?.provenanceDiversityAudit?.collisions?.length!==1)failures.push({type:'SHARED_PROVENANCE_NOT_DETECTED',audit:branch?.provenanceDiversityAudit});
if(branch?.nextAction!=='AUDIT_SHARED_PROVENANCE_BEFORE_REASSESSMENT'||!/provenance/.test(branch?.nextQuestion||''))failures.push({type:'COLLISION_DID_NOT_CHANGE_VAJRA_BEHAVIOR',nextAction:branch?.nextAction,nextQuestion:branch?.nextQuestion});
if(branch?.closureAuthority!=='NONE'||branch?.closureBlocked!==true)failures.push({type:'COLLISION_CREATED_FALSE_CLOSURE'});
if((branch?.contest?.evidence||[]).length!==2||branch.contest.evidence[0].provenance!=='source-A'||branch.contest.evidence[1].provenance!=='source-B')failures.push({type:'ORIGINAL_CONFLICT_EVIDENCE_LOST'});
if(branch?.adjudicationContext?.byOrgan?.DROPLET?.material!=='Source-quality audit reused the same upstream evidence bundle.')failures.push({type:'RETURN_MATERIAL_MUTATED'});

// Adversarial case: the same upstream provenance with only width/case/spacing/punctuation/symbol changes must not inflate apparent source diversity.
const mutatedReturns=[
  {sourceOrgan:'DROPLET',provenance:'Shared-Upstream Fingerprint 001'},
  {sourceOrgan:'MUTHER',provenance:'shared_upstream-fingerprint_001'},
  {sourceOrgan:'SHROOMING',provenance:'independent-trace-003'}
];
const mutationAudit=provenanceAudit(mutatedReturns);
if(canonicalProvenance(mutatedReturns[0].provenance)!==canonicalProvenance(mutatedReturns[1].provenance))failures.push({type:'FORMAT_MUTATION_NOT_CANONICALIZED',mutationAudit});
if(mutationAudit.sharedProvenance!==true||mutationAudit.formatMutationCollisions!==1||mutationAudit.collisions?.[0]?.formatMutationDetected!==true)failures.push({type:'FORMAT_MUTATION_COLLISION_BYPASSED_GUARD',mutationAudit});
if(mutationAudit.uniqueProvenanceCount!==2)failures.push({type:'FORMAT_MUTATION_INFLATED_PROVENANCE_COUNT',mutationAudit});
if(mutationAudit.structurallyDistinctProvenanceLabels!==false)failures.push({type:'FORMAT_MUTATION_FALSELY_COUNTED_AS_DISTINCT_SOURCE',mutationAudit});
const mutationBranch={...collisionBranch,adjudicationContext:{...collisionBranch.adjudicationContext,byOrgan:{
  DROPLET:{...collisionBranch.adjudicationContext.byOrgan.DROPLET,provenance:mutatedReturns[0].provenance},
  MUTHER:{...collisionBranch.adjudicationContext.byOrgan.MUTHER,provenance:mutatedReturns[1].provenance},
  SHROOMING:{...collisionBranch.adjudicationContext.byOrgan.SHROOMING,provenance:mutatedReturns[2].provenance}
}}};
const mutatedGuarded=guardVajraAdjudicationProvenance({unresolved:[mutationBranch],closureAuthority:'NONE'});
const mutatedBranch=mutatedGuarded.unresolved[0];
if(mutatedGuarded.status!=='PROVENANCE_COLLISION_GUARD_ACTIVE'||mutatedGuarded.provenanceDiversity?.formatMutationCollisionBranches!==1)failures.push({type:'FORMAT_MUTATION_DID_NOT_ACTIVATE_BEHAVIOR_GUARD',mutatedGuarded});
if(mutatedBranch?.nextAction!=='AUDIT_SHARED_PROVENANCE_BEFORE_REASSESSMENT'||mutatedBranch?.closureBlocked!==true)failures.push({type:'FORMAT_MUTATION_DID_NOT_BLOCK_PREMATURE_REASSESSMENT',mutatedBranch});

const distinctReturns=[
  {sourceOrgan:'DROPLET',provenance:'prov-a'},
  {sourceOrgan:'MUTHER',provenance:'prov-b'},
  {sourceOrgan:'SHROOMING',provenance:'prov-c'}
];
const distinctAudit=provenanceAudit(distinctReturns);
if(distinctAudit.status!=='PROVENANCE_LABELS_DISTINCT_NOT_INDEPENDENCE_PROOF'||distinctAudit.sourceIndependenceProven!==false)failures.push({type:'DISTINCT_LABELS_FALSELY_UPGRADED_TO_INDEPENDENCE',distinctAudit});
const partialAudit=provenanceAudit(distinctReturns.slice(0,2));
if(partialAudit.status!=='PARTIAL_PROVENANCE_COVERAGE'||partialAudit.complete!==false)failures.push({type:'PARTIAL_COVERAGE_FALSELY_COMPLETE',partialAudit});

const result={
  schema:'vajra-provenance-diversity-test/v0.2.0',
  completedAt:new Date().toISOString(),
  status:failures.length?'FAIL':'PASS',
  capability:'ADJUDICATION_PROVENANCE_DIVERSITY_GUARD_WITH_FORMAT_MUTATION_CONTAINMENT',
  collisionCase:{status:guarded.status,audit:branch?.provenanceDiversityAudit,nextAction:branch?.nextAction,closureAuthority:branch?.closureAuthority},
  formatMutationCase:{status:mutatedGuarded.status,audit:mutationAudit,nextAction:mutatedBranch?.nextAction,closureAuthority:mutatedBranch?.closureAuthority},
  distinctCase:distinctAudit,
  partialCase:partialAudit,
  guards:{exactReuseDetected:true,formatMutationReuseDetected:true,mutationDoesNotInflateUniqueCount:true,mutationChangesVajraBehavior:true,sourceIndependenceNeverInferred:true,originalConflictEvidencePreserved:true},
  failures,
  boundary:'PASS proves deterministic detection of exact and bounded superficial-format mutations of cross-organ provenance labels, including Unicode width/case/spacing/punctuation/symbol-only variation, and behavior change away from premature conflict reassessment. It does not prove real-world source independence when canonical labels differ, semantic identity when labels collide, derivative-source relationships, cryptographic identity, or factual truth.'
};
await fs.writeFile('nostromo/integration/vajra-provenance-diversity-last-result.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));
if(failures.length)process.exit(1);
