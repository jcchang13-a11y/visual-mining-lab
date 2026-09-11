import assert from 'node:assert/strict';
import { evaluateInternalMutation } from './internal-mutation.mjs';
import { verifyMutationDerivation } from './internal-mutation-derivation-witness.mjs';
import { deriveMutationLineageFingerprint, evaluateMutationCrossOrganGate } from './internal-mutation-cross-organ-gate.mjs';
import { reviewGutMutationCandidate } from '../gut/mutation-review-artifact.mjs';
import { reviewVajraMutationCandidate } from '../vajra/mutation-review-artifact.mjs';
import { issueGutMutationReviewReceipt } from '../gut/mutation-review-receipt.mjs';
import { issueVajraMutationReviewReceipt } from '../vajra/mutation-review-receipt.mjs';

const specimens = [
  { id:'theme-01', kind:'theme', traits:[
    { dimension:'typography', value:'compressed-sans', provenance:{artifactRef:'public:theme-01',versionRef:'v1'} },
    { dimension:'layout', value:'dense-grid', provenance:{artifactRef:'public:theme-01',versionRef:'v1'} }
  ]},
  { id:'text-03', kind:'text', traits:[
    { dimension:'cadence', value:'abrupt-fragment', provenance:{artifactRef:'public:text-03',versionRef:'v3'} },
    { dimension:'voice', value:'unstable-first-person', provenance:{artifactRef:'public:text-03',versionRef:'v3'} }
  ]}
];

const candidate = evaluateInternalMutation({ specimens, proposal:{ candidateId:'theme-11-candidate', traits:[
  { dimension:'voice-shell', value:'compressed-sans/unstable-first-person', operation:'hybridize', derivedFrom:[{specimenId:'theme-01',sourceDimension:'typography'},{specimenId:'text-03',sourceDimension:'voice'}] },
  { dimension:'reading-rhythm', value:'dense-grid/abrupt-fragment', operation:'cross-pressure', derivedFrom:[{specimenId:'theme-01',sourceDimension:'layout'},{specimenId:'text-03',sourceDimension:'cadence'}] }
]}});
assert.equal(candidate.status,'SANDBOX_CANDIDATE');

const derivationWitness = verifyMutationDerivation({ specimens, candidate, witnesses:[
  { outputDimension:'voice-shell', recipe:{type:'join',parts:[{specimenId:'theme-01',sourceDimension:'typography'},{literal:'/'},{specimenId:'text-03',sourceDimension:'voice'}]} },
  { outputDimension:'reading-rhythm', recipe:{type:'join',parts:[{specimenId:'theme-01',sourceDimension:'layout'},{literal:'/'},{specimenId:'text-03',sourceDimension:'cadence'}]} }
]});
assert.equal(derivationWitness.status,'DERIVATION_WITNESS_VERIFIED');
const lineageFingerprint = deriveMutationLineageFingerprint(candidate);

const gutFinding = kind => ({
  ECHO_SCAN:{verdict:'CLEAR',observation:'No uncontained inherited-output echo detected in the bounded candidate review.'},
  DUPLICATE_SCAN:{verdict:'CLEAR',observation:'No uncontained duplicate candidate contribution detected in the bounded candidate review.'},
  PROVENANCE_SCAN:{verdict:'TRACEABLE',observation:'All reviewed candidate contributions retain candidate, lineage, derivation and source references.'}
}[kind]);

