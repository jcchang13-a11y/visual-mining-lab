// MUTHER internal mutation cross-organ gate v0.5
// Cross-organ PASS is not enough: each organ must attach a machine-checkable review witness
// bound to the exact candidate lineage, derivation fingerprint and review run.

import { deriveMutationDerivationFingerprint } from './internal-mutation-derivation-witness.mjs';

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

function fingerprint(prefix, payload) {
  const text = JSON.stringify(payload);
  return `${prefix}:${fnv1a32(text, 0x811c9dc5)}${fnv1a32(text, 0x9e3779b9)}`;
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
  return fingerprint('mut-lineage-v1', { candidateId, traits: normalizedTraits });
}

function hold(reason, audit = {}) {
  return { schema: 'zenomorph-muther-internal-mutation-cross-organ-gate/v0.5', status: 'HOLD', reason, incorporationAuthorized: false, bodyMutationApplied: false, ...audit };
}

function normalizeEvidenceRefs(refs) {
  if (!Array.isArray(refs) || refs.length === 0) return null;
  const normalized = refs.map(canonical);
  if (normalized.some(v => !v)) return null;
  return [...new Set(normalized)].sort();
}

function qualifyReviewWitness(witness, expectedOrgan, candidateId, lineageFingerprint, derivationFingerprint, reviewRunId) {
  if (!witness || typeof witness !== 'object' || Array.isArray(witness)) return { ok:false, reason:`${expectedOrgan}_REVIEW_WITNESS_REQUIRED` };
  const organ = canonical(witness.organ).toUpperCase();
  const kind = canonical(witness.kind).toUpperCase();
  const expectedKind = expectedOrgan === 'GUT' ? 'METABOLIC_CONTAMINATION_REVIEW' : 'CONTRADICTION_COUNTEREXAMPLE_REVIEW';
  const evidenceRefs = normalizeEvidenceRefs(witness.evidenceRefs);
  if (organ !== expectedOrgan) return { ok:false, reason:`${expectedOrgan}_REVIEW_WITNESS_ORGAN_MISMATCH` };
  if (kind !== expectedKind) return { ok:false, reason:`${expectedOrgan}_REVIEW_WITNESS_KIND_REQUIRED` };
  if (canonical(witness.candidateId) !== candidateId || canonical(witness.lineageFingerprint) !== lineageFingerprint || canonical(witness.derivationFingerprint) !== derivationFingerprint || canonical(witness.reviewRunId) !== canonical(reviewRunId)) return { ok:false, reason:`${expectedOrgan}_REVIEW_WITNESS_BINDING_MISMATCH` };
  if (!evidenceRefs) return { ok:false, reason:`${expectedOrgan}_REVIEW_EVIDENCE_REQUIRED` };
  const checks = witness.checks;
  if (!checks || typeof checks !== 'object' || Array.isArray(checks)) return { ok:false, reason:`${expectedOrgan}_REVIEW_CHECKS_REQUIRED` };
  const required = expectedOrgan === 'GUT' ? ['echoChecked','duplicateChecked','provenanceChecked'] : ['contradictionChecked','counterexampleChecked','provenanceChecked'];
  if (required.some(key => checks[key] !== true)) return { ok:false, reason:`${expectedOrgan}_REVIEW_CHECKS_INCOMPLETE` };
  const payload = { organ, kind, candidateId, lineageFingerprint, derivationFingerprint, reviewRunId:canonical(reviewRunId), evidenceRefs, checks:Object.fromEntries(required.map(k=>[k,true])) };
  const derived = fingerprint('organ-review-v1', payload);
  if (canonical(witness.reviewWitnessFingerprint) !== derived) return { ok:false, reason:`${expectedOrgan}_REVIEW_WITNESS_FINGERPRINT_INVALID`, derivedReviewWitnessFingerprint:derived };
  return { ok:true, reviewWitnessFingerprint:derived, evidenceRefs };
}

export function deriveOrganReviewWitnessFingerprint(witness) {
  const organ = canonical(witness?.organ).toUpperCase();
  const required = organ === 'GUT' ? ['echoChecked','duplicateChecked','provenanceChecked'] : organ === 'VAJRA' ? ['contradictionChecked','counterexampleChecked','provenanceChecked'] : [];
  const evidenceRefs = normalizeEvidenceRefs(witness?.evidenceRefs);
  if (!required.length || !evidenceRefs || required.some(k => witness?.checks?.[k] !== true)) return '';
  const payload = { organ, kind:canonical(witness.kind).toUpperCase(), candidateId:canonical(witness.candidateId), lineageFingerprint:canonical(witness.lineageFingerprint), derivationFingerprint:canonical(witness.derivationFingerprint), reviewRunId:canonical(witness.reviewRunId), evidenceRefs, checks:Object.fromEntries(required.map(k=>[k,true])) };
  return fingerprint('organ-review-v1', payload);
}

