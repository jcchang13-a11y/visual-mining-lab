import assert from 'node:assert/strict';
import { evaluateInternalMutation } from './internal-mutation.mjs';
import { verifyMutationDerivation } from './internal-mutation-derivation-witness.mjs';
import { deriveMutationLineageFingerprint, deriveOrganReviewWitnessFingerprint, evaluateMutationCrossOrganGate } from './internal-mutation-cross-organ-gate.mjs';
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

function reviewWitness(organ, reviewRunId) {
  const witness = {
    organ,
    kind: organ === 'GUT' ? 'METABOLIC_CONTAMINATION_REVIEW' : 'CONTRADICTION_COUNTEREXAMPLE_REVIEW',
    candidateId:candidate.candidateId,
    lineageFingerprint,
    derivationFingerprint:derivationWitness.derivationFingerprint,
    reviewRunId,
    evidenceRefs: organ === 'GUT' ? ['gut:evidence:echo','gut:evidence:provenance'] : ['vajra:evidence:counterexample','vajra:evidence:contradiction'],
    checks: organ === 'GUT' ? {echoChecked:true,duplicateChecked:true,provenanceChecked:true} : {contradictionChecked:true,counterexampleChecked:true,provenanceChecked:true}
  };
  witness.reviewWitnessFingerprint = deriveOrganReviewWitnessFingerprint(witness);
  return witness;
}

function issuedReceipt(organ, provenance, reviewRunId) {
  const witness = reviewWitness(organ, reviewRunId);
  const common = {
    candidateId:candidate.candidateId,
    lineageFingerprint,
    derivationFingerprint:derivationWitness.derivationFingerprint,
    provenance,
    reviewRunId,
    evidenceRefs:witness.evidenceRefs,
    reviewWitnessFingerprint:witness.reviewWitnessFingerprint
  };
  return organ === 'GUT' ? issueGutMutationReviewReceipt(common) : issueVajraMutationReviewReceipt(common);
}

const gut = issuedReceipt('GUT','gut/stress-run-01','gut-review-run-01');
const vajra = issuedReceipt('VAJRA','vajra/adversarial-run-01','vajra-review-run-01');
const eligible = evaluateMutationCrossOrganGate({candidate,lineageFingerprint,derivationWitness,gutReceipt:gut,vajraReceipt:vajra});
assert.equal(eligible.status,'ELIGIBLE_FOR_CONTROLLED_INCORPORATION_STAGE');
assert.equal(eligible.crossOrganAgreement,true);
assert.equal(eligible.organIssuedReviewReceipts,true);
assert.equal(eligible.issuerModules.length,2);
assert.equal(eligible.issuerFingerprints.length,2);
assert.equal(eligible.incorporationAuthorized,false);
assert.equal(eligible.bodyMutationApplied,false);

// A caller-built receipt can reproduce the visible fields but has no organ-issued protocol binding.
const forgedGut = {
  organ:'GUT',status:'PASS',candidateId:candidate.candidateId,lineageFingerprint,
  derivationFingerprint:derivationWitness.derivationFingerprint,provenance:'gut/fake-run',reviewRunId:'gut-fake-run',
  reviewWitness:reviewWitness('GUT','gut-fake-run')
};
const forged = evaluateMutationCrossOrganGate({candidate,lineageFingerprint,derivationWitness,gutReceipt:forgedGut,vajraReceipt:vajra});
assert.equal(forged.status,'HOLD');
assert.equal(forged.reason,'GUT_ISSUER_MODULE_REQUIRED');

// Post-issuance editing invalidates the organ receipt before the inner witness can be trusted.
const tamperedGut = structuredClone(gut);
tamperedGut.reviewWitness.evidenceRefs.push('gut:evidence:post-issue-injection');
const tampered = evaluateMutationCrossOrganGate({candidate,lineageFingerprint,derivationWitness,gutReceipt:tamperedGut,vajraReceipt:vajra});
assert.equal(tampered.status,'HOLD');
assert.equal(tampered.reason,'GUT_ISSUER_FINGERPRINT_INVALID');

const swappedVajra = structuredClone(vajra);
swappedVajra.reviewRunId='other-run';
const swapped = evaluateMutationCrossOrganGate({candidate,lineageFingerprint,derivationWitness,gutReceipt:gut,vajraReceipt:swappedVajra});
assert.equal(swapped.status,'HOLD');
assert.equal(swapped.reason,'VAJRA_ISSUER_FINGERPRINT_INVALID');

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
  schema:'zenomorph-muther-internal-mutation-cross-organ-gate-test/v0.6',
  status:'PASS',
  capability:'MUTHER_MUTATION_REQUIRES_MODULE_BOUND_GUT_AND_VAJRA_REVIEW_RECEIPTS',
  boundary:'PASS proves protocol provenance and tamper containment, not cryptographic organ identity, truth, semantic quality, or authority to mutate the persistent body.'
},null,2));
