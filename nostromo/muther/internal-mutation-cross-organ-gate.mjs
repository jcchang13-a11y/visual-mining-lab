// MUTHER internal mutation cross-organ gate v0.2
// A mutation candidate cannot enter the persistent ZENOMORPH body on MUTHER's own authority.
// GUT and VAJRA review receipts must independently agree on the exact candidate lineage.

const clean = value => typeof value === 'string' ? value.trim() : '';
const canonical = value => clean(value).normalize('NFKC');

function fnv1a32(text, seed = 0x811c9dc5) {
  let hash = seed >>> 0;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

function contributionIdentity(source) {
  const specimenId = canonical(source?.specimenId);
  const specimenKind = canonical(source?.specimenKind);
  const sourceDimension = canonical(source?.sourceDimension);
  const sourceValue = canonical(source?.sourceValue);
  const artifactRef = canonical(source?.provenance?.artifactRef);
  const versionRef = canonical(source?.provenance?.versionRef);
  if (!specimenId || !specimenKind || !sourceDimension || !sourceValue || !artifactRef || !versionRef) return null;
  return [specimenId, specimenKind, sourceDimension, sourceValue, artifactRef, versionRef];
}

export function deriveMutationLineageFingerprint(candidate) {
  const candidateId = canonical(candidate?.candidateId);
  const traits = Array.isArray(candidate?.candidateTraits) ? candidate.candidateTraits : [];
  if (!candidateId || !traits.length) return '';
  const normalizedTraits = [];
  for (const trait of traits) {
    const dimension = canonical(trait?.dimension);
    const value = canonical(trait?.value);
    const operation = canonical(trait?.operation);
    const sources = Array.isArray(trait?.derivedFrom) ? trait.derivedFrom : [];
    if (!dimension || !value || !operation || !sources.length) return '';
    const normalizedSources = sources.map(contributionIdentity);
    if (normalizedSources.some(source => !source)) return '';
    normalizedSources.sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
    normalizedTraits.push([dimension, value, operation, normalizedSources]);
  }
  normalizedTraits.sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
  const payload = JSON.stringify({ candidateId, traits: normalizedTraits });
  const left = fnv1a32(payload, 0x811c9dc5);
  const right = fnv1a32(payload, 0x9e3779b9);
  return `mut-lineage-v1:${left}${right}`;
}

function hold(reason, audit = {}) {
  return {
    schema: 'zenomorph-muther-internal-mutation-cross-organ-gate/v0.2',
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
  if (!candidate || candidate.status !== 'SANDBOX_CANDIDATE' || !candidateId) {
    return hold('MUTHER_SANDBOX_CANDIDATE_REQUIRED');
  }
  if (candidate.incorporationAuthorized !== false || candidate.bodyMutationApplied !== false) {
    return hold('MUTHER_CANDIDATE_ALREADY_CLAIMS_BODY_AUTHORITY');
  }
  if (!candidate.provenancePreserved) {
    return hold('MUTHER_TRACEABLE_LINEAGE_REQUIRED');
  }

  const derivedLineage = deriveMutationLineageFingerprint(candidate);
  if (!derivedLineage) return hold('MUTHER_CANDIDATE_LINEAGE_UNDERIVED');
  const suppliedLineage = canonical(lineageFingerprint);
  if (!suppliedLineage || suppliedLineage !== derivedLineage) {
    return hold('MUTHER_CALLER_LINEAGE_NOT_BOUND_TO_CANDIDATE', {
      candidateId,
      derivedLineageFingerprint: derivedLineage
    });
  }

  const gut = qualifyReceipt(gutReceipt, 'GUT', candidateId, derivedLineage);
  const vajra = qualifyReceipt(vajraReceipt, 'VAJRA', candidateId, derivedLineage);
  const audit = {
    candidateId,
    lineageFingerprint: derivedLineage,
    candidateLineageBound: true,
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
    schema: 'zenomorph-muther-internal-mutation-cross-organ-gate/v0.2',
    status: 'ELIGIBLE_FOR_CONTROLLED_INCORPORATION_STAGE',
    candidateId,
    lineageFingerprint: derivedLineage,
    candidateLineageBound: true,
    crossOrganAgreement: true,
    independentReviewProvenance: [gut.provenance, vajra.provenance],
    incorporationAuthorized: false,
    bodyMutationApplied: false,
    nextRequiredGate: 'CONTROLLED_MORPHOGENESIS_INCORPORATION_WITH_ROLLBACK',
    boundary: 'GUT+VAJRA agreement only makes the exact traceable MUTHER mutation eligible for the next controlled incorporation stage. The reviewed lineage is deterministically derived from candidate traits, operations, source identities, source values, and source provenance, so receipts for an older mutation cannot be replayed onto a changed candidate that reuses the same candidateId. This gate never installs, executes, or mutates the persistent body.'
  };
}
