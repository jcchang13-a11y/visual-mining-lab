import assert from 'node:assert/strict';
import { evaluateMutationCrossOrganGate } from './internal-mutation-cross-organ-gate.mjs';

const candidate = {
  status: 'SANDBOX_CANDIDATE',
  candidateId: 'theme-11-candidate',
  provenancePreserved: true,
  incorporationAuthorized: false,
  bodyMutationApplied: false
};
const lineageFingerprint = 'lineage:theme-01+text-03:mutation-11';
const gut = { organ: 'GUT', status: 'PASS', candidateId: candidate.candidateId, lineageFingerprint, provenance: 'gut/stress-run-01' };
const vajra = { organ: 'VAJRA', status: 'PASS', candidateId: candidate.candidateId, lineageFingerprint, provenance: 'vajra/adversarial-run-01' };

const eligible = evaluateMutationCrossOrganGate({ candidate, lineageFingerprint, gutReceipt: gut, vajraReceipt: vajra });
assert.equal(eligible.status, 'ELIGIBLE_FOR_CONTROLLED_INCORPORATION_STAGE');
assert.equal(eligible.crossOrganAgreement, true);
assert.equal(eligible.incorporationAuthorized, false);
assert.equal(eligible.bodyMutationApplied, false);

const noGut = evaluateMutationCrossOrganGate({ candidate, lineageFingerprint, vajraReceipt: vajra });
assert.equal(noGut.status, 'HOLD');
assert.equal(noGut.reason, 'GUT_RECEIPT_REQUIRED');

const noVajra = evaluateMutationCrossOrganGate({ candidate, lineageFingerprint, gutReceipt: gut });
assert.equal(noVajra.status, 'HOLD');
assert.equal(noVajra.reason, 'VAJRA_RECEIPT_REQUIRED');

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

const selfAuthorized = evaluateMutationCrossOrganGate({
  candidate: { ...candidate, incorporationAuthorized: true },
  lineageFingerprint,
  gutReceipt: gut,
  vajraReceipt: vajra
});
assert.equal(selfAuthorized.status, 'HOLD');
assert.equal(selfAuthorized.reason, 'MUTHER_CANDIDATE_ALREADY_CLAIMS_BODY_AUTHORITY');

console.log(JSON.stringify({
  schema: 'zenomorph-muther-internal-mutation-cross-organ-gate-test/v0.1',
  status: 'PASS',
  capability: 'MUTHER_MUTATION_REQUIRES_INDEPENDENT_GUT_AND_VAJRA_AGREEMENT',
  boundary: 'PASS proves protocol containment only: one organ, mismatched lineage, copied reviewer provenance, or a self-authorizing MUTHER candidate cannot advance. No persistent body mutation occurs.'
}, null, 2));
