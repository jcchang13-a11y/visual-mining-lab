// MUTHER internal mutation cross-organ gate v0.1
// A mutation candidate cannot enter the persistent ZENOMORPH body on MUTHER's own authority.
// GUT and VAJRA review receipts must independently agree on the same candidate lineage.

const clean = value => typeof value === 'string' ? value.trim() : '';
const canonical = value => clean(value).normalize('NFKC');

function hold(reason, audit = {}) {
  return {
    schema: 'zenomorph-muther-internal-mutation-cross-organ-gate/v0.1',
    status: 'HOLD',
    reason,
    incorporationAuthorized: false,
    bodyMutationApplied: false,
    ...audit
  };
}

function qualifyReceipt(receipt, expectedOrgan, candidateId, lineageFingerprint) {
  if (!receipt || typeof receipt !== 'object' || Array.isArray(receipt)) {
    return { ok: false, reason: `${expectedOrgan}_RECEIPT_REQUIRED` };
  }
  const organ = canonical(receipt.organ).toUpperCase();
  const status = canonical(receipt.status).toUpperCase();
  const reviewedCandidateId = canonical(receipt.candidateId);
  const reviewedLineage = canonical(receipt.lineageFingerprint);
  const provenance = clean(receipt.provenance);
  if (organ !== expectedOrgan) return { ok: false, reason: `${expectedOrgan}_ORGAN_IDENTITY_REQUIRED` };
  if (status !== 'PASS') return { ok: false, reason: `${expectedOrgan}_PASS_REQUIRED` };
  if (!provenance) return { ok: false, reason: `${expectedOrgan}_PROVENANCE_REQUIRED` };
  if (reviewedCandidateId !== candidateId) return { ok: false, reason: `${expectedOrgan}_CANDIDATE_MISMATCH` };
  if (reviewedLineage !== lineageFingerprint) return { ok: false, reason: `${expectedOrgan}_LINEAGE_MISMATCH` };
  return { ok: true, organ, provenance };
}

export function evaluateMutationCrossOrganGate({ candidate, lineageFingerprint, gutReceipt, vajraReceipt } = {}) {
  const candidateId = canonical(candidate?.candidateId);
  const lineage = canonical(lineageFingerprint);
  if (!candidate || candidate.status !== 'SANDBOX_CANDIDATE' || !candidateId) {
    return hold('MUTHER_SANDBOX_CANDIDATE_REQUIRED');
  }
  if (candidate.incorporationAuthorized !== false || candidate.bodyMutationApplied !== false) {
    return hold('MUTHER_CANDIDATE_ALREADY_CLAIMS_BODY_AUTHORITY');
  }
  if (!candidate.provenancePreserved || !lineage) {
    return hold('MUTHER_TRACEABLE_LINEAGE_REQUIRED');
  }

  const gut = qualifyReceipt(gutReceipt, 'GUT', candidateId, lineage);
  const vajra = qualifyReceipt(vajraReceipt, 'VAJRA', candidateId, lineage);
  const audit = {
    candidateId,
    lineageFingerprint: lineage,
    reviews: {
      GUT: { qualified: gut.ok, reason: gut.reason || null, provenance: gut.provenance || null },
      VAJRA: { qualified: vajra.ok, reason: vajra.reason || null, provenance: vajra.provenance || null }
    }
  };
  if (!gut.ok) return hold(gut.reason, audit);
  if (!vajra.ok) return hold(vajra.reason, audit);
  if (canonical(gut.provenance) === canonical(vajra.provenance)) {
    return hold('CROSS_ORGAN_REVIEW_INDEPENDENCE_NOT_DEMONSTRATED', audit);
  }

  return {
    schema: 'zenomorph-muther-internal-mutation-cross-organ-gate/v0.1',
    status: 'ELIGIBLE_FOR_CONTROLLED_INCORPORATION_STAGE',
    candidateId,
    lineageFingerprint: lineage,
    crossOrganAgreement: true,
    independentReviewProvenance: [gut.provenance, vajra.provenance],
    incorporationAuthorized: false,
    bodyMutationApplied: false,
    nextRequiredGate: 'CONTROLLED_MORPHOGENESIS_INCORPORATION_WITH_ROLLBACK',
    boundary: 'GUT+VAJRA agreement only makes a traceable MUTHER mutation eligible for the next controlled incorporation stage. This gate never installs, executes, or mutates the persistent body and cannot be satisfied by one organ impersonating both reviews.'
  };
}