const boundEvidence = (organ, reviewRunId) => {
  const kinds = organ === 'GUT' ? ['ECHO_SCAN','DUPLICATE_SCAN','PROVENANCE_SCAN'] : ['CONTRADICTION_SCAN','COUNTEREXAMPLE_SCAN','PROVENANCE_SCAN'];
  return kinds.map((kind,index)=>({
    ref:`${organ.toLowerCase()}:review:${reviewRunId}:${index+1}`,
    kind,
    candidateId:candidate.candidateId,
    lineageFingerprint,
    derivationFingerprint:derivationWitness.derivationFingerprint,
    ...(organ==='GUT' ? gutFinding(kind) : {})
  }));
};
function issuedReceipt(organ, provenance, reviewRunId) {
  const common={candidateId:candidate.candidateId,lineageFingerprint,derivationFingerprint:derivationWitness.derivationFingerprint,reviewRunId,evidence:boundEvidence(organ,reviewRunId)};
  const artifact=organ==='GUT' ? reviewGutMutationCandidate(common) : reviewVajraMutationCandidate(common);
  assert.equal(artifact.status,'PASS');
  return organ==='GUT' ? issueGutMutationReviewReceipt({reviewArtifact:artifact,provenance}) : issueVajraMutationReviewReceipt({reviewArtifact:artifact,provenance});
}

const gut = issuedReceipt('GUT','gut/stress-run-01','gut-review-run-01');
const vajra = issuedReceipt('VAJRA','vajra/adversarial-run-01','vajra-review-run-01');
assert.equal(gut.status,'PASS');
assert.equal(vajra.status,'PASS');
const eligible = evaluateMutationCrossOrganGate({candidate,lineageFingerprint,derivationWitness,gutReceipt:gut,vajraReceipt:vajra});
assert.equal(eligible.status,'ELIGIBLE_FOR_CONTROLLED_INCORPORATION_STAGE');
assert.equal(eligible.crossOrganAgreement,true);
assert.equal(eligible.organIssuedReviewReceipts,true);
assert.equal(eligible.issuerModules.length,2);
assert.equal(eligible.issuerFingerprints.length,2);
assert.equal(eligible.incorporationAuthorized,false);
assert.equal(eligible.bodyMutationApplied,false);

// Direct caller assertions can no longer mint PASS without an organ-generated review artifact.
const callerMint = issueGutMutationReviewReceipt({candidateId:candidate.candidateId,lineageFingerprint,derivationFingerprint:derivationWitness.derivationFingerprint,provenance:'gut/fake',reviewRunId:'fake',evidenceRefs:['fake'],reviewWitnessFingerprint:'fake'});
assert.equal(callerMint.status,'HOLD');
assert.equal(callerMint.reason,'GUT_REVIEW_ARTIFACT_REQUIRED');

// Merely naming the three GUT scan kinds is no longer evidence that the scans produced usable findings.
const labelOnlyGut = reviewGutMutationCandidate({
  candidateId:candidate.candidateId,
  lineageFingerprint,
  derivationFingerprint:derivationWitness.derivationFingerprint,
  reviewRunId:'gut-label-only',
  evidence:boundEvidence('GUT','gut-label-only').map(({verdict,observation,...item})=>item)
});
assert.equal(labelOnlyGut.status,'HOLD');
assert.equal(labelOnlyGut.reason,'GUT_REVIEW_EVIDENCE_INCOMPLETE_OR_UNBOUND');

// A substantive finding that reports unresolved contamination blocks PASS instead of being hidden by the scan label.
const contaminatedEvidence = boundEvidence('GUT','gut-contaminated').map(item=>item.kind==='ECHO_SCAN' ? {...item,verdict:'DETECTED',observation:'Repeated inherited output remains uncontained.'} : item);
const contaminatedGut = reviewGutMutationCandidate({candidateId:candidate.candidateId,lineageFingerprint,derivationFingerprint:derivationWitness.derivationFingerprint,reviewRunId:'gut-contaminated',evidence:contaminatedEvidence});
assert.equal(contaminatedGut.status,'HOLD');
assert.equal(contaminatedGut.reason,'GUT_REVIEW_FINDING_BLOCKS_PASS');

// Missing one required organ computation stays HOLD even with otherwise valid bindings.
const incompleteGut = reviewGutMutationCandidate({candidateId:candidate.candidateId,lineageFingerprint,derivationFingerprint:derivationWitness.derivationFingerprint,reviewRunId:'gut-incomplete',evidence:boundEvidence('GUT','gut-incomplete').filter(x=>x.kind!=='PROVENANCE_SCAN')});
assert.equal(incompleteGut.status,'HOLD');
assert.equal(incompleteGut.reason,'GUT_REVIEW_EVIDENCE_INCOMPLETE_OR_UNBOUND');

