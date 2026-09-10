import assert from 'node:assert/strict';
import { evaluateInternalMutation } from './internal-mutation.mjs';
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
      { dimension: 'cadence', value: 'abrupt-fragment', provenance: { artifactRef: 'public:text-03', versionRef: 'v3' } }
    ]
  }
];

const candidate = evaluateInternalMutation({
  specimens,
  proposal: {
    candidateId: 'theme-11-candidate',
    traits: [
      { dimension: 'typography', value: 'compressed-sans-with-rupture', operation: 'distort', derivedFrom: [{ specimenId: 'theme-01', sourceDimension: 'typography' }] },
      { dimension: 'reading-rhythm', value: 'visual-breaks-follow-abrupt-fragments', operation: 'cross-pressure', derivedFrom: [
        { specimenId: 'theme-01', sourceDimension: 'layout' },
        { specimenId: 'text-03', sourceDimension: 'cadence' }
      ] }
    ]
  }
});
assert.equal(candidate.status, 'SANDBOX_CANDIDATE');

const lineageFingerprint = deriveMutationLineageFingerprint(candidate);
assert.match(lineageFingerprint, /^mut-lineage-v1:[0-9a-f]{16}$/);
const gut = { organ: 'GUT', status: 'PASS', candidateId: candidate.candidateId, lineageFingerprint, provenance: 'gut/stress-run-01' };
const vajra = { organ: 'VAJRA', status: 'PASS', candidateId: candidate.candidateId, lineageFingerprint, provenance: 'vajra/adversarial-run-01' };

const eligible = evaluateMutationCrossOrganGate({ candidate, lineageFingerprint, gutReceipt: gut, vajraReceipt: vajra });
assert.equal(eligible.status, 'ELIGIBLE_FOR_CONTROLLED_INCORPORATION_STAGE');
assert.equal(eligible.crossOrganAgreement, true);
assert.equal(eligible.candidateLineageBound, true);
assert.equal(eligible.incorporationAuthorized, false);
assert.equal(eligible.bodyMutationApplied, false);

const noGut = evaluateMutationCrossOrganGate({ candidate, lineageFingerprint, vajraReceipt: vajra });
assert.equal(noGut.status, 'HOLD');
assert.equal(noGut.reason, 'GUT_RECEIPT_REQUIRED');

const noVajra = evaluateMutationCrossOrganGate({ candidate, lineageFingerprint, gutReceipt: gut });
assert.equal(noVajra.status, 'HOLD');
assert.equal(noVajra.reason, 'VAJRA_RECEIPT_REQUIRED');

const callerInventedLineage = evaluateMutationCrossOrganGate({
  candidate,
  lineageFingerprint: 'lineage:looks-plausible-but-not-derived',
  gutReceipt: { ...gut, lineageFingerprint: 'lineage:looks-plausible-but-not-derived' },
  vajraReceipt: { ...vajra, lineageFingerprint: 'lineage:looks-plausible-but-not-derived' }
});
assert.equal(callerInventedLineage.status, 'HOLD');
assert.equal(callerInventedLineage.reason, 'MUTHER_CALLER_LINEAGE_NOT_BOUND_TO_CANDIDATE');

const tamperedCandidate = structuredClone(candidate);
tamperedCandidate.candidateTraits[0].value = 'post-review-unseen-typography';
const staleReceiptReplay = evaluateMutationCrossOrganGate({
  candidate: tamperedCandidate,
  lineageFingerprint,
  gutReceipt: gut,
  vajraReceipt: vajra
});
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

const gutMismatch = evaluateMutationCrossOrganGate({
  candidate,
  lineageFingerprint,
  gutReceipt: { ...gut, lineageFingerprint: 'other-lineage' },
  vajraReceipt: vajra
});
assert.equal(gutMismatch.status, 'HOLD');
assert.equal(gutMismatch.reason, 'GUT_LINEAGE_MISMATCH');

const vajraMismatch = evaluateMutationCrossOrganGate({
  candidate,
  lineageFingerprint,
  gutReceipt: gut,
  vajraReceipt: { ...vajra, candidateId: 'theme-12-candidate' }
});
assert.equal(vajraMismatch.status, 'HOLD');
assert.equal(vajraMismatch.reason, 'VAJRA_CANDIDATE_MISMATCH');

const sameReviewerDisguised = evaluateMutationCrossOrganGate({
  candidate,
  lineageFingerprint,
  gutReceipt: { ...gut, provenance: ' review/shared ' },
  vajraReceipt: { ...vajra, provenance: 'ｒｅｖｉｅｗ／ｓｈａｒｅｄ' }
});
assert.equal(sameReviewerDisguised.status, 'HOLD');
assert.equal(sameReviewerDisguised.reason, 'CROSS_ORGAN_REVIEW_INDEPENDENCE_NOT_DEMONSTRATED');

const underivedCandidate = {
  status: 'SANDBOX_CANDIDATE',
  candidateId: 'label-only',
  provenancePreserved: true,
  incorporationAuthorized: false,
  bodyMutationApplied: false
};
const underived = evaluateMutationCrossOrganGate({ candidate: underivedCandidate, lineageFingerprint: 'anything', gutReceipt: gut, vajraReceipt: vajra });
assert.equal(underived.status, 'HOLD');
assert.equal(underived.reason, 'MUTHER_CANDIDATE_LINEAGE_UNDERIVED');

const selfAuthorized = evaluateMutationCrossOrganGate({
  candidate: { ...candidate, incorporationAuthorized: true },
  lineageFingerprint,
  gutReceipt: gut,
  vajraReceipt: vajra
});
assert.equal(selfAuthorized.status, 'HOLD');
assert.equal(selfAuthorized.reason, 'MUTHER_CANDIDATE_ALREADY_CLAIMS_BODY_AUTHORITY');

console.log(JSON.stringify({
  schema: 'zenomorph-muther-internal-mutation-cross-organ-gate-test/v0.2',
  status: 'PASS',
  capability: 'MUTHER_MUTATION_REVIEWS_ARE_BOUND_TO_EXACT_CANDIDATE_LINEAGE',
  boundary: 'PASS proves protocol containment only: old or invented lineage receipts cannot be replayed onto a changed mutation candidate that merely reuses the same candidateId. No persistent body mutation occurs.'
}, null, 2));
