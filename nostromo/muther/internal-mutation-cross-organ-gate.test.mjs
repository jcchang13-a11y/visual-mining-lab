import assert from 'node:assert/strict';
import { evaluateInternalMutation } from './internal-mutation.mjs';
import { verifyMutationDerivation } from './internal-mutation-derivation-witness.mjs';
import { deriveMutationLineageFingerprint, evaluateMutationCrossOrganGate } from './internal-mutation-cross-organ-gate.mjs';

const specimens = [
  {
    id: 'theme-01',
    kind: 'theme',
    traits: [
      { dimension: 'typography', value: 'compressed-sans', provenance: { artifactRef: 'public:theme-01', versionRef: 'v1' } },
      { dimension: 'layout', value: 'dense-grid', provenance: { artifactRef: 'public:theme-01', versionRef: 'v1' } }
    ]
  },
  {
    id: 'text-03',
    kind: 'text',
    traits: [
      { dimension: 'cadence', value: 'abrupt-fragment', provenance: { artifactRef: 'public:text-03', versionRef: 'v3' } },
      { dimension: 'voice', value: 'unstable-first-person', provenance: { artifactRef: 'public:text-03', versionRef: 'v3' } }
    ]
  }
];

const candidate = evaluateInternalMutation({
  specimens,
  proposal: {
    candidateId: 'theme-11-candidate',
    traits: [
      { dimension: 'voice-shell', value: 'compressed-sans/unstable-first-person', operation: 'hybridize', derivedFrom: [
        { specimenId: 'theme-01', sourceDimension: 'typography' },
        { specimenId: 'text-03', sourceDimension: 'voice' }
      ] },
      { dimension: 'reading-rhythm', value: 'dense-grid/abrupt-fragment', operation: 'cross-pressure', derivedFrom: [
        { specimenId: 'theme-01', sourceDimension: 'layout' },
        { specimenId: 'text-03', sourceDimension: 'cadence' }
      ] }
    ]
  }
});
assert.equal(candidate.status, 'SANDBOX_CANDIDATE');

const derivationWitness = verifyMutationDerivation({
  specimens,
  candidate,
  witnesses: [
    { outputDimension: 'voice-shell', recipe: { type: 'join', parts: [
      { specimenId: 'theme-01', sourceDimension: 'typography' }, { literal: '/' }, { specimenId: 'text-03', sourceDimension: 'voice' }
    ] } },
    { outputDimension: 'reading-rhythm', recipe: { type: 'join', parts: [
      { specimenId: 'theme-01', sourceDimension: 'layout' }, { literal: '/' }, { specimenId: 'text-03', sourceDimension: 'cadence' }
    ] } }
  ]
});
assert.equal(derivationWitness.status, 'DERIVATION_WITNESS_VERIFIED');
assert.match(derivationWitness.derivationFingerprint, /^mut-derivation-v1:[0-9a-f]{16}$/);

const lineageFingerprint = deriveMutationLineageFingerprint(candidate);
assert.match(lineageFingerprint, /^mut-lineage-v1:[0-9a-f]{16}$/);
const gut = { organ: 'GUT', status: 'PASS', candidateId: candidate.candidateId, lineageFingerprint, derivationFingerprint: derivationWitness.derivationFingerprint, provenance: 'gut/stress-run-01', reviewRunId: 'gut-review-run-01' };
const vajra = { organ: 'VAJRA', status: 'PASS', candidateId: candidate.candidateId, lineageFingerprint, derivationFingerprint: derivationWitness.derivationFingerprint, provenance: 'vajra/adversarial-run-01', reviewRunId: 'vajra-review-run-01' };

