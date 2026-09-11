import assert from 'node:assert/strict';
import { evaluateInternalMutation } from './internal-mutation.mjs';
import { verifyMutationDerivation } from './internal-mutation-derivation-witness.mjs';
import { deriveMutationLineageFingerprint, deriveOrganReviewWitnessFingerprint, evaluateMutationCrossOrganGate } from './internal-mutation-cross-organ-gate.mjs';

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

function receipt(organ, provenance, reviewRunId) {
  const reviewWitness = {
    organ,
    kind: organ === 'GUT' ? 'METABOLIC_CONTAMINATION_REVIEW' : 'CONTRADICTION_COUNTEREXAMPLE_REVIEW',
    candidateId:candidate.candidateId,
    lineageFingerprint,
    derivationFingerprint:derivationWitness.derivationFingerprint,
    reviewRunId,
    evidenceRefs: organ === 'GUT' ? ['gut:evidence:echo','gut:evidence:provenance'] : ['vajra:evidence:counterexample','vajra:evidence:contradiction'],
    checks: organ === 'GUT' ? {echoChecked:true,duplicateChecked:true,provenanceChecked:true} : {contradictionChecked:true,counterexampleChecked:true,provenanceChecked:true}
  };
  reviewWitness.reviewWitnessFingerprint = deriveOrganReviewWitnessFingerprint(reviewWitness);
  return { organ,status:'PASS',candidateId:candidate.candidateId,lineageFingerprint,derivationFingerprint:derivationWitness.derivationFingerprint,provenance,reviewRunId,reviewWitness };
}
const gut=receipt('GUT','gut/stress-run-01','gut-review-run-01');
const vajra=receipt('VAJRA','vajra/adversarial-run-01','vajra-review-run-01');
const eligible=evaluateMutationCrossOrganGate({candidate,lineageFingerprint,derivationWitness,gutReceipt:gut,vajraReceipt:vajra});
assert.equal(eligible.status,'ELIGIBLE_FOR_CONTROLLED_INCORPORATION_STAGE');
assert.equal(eligible.crossOrganAgreement,true);
assert.equal(eligible.reviewWitnessFingerprints.length,2);
assert.equal(eligible.incorporationAuthorized,false);
assert.equal(eligible.bodyMutationApplied,false);

// The recorded weakness: two syntactically independent bare PASS receipts must not advance.
const bareGut={...gut}; delete bareGut.reviewWitness;
const bareVajra={...vajra}; delete bareVajra.reviewWitness;
const bare=evaluateMutationCrossOrganGate({candidate,lineageFingerprint,derivationWitness,gutReceipt:bareGut,vajraReceipt:bareVajra});
assert.equal(bare.status,'HOLD');
assert.equal(bare.reason,'GUT_REVIEW_WITNESS_REQUIRED');

const incompleteGut=structuredClone(gut); incompleteGut.reviewWitness.checks.echoChecked=false; incompleteGut.reviewWitness.reviewWitnessFingerprint=deriveOrganReviewWitnessFingerprint(incompleteGut.reviewWitness);
const incomplete=evaluateMutationCrossOrganGate({candidate,lineageFingerprint,derivationWitness,gutReceipt:incompleteGut,vajraReceipt:vajra});
assert.equal(incomplete.status,'HOLD');
assert.equal(incomplete.reason,'GUT_REVIEW_CHECKS_INCOMPLETE');

const tampered=structuredClone(vajra); tampered.reviewWitness.evidenceRefs.push('vajra:evidence:post-review-injection');
const tamperedResult=evaluateMutationCrossOrganGate({candidate,lineageFingerprint,derivationWitness,gutReceipt:gut,vajraReceipt:tampered});
assert.equal(tamperedResult.status,'HOLD');
assert.equal(tamperedResult.reason,'VAJRA_REVIEW_WITNESS_FINGERPRINT_INVALID');

const swapped=structuredClone(vajra); swapped.reviewWitness.reviewRunId='other-run'; swapped.reviewWitness.reviewWitnessFingerprint=deriveOrganReviewWitnessFingerprint(swapped.reviewWitness);
const swappedResult=evaluateMutationCrossOrganGate({candidate,lineageFingerprint,derivationWitness,gutReceipt:gut,vajraReceipt:swapped});
assert.equal(swappedResult.status,'HOLD');
assert.equal(swappedResult.reason,'VAJRA_REVIEW_WITNESS_BINDING_MISMATCH');

const sharedRun=evaluateMutationCrossOrganGate({candidate,lineageFingerprint,derivationWitness,gutReceipt:{...gut,reviewRunId:' shared-run ',reviewWitness:{...gut.reviewWitness,reviewRunId:'shared-run'}},vajraReceipt:{...vajra,reviewRunId:'ｓｈａｒｅｄ－ｒｕｎ',reviewWitness:{...vajra.reviewWitness,reviewRunId:'ｓｈａｒｅｄ－ｒｕｎ'}}});
assert.equal(sharedRun.status,'HOLD');

const tamperedCandidate=structuredClone(candidate); tamperedCandidate.candidateTraits[0].value='post-review-unseen-typography';
const stale=evaluateMutationCrossOrganGate({candidate:tamperedCandidate,lineageFingerprint,derivationWitness,gutReceipt:gut,vajraReceipt:vajra});
assert.equal(stale.status,'HOLD');
assert.equal(stale.reason,'MUTHER_CALLER_LINEAGE_NOT_BOUND_TO_CANDIDATE');

console.log(JSON.stringify({schema:'zenomorph-muther-internal-mutation-cross-organ-gate-test/v0.5',status:'PASS',capability:'MUTHER_MUTATION_REQUIRES_EVIDENCE_BOUND_GUT_AND_VAJRA_REVIEW_WITNESSES',boundary:'PASS proves protocol containment: bare PASS labels, incomplete organ checks, witness tampering and binding swaps stay HOLD. Review witnesses remain bounded protocol evidence, not proof of truth and not authority to mutate the persistent body.'},null,2));