// An artifact bound to a different candidate cannot be wrapped into a valid receipt.
const wrongEvidence=boundEvidence('VAJRA','vajra-wrong').map(x=>({...x,candidateId:'other-candidate'}));
const wrongArtifact=reviewVajraMutationCandidate({candidateId:candidate.candidateId,lineageFingerprint,derivationFingerprint:derivationWitness.derivationFingerprint,reviewRunId:'vajra-wrong',evidence:wrongEvidence});
assert.equal(wrongArtifact.status,'HOLD');

// Post-review artifact tampering invalidates the receipt path.
const gutArtifact=reviewGutMutationCandidate({candidateId:candidate.candidateId,lineageFingerprint,derivationFingerprint:derivationWitness.derivationFingerprint,reviewRunId:'gut-tamper',evidence:boundEvidence('GUT','gut-tamper')});
const tamperedArtifact=structuredClone(gutArtifact);
tamperedArtifact.evidence[0].ref='gut:injected:after-review';
const tamperedReceipt=issueGutMutationReviewReceipt({reviewArtifact:tamperedArtifact,provenance:'gut/tampered'});
assert.equal(tamperedReceipt.status,'HOLD');
assert.equal(tamperedReceipt.reason,'GUT_REVIEW_ARTIFACT_FINGERPRINT_INVALID');

// Post-issuance editing still invalidates the organ receipt.
const tamperedGut = structuredClone(gut);
tamperedGut.reviewWitness.evidenceRefs.push('gut:evidence:post-issue-injection');
const tampered = evaluateMutationCrossOrganGate({candidate,lineageFingerprint,derivationWitness,gutReceipt:tamperedGut,vajraReceipt:vajra});
assert.equal(tampered.status,'HOLD');
assert.equal(tampered.reason,'GUT_ISSUER_FINGERPRINT_INVALID');

// Unicode/whitespace aliases still cannot manufacture review-run independence.
const sharedGut = issuedReceipt('GUT','gut/shared',' shared-run ');
const sharedVajra = issuedReceipt('VAJRA','vajra/shared','ｓｈａｒｅｄ－ｒｕｎ');
const sharedRun = evaluateMutationCrossOrganGate({candidate,lineageFingerprint,derivationWitness,gutReceipt:sharedGut,vajraReceipt:sharedVajra});
assert.equal(sharedRun.status,'HOLD');
assert.equal(sharedRun.reason,'CROSS_ORGAN_REVIEW_RUN_INDEPENDENCE_NOT_DEMONSTRATED');

const tamperedCandidate=structuredClone(candidate);
tamperedCandidate.candidateTraits[0].value='post-review-unseen-typography';
const stale=evaluateMutationCrossOrganGate({candidate:tamperedCandidate,lineageFingerprint,derivationWitness,gutReceipt:gut,vajraReceipt:vajra});
assert.equal(stale.status,'HOLD');
assert.equal(stale.reason,'MUTHER_CALLER_LINEAGE_NOT_BOUND_TO_CANDIDATE');

console.log(JSON.stringify({
  schema:'zenomorph-muther-internal-mutation-cross-organ-gate-test/v0.8',
  status:'PASS',
  capability:'MUTHER_MUTATION_REQUIRES_SUBSTANTIVE_GUT_FINDINGS_PLUS_MACHINE_DERIVED_GUT_AND_VAJRA_REVIEW_ARTIFACTS_BEFORE_RECEIPTS',
  boundary:'PASS proves GUT review labels alone cannot satisfy the mutation gate: each required GUT scan must carry a bounded acceptable finding, while organ review artifacts remain candidate-bound and module-derived. It does not prove truth, cryptographic organ identity, or authority to mutate the persistent body.'
},null,2));