const eligible = evaluateMutationCrossOrganGate({ candidate, lineageFingerprint, derivationWitness, gutReceipt: gut, vajraReceipt: vajra });
assert.equal(eligible.status, 'ELIGIBLE_FOR_CONTROLLED_INCORPORATION_STAGE');
assert.equal(eligible.crossOrganAgreement, true);
assert.equal(eligible.candidateLineageBound, true);
assert.equal(eligible.derivationWitnessBound, true);
assert.equal(eligible.derivationFingerprint, derivationWitness.derivationFingerprint);
assert.deepEqual(eligible.independentReviewRunIds, ['gut-review-run-01', 'vajra-review-run-01']);
assert.equal(eligible.incorporationAuthorized, false);
assert.equal(eligible.bodyMutationApplied, false);

const skippedDerivation = evaluateMutationCrossOrganGate({ candidate, lineageFingerprint, gutReceipt: gut, vajraReceipt: vajra });
assert.equal(skippedDerivation.status, 'HOLD');
assert.equal(skippedDerivation.reason, 'MUTHER_VERIFIED_DERIVATION_WITNESS_REQUIRED');

const heldDerivation = evaluateMutationCrossOrganGate({ candidate, lineageFingerprint, derivationWitness: { ...derivationWitness, status: 'HOLD' }, gutReceipt: gut, vajraReceipt: vajra });
assert.equal(heldDerivation.status, 'HOLD');
assert.equal(heldDerivation.reason, 'MUTHER_VERIFIED_DERIVATION_WITNESS_REQUIRED');

const swappedDerivation = { ...derivationWitness, candidateId: 'theme-12-candidate' };
const swappedWitness = evaluateMutationCrossOrganGate({ candidate, lineageFingerprint, derivationWitness: swappedDerivation, gutReceipt: gut, vajraReceipt: vajra });
assert.equal(swappedWitness.status, 'HOLD');
assert.equal(swappedWitness.reason, 'MUTHER_DERIVATION_WITNESS_CANDIDATE_MISMATCH');

const tamperedDerivation = structuredClone(derivationWitness);
tamperedDerivation.verifiedTraits[0].reconstructedOutput = 'tampered-after-witness';
const staleWitnessFingerprint = evaluateMutationCrossOrganGate({ candidate, lineageFingerprint, derivationWitness: tamperedDerivation, gutReceipt: gut, vajraReceipt: vajra });
assert.equal(staleWitnessFingerprint.status, 'HOLD');
assert.equal(staleWitnessFingerprint.reason, 'MUTHER_DERIVATION_WITNESS_FINGERPRINT_INVALID');

const noGut = evaluateMutationCrossOrganGate({ candidate, lineageFingerprint, derivationWitness, vajraReceipt: vajra });
assert.equal(noGut.status, 'HOLD');
assert.equal(noGut.reason, 'GUT_RECEIPT_REQUIRED');

const noVajra = evaluateMutationCrossOrganGate({ candidate, lineageFingerprint, derivationWitness, gutReceipt: gut });
assert.equal(noVajra.status, 'HOLD');
assert.equal(noVajra.reason, 'VAJRA_RECEIPT_REQUIRED');

const gutMissingDerivation = evaluateMutationCrossOrganGate({ candidate, lineageFingerprint, derivationWitness, gutReceipt: { ...gut, derivationFingerprint: '' }, vajraReceipt: vajra });
assert.equal(gutMissingDerivation.status, 'HOLD');
assert.equal(gutMissingDerivation.reason, 'GUT_DERIVATION_FINGERPRINT_REQUIRED');

const vajraWrongDerivation = evaluateMutationCrossOrganGate({ candidate, lineageFingerprint, derivationWitness, gutReceipt: gut, vajraReceipt: { ...vajra, derivationFingerprint: 'mut-derivation-v1:0000000000000000' } });
assert.equal(vajraWrongDerivation.status, 'HOLD');
assert.equal(vajraWrongDerivation.reason, 'VAJRA_DERIVATION_MISMATCH');

