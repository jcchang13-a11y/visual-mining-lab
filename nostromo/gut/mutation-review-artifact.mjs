// GUT mutation review artifact v0.3
// Computes a bounded metabolic-contamination review artifact from structured evidence records.
// Mutation admission is stricter than ordinary containment: a detected echo/duplicate that is merely
// CONTAINED remains HOLD. Containment prevents spread; it is not evidence that a candidate is clean enough to incorporate.
// This still does not certify truth or prove that an external scanner ran.

const clean = value => typeof value === 'string' ? value.trim() : '';
const canonical = value => clean(value).normalize('NFKC');
const MODULE_ID = 'nostromo/gut/mutation-review-artifact@0.3';
const SCHEMA = 'zenomorph-gut-mutation-review-artifact/v0.3';
const REQUIRED = ['ECHO_SCAN','DUPLICATE_SCAN','PROVENANCE_SCAN'];
const VERDICT_POLICY = {
  ECHO_SCAN:{allowed:new Set(['CLEAR','CONTAINED','DETECTED']),pass:'CLEAR'},
  DUPLICATE_SCAN:{allowed:new Set(['CLEAR','CONTAINED','DETECTED']),pass:'CLEAR'},
  PROVENANCE_SCAN:{allowed:new Set(['TRACEABLE','BROKEN']),pass:'TRACEABLE'}
};

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
  return `${prefix}:${fnv1a32(text,0x811c9dc5)}${fnv1a32(text,0x9e3779b9)}`;
}
function normalizeEvidence(evidence, expected) {
  if (!Array.isArray(evidence) || evidence.length === 0) return {ok:false,reason:'GUT_REVIEW_EVIDENCE_INCOMPLETE_OR_UNBOUND'};
  const out=[];
  for (const item of evidence) {
    const ref=canonical(item?.ref), kind=canonical(item?.kind).toUpperCase();
    const candidateId=canonical(item?.candidateId), lineageFingerprint=canonical(item?.lineageFingerprint), derivationFingerprint=canonical(item?.derivationFingerprint);
    const verdict=canonical(item?.verdict).toUpperCase(), observation=clean(item?.observation);
    if (!ref || !kind || !verdict || !observation || candidateId!==expected.candidateId || lineageFingerprint!==expected.lineageFingerprint || derivationFingerprint!==expected.derivationFingerprint) return {ok:false,reason:'GUT_REVIEW_EVIDENCE_INCOMPLETE_OR_UNBOUND'};
    if (!REQUIRED.includes(kind)) return {ok:false,reason:'GUT_REVIEW_EVIDENCE_INCOMPLETE_OR_UNBOUND'};
    if (!VERDICT_POLICY[kind].allowed.has(verdict)) return {ok:false,reason:'GUT_REVIEW_VERDICT_INVALID'};
    out.push({ref,kind,candidateId,lineageFingerprint,derivationFingerprint,verdict,observation});
  }
  out.sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b)));
  return {ok:true,evidence:out};
}
function payloadOf(artifact) {
  const candidateId=canonical(artifact?.candidateId), lineageFingerprint=canonical(artifact?.lineageFingerprint), derivationFingerprint=canonical(artifact?.derivationFingerprint), reviewRunId=canonical(artifact?.reviewRunId);
  if (!candidateId || !lineageFingerprint || !derivationFingerprint || !reviewRunId) return {ok:false,reason:'GUT_REVIEW_EVIDENCE_INCOMPLETE_OR_UNBOUND'};
  const normalized=normalizeEvidence(artifact?.evidence,{candidateId,lineageFingerprint,derivationFingerprint});
  if (!normalized.ok) return normalized;
  const evidence=normalized.evidence;
  const byKind=new Map();
  for (const item of evidence) {
    if (byKind.has(item.kind)) return {ok:false,reason:'GUT_REVIEW_DIAGNOSTIC_CARDINALITY_INVALID'};
    byKind.set(item.kind,item);
  }
  if (REQUIRED.some(kind=>!byKind.has(kind))) return {ok:false,reason:'GUT_REVIEW_EVIDENCE_INCOMPLETE_OR_UNBOUND'};
  const diagnostics=Object.fromEntries(REQUIRED.map(kind=>[kind,byKind.get(kind).verdict]));
  const blocking=REQUIRED.filter(kind=>diagnostics[kind]!==VERDICT_POLICY[kind].pass);
  if (blocking.length) return {ok:false,reason:'GUT_REVIEW_FINDING_BLOCKS_PASS',blockingDiagnostics:blocking,diagnostics,evidence};
  return {ok:true,payload:{schema:SCHEMA,moduleId:MODULE_ID,organ:'GUT',kind:'METABOLIC_CONTAMINATION_REVIEW',candidateId,lineageFingerprint,derivationFingerprint,reviewRunId,evidence,diagnostics,checks:{echoChecked:true,duplicateChecked:true,provenanceChecked:true}}};
}
export function reviewGutMutationCandidate({candidateId,lineageFingerprint,derivationFingerprint,reviewRunId,evidence}={}) {
  const result=payloadOf({candidateId,lineageFingerprint,derivationFingerprint,reviewRunId,evidence});
  if (!result.ok) return {schema:SCHEMA,moduleId:MODULE_ID,organ:'GUT',status:'HOLD',reason:result.reason,blockingDiagnostics:result.blockingDiagnostics||[],diagnostics:result.diagnostics||{},evidence:result.evidence||[],incorporationAuthorized:false};
  const payload=result.payload;
  return {...payload,status:'PASS',evidenceRefs:payload.evidence.map(x=>x.ref),reviewArtifactFingerprint:fingerprint('gut-review-artifact-v3',payload),incorporationAuthorized:false};
}
export function verifyGutMutationReviewArtifact(artifact) {
  if (!artifact || artifact.schema!==SCHEMA || artifact.moduleId!==MODULE_ID || canonical(artifact.organ).toUpperCase()!=='GUT' || canonical(artifact.status).toUpperCase()!=='PASS') return {ok:false,reason:'GUT_REVIEW_ARTIFACT_REQUIRED'};
  const result=payloadOf(artifact);
  if (!result.ok) return {ok:false,reason:result.reason};
  const payload=result.payload;
  const derived=fingerprint('gut-review-artifact-v3',payload);
  if (canonical(artifact.reviewArtifactFingerprint)!==derived) return {ok:false,reason:'GUT_REVIEW_ARTIFACT_FINGERPRINT_INVALID',derivedReviewArtifactFingerprint:derived};
  return {ok:true,payload,reviewArtifactFingerprint:derived,evidenceRefs:payload.evidence.map(x=>x.ref)};
}