function qualifyReceipt(receipt, expectedOrgan, candidateId, lineageFingerprint, derivationFingerprint) {
  if (!receipt || typeof receipt !== 'object' || Array.isArray(receipt)) return { ok:false, reason:`${expectedOrgan}_RECEIPT_REQUIRED` };
  const organ = canonical(receipt.organ).toUpperCase();
  const status = canonical(receipt.status).toUpperCase();
  const provenance = clean(receipt.provenance);
  const reviewRunId = clean(receipt.reviewRunId);
  if (organ !== expectedOrgan) return { ok:false, reason:`${expectedOrgan}_ORGAN_IDENTITY_REQUIRED` };
  if (status !== 'PASS') return { ok:false, reason:`${expectedOrgan}_PASS_REQUIRED` };
  if (!provenance) return { ok:false, reason:`${expectedOrgan}_PROVENANCE_REQUIRED` };
  if (!reviewRunId) return { ok:false, reason:`${expectedOrgan}_REVIEW_RUN_ID_REQUIRED` };
  if (canonical(receipt.candidateId) !== candidateId) return { ok:false, reason:`${expectedOrgan}_CANDIDATE_MISMATCH` };
  if (canonical(receipt.lineageFingerprint) !== lineageFingerprint) return { ok:false, reason:`${expectedOrgan}_LINEAGE_MISMATCH` };
  if (!canonical(receipt.derivationFingerprint)) return { ok:false, reason:`${expectedOrgan}_DERIVATION_FINGERPRINT_REQUIRED` };
  if (canonical(receipt.derivationFingerprint) !== derivationFingerprint) return { ok:false, reason:`${expectedOrgan}_DERIVATION_MISMATCH` };
  const witness = qualifyReviewWitness(receipt.reviewWitness, expectedOrgan, candidateId, lineageFingerprint, derivationFingerprint, reviewRunId);
  if (!witness.ok) return witness;
  return { ok:true, organ, provenance, reviewRunId, reviewWitnessFingerprint:witness.reviewWitnessFingerprint };
}

export function evaluateMutationCrossOrganGate({ candidate, lineageFingerprint, derivationWitness, gutReceipt, vajraReceipt } = {}) {
  const candidateId = canonical(candidate?.candidateId);
  if (!candidate || candidate.status !== 'SANDBOX_CANDIDATE' || !candidateId) return hold('MUTHER_SANDBOX_CANDIDATE_REQUIRED');
  if (candidate.incorporationAuthorized !== false || candidate.bodyMutationApplied !== false) return hold('MUTHER_CANDIDATE_ALREADY_CLAIMS_BODY_AUTHORITY');
  if (!candidate.provenancePreserved) return hold('MUTHER_TRACEABLE_LINEAGE_REQUIRED');
  const derivedLineage = deriveMutationLineageFingerprint(candidate);
  if (!derivedLineage) return hold('MUTHER_CANDIDATE_LINEAGE_UNDERIVED');
  if (canonical(lineageFingerprint) !== derivedLineage) return hold('MUTHER_CALLER_LINEAGE_NOT_BOUND_TO_CANDIDATE', { candidateId, derivedLineageFingerprint:derivedLineage });
  if (derivationWitness?.status !== 'DERIVATION_WITNESS_VERIFIED') return hold('MUTHER_VERIFIED_DERIVATION_WITNESS_REQUIRED', { candidateId, lineageFingerprint:derivedLineage });
  if (canonical(derivationWitness?.candidateId) !== candidateId) return hold('MUTHER_DERIVATION_WITNESS_CANDIDATE_MISMATCH', { candidateId, lineageFingerprint:derivedLineage });
  const derivedDerivationFingerprint = deriveMutationDerivationFingerprint(derivationWitness);
  if (!derivedDerivationFingerprint || canonical(derivationWitness?.derivationFingerprint) !== derivedDerivationFingerprint) return hold('MUTHER_DERIVATION_WITNESS_FINGERPRINT_INVALID', { candidateId, lineageFingerprint:derivedLineage, derivedDerivationFingerprint });
  const gut = qualifyReceipt(gutReceipt, 'GUT', candidateId, derivedLineage, derivedDerivationFingerprint);
  const vajra = qualifyReceipt(vajraReceipt, 'VAJRA', candidateId, derivedLineage, derivedDerivationFingerprint);
  const audit = { candidateId, lineageFingerprint:derivedLineage, derivationFingerprint:derivedDerivationFingerprint, candidateLineageBound:true, derivationWitnessBound:true, reviews:{ GUT:{qualified:gut.ok,reason:gut.reason||null,provenance:gut.provenance||null,reviewRunId:gut.reviewRunId||null,reviewWitnessFingerprint:gut.reviewWitnessFingerprint||null}, VAJRA:{qualified:vajra.ok,reason:vajra.reason||null,provenance:vajra.provenance||null,reviewRunId:vajra.reviewRunId||null,reviewWitnessFingerprint:vajra.reviewWitnessFingerprint||null} } };
  if (!gut.ok) return hold(gut.reason, audit);
  if (!vajra.ok) return hold(vajra.reason, audit);
  if (canonical(gut.provenance) === canonical(vajra.provenance)) return hold('CROSS_ORGAN_REVIEW_INDEPENDENCE_NOT_DEMONSTRATED', audit);
  if (canonical(gut.reviewRunId) === canonical(vajra.reviewRunId)) return hold('CROSS_ORGAN_REVIEW_RUN_INDEPENDENCE_NOT_DEMONSTRATED', audit);
  return { schema:'zenomorph-muther-internal-mutation-cross-organ-gate/v0.5', status:'ELIGIBLE_FOR_CONTROLLED_INCORPORATION_STAGE', candidateId, lineageFingerprint:derivedLineage, derivationFingerprint:derivedDerivationFingerprint, candidateLineageBound:true, derivationWitnessBound:true, crossOrganAgreement:true, independentReviewProvenance:[gut.provenance,vajra.provenance], independentReviewRunIds:[gut.reviewRunId,vajra.reviewRunId], reviewWitnessFingerprints:[gut.reviewWitnessFingerprint,vajra.reviewWitnessFingerprint], incorporationAuthorized:false, bodyMutationApplied:false, nextRequiredGate:'CONTROLLED_MORPHOGENESIS_INCORPORATION_WITH_ROLLBACK', boundary:'Eligibility now requires evidence-bound organ-specific review witnesses, not bare PASS labels. This gate still never installs, executes, or mutates the persistent body.' };
}