const sharedRunDisguised = evaluateMutationCrossOrganGate({
  candidate,
  lineageFingerprint,
  derivationWitness,
  gutReceipt: { ...gut, reviewRunId: ' shared-run ' },
  vajraReceipt: { ...vajra, reviewRunId: 'ｓｈａｒｅｄ－ｒｕｎ' }
});
assert.equal(sharedRunDisguised.status, 'HOLD');
assert.equal(sharedRunDisguised.reason, 'CROSS_ORGAN_REVIEW_RUN_INDEPENDENCE_NOT_DEMONSTRATED');

const callerInventedLineage = evaluateMutationCrossOrganGate({
  candidate,
  lineageFingerprint: 'lineage:looks-plausible-but-not-derived',
  derivationWitness,
  gutReceipt: { ...gut, lineageFingerprint: 'lineage:looks-plausible-but-not-derived' },
  vajraReceipt: { ...vajra, lineageFingerprint: 'lineage:looks-plausible-but-not-derived' }
});
assert.equal(callerInventedLineage.status, 'HOLD');
assert.equal(callerInventedLineage.reason, 'MUTHER_CALLER_LINEAGE_NOT_BOUND_TO_CANDIDATE');

const tamperedCandidate = structuredClone(candidate);
tamperedCandidate.candidateTraits[0].value = 'post-review-unseen-typography';
const staleReceiptReplay = evaluateMutationCrossOrganGate({ candidate: tamperedCandidate, lineageFingerprint, derivationWitness, gutReceipt: gut, vajraReceipt: vajra });
assert.equal(staleReceiptReplay.status, 'HOLD');
assert.equal(staleReceiptReplay.reason, 'MUTHER_CALLER_LINEAGE_NOT_BOUND_TO_CANDIDATE');
assert.notEqual(deriveMutationLineageFingerprint(tamperedCandidate), lineageFingerprint);

const provenanceTamper = structuredClone(candidate);
provenanceTamper.candidateTraits[1].derivedFrom[1].provenance.versionRef = 'v4';
assert.notEqual(deriveMutationLineageFingerprint(provenanceTamper), lineageFingerprint);

const reorderedEquivalent = structuredClone(candidate);
reorderedEquivalent.candidateTraits.reverse();
reorderedEquivalent.candidateTraits[0].derivedFrom.reverse();
assert.equal(deriveMutationLineageFingerprint(reorderedEquivalent), lineageFingerprint);

const sameReviewerDisguised = evaluateMutationCrossOrganGate({
  candidate,
  lineageFingerprint,
  derivationWitness,
  gutReceipt: { ...gut, provenance: ' review/shared ' },
  vajraReceipt: { ...vajra, provenance: 'ｒｅｖｉｅｗ／ｓｈａｒｅｄ' }
});
assert.equal(sameReviewerDisguised.status, 'HOLD');
assert.equal(sameReviewerDisguised.reason, 'CROSS_ORGAN_REVIEW_INDEPENDENCE_NOT_DEMONSTRATED');

const selfAuthorized = evaluateMutationCrossOrganGate({ candidate: { ...candidate, incorporationAuthorized: true }, lineageFingerprint, derivationWitness, gutReceipt: gut, vajraReceipt: vajra });
assert.equal(selfAuthorized.status, 'HOLD');
assert.equal(selfAuthorized.reason, 'MUTHER_CANDIDATE_ALREADY_CLAIMS_BODY_AUTHORITY');

console.log(JSON.stringify({
  schema: 'zenomorph-muther-internal-mutation-cross-organ-gate-test/v0.4',
  status: 'PASS',
  capability: 'MUTHER_MUTATION_REVIEWS_REQUIRE_EXACT_VERIFIED_DERIVATION_PLUS_TRACEABLE_INDEPENDENT_RUNS',
  boundary: 'PASS proves protocol containment only: GUT and VAJRA must review the same exact candidate lineage and the same exact verified derivation witness in distinct traceable runs. Skipping, swapping, or tampering with the derivation witness stays HOLD. No persistent body mutation occurs.'
}, null, 2));
