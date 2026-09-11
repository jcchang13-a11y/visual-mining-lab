// GUT mutation review receipt issuer v0.1
// Produces a module-bound metabolic-contamination review receipt for MUTHER mutation candidates.
// This is protocol provenance, not cryptographic identity and not truth certification.

const clean = value => typeof value === 'string' ? value.trim() : '';
const canonical = value => clean(value).normalize('NFKC');
const MODULE_ID = 'nostromo/gut/mutation-review-receipt@0.1';
const SCHEMA = 'zenomorph-gut-mutation-review-receipt/v0.1';

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

function normalizeRefs(refs) {
  if (!Array.isArray(refs) || refs.length === 0) return null;
  const normalized = refs.map(canonical);
  if (normalized.some(v => !v)) return null;
  return [...new Set(normalized)].sort();
}

function receiptPayload(receipt) {
  const evidenceRefs = normalizeRefs(receipt?.reviewWitness?.evidenceRefs);
  if (!evidenceRefs) return null;
  return {
    schema: SCHEMA,
    issuerModule: MODULE_ID,
    organ: 'GUT',
    status: canonical(receipt?.status).toUpperCase(),
    candidateId: canonical(receipt?.candidateId),
    lineageFingerprint: canonical(receipt?.lineageFingerprint),
    derivationFingerprint: canonical(receipt?.derivationFingerprint),
    provenance: canonical(receipt?.provenance),
    reviewRunId: canonical(receipt?.reviewRunId),
    reviewWitness: {
      organ: 'GUT',
      kind: canonical(receipt?.reviewWitness?.kind).toUpperCase(),
      candidateId: canonical(receipt?.reviewWitness?.candidateId),
      lineageFingerprint: canonical(receipt?.reviewWitness?.lineageFingerprint),
      derivationFingerprint: canonical(receipt?.reviewWitness?.derivationFingerprint),
      reviewRunId: canonical(receipt?.reviewWitness?.reviewRunId),
      evidenceRefs,
      checks: {
        echoChecked: receipt?.reviewWitness?.checks?.echoChecked === true,
        duplicateChecked: receipt?.reviewWitness?.checks?.duplicateChecked === true,
        provenanceChecked: receipt?.reviewWitness?.checks?.provenanceChecked === true
      },
      reviewWitnessFingerprint: canonical(receipt?.reviewWitness?.reviewWitnessFingerprint)
    }
  };
}

export function issueGutMutationReviewReceipt({ candidateId, lineageFingerprint, derivationFingerprint, provenance, reviewRunId, evidenceRefs, reviewWitnessFingerprint } = {}) {
  const refs = normalizeRefs(evidenceRefs);
  const base = {
    schema: SCHEMA,
    issuerModule: MODULE_ID,
    organ: 'GUT',
    status: 'PASS',
    candidateId: canonical(candidateId),
    lineageFingerprint: canonical(lineageFingerprint),
    derivationFingerprint: canonical(derivationFingerprint),
    provenance: canonical(provenance),
    reviewRunId: canonical(reviewRunId),
    reviewWitness: {
      organ: 'GUT',
      kind: 'METABOLIC_CONTAMINATION_REVIEW',
      candidateId: canonical(candidateId),
      lineageFingerprint: canonical(lineageFingerprint),
      derivationFingerprint: canonical(derivationFingerprint),
      reviewRunId: canonical(reviewRunId),
      evidenceRefs: refs || [],
      checks: { echoChecked:true, duplicateChecked:true, provenanceChecked:true },
      reviewWitnessFingerprint: canonical(reviewWitnessFingerprint)
    }
  };
  const payload = receiptPayload(base);
  if (!payload || !payload.candidateId || !payload.lineageFingerprint || !payload.derivationFingerprint || !payload.provenance || !payload.reviewRunId || !payload.reviewWitness.reviewWitnessFingerprint) {
    return { schema:SCHEMA, issuerModule:MODULE_ID, organ:'GUT', status:'HOLD', reason:'GUT_REVIEW_RECEIPT_INPUT_INCOMPLETE', incorporationAuthorized:false };
  }
  return { ...base, issuerFingerprint:fingerprint('gut-mutation-review-v1', payload) };
}

export function verifyGutMutationReviewReceipt(receipt) {
  if (!receipt || receipt.schema !== SCHEMA || receipt.issuerModule !== MODULE_ID || canonical(receipt.organ).toUpperCase() !== 'GUT') return { ok:false, reason:'GUT_ISSUER_MODULE_REQUIRED' };
  const payload = receiptPayload(receipt);
  if (!payload) return { ok:false, reason:'GUT_ISSUER_EVIDENCE_REQUIRED' };
  const derived = fingerprint('gut-mutation-review-v1', payload);
  if (canonical(receipt.issuerFingerprint) !== derived) return { ok:false, reason:'GUT_ISSUER_FINGERPRINT_INVALID', derivedIssuerFingerprint:derived };
  return { ok:true, issuerModule:MODULE_ID, issuerFingerprint:derived };
}
