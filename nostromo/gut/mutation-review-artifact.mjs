// GUT mutation review artifact v0.2
// Computes a bounded metabolic-contamination review artifact from structured evidence records.
// Required scan labels alone are insufficient: each required scan must carry a bounded observation
// and an acceptable verdict. This still does not certify truth or prove that an external scanner ran.

const clean = value => typeof value === 'string' ? value.trim() : '';
const canonical = value => clean(value).normalize('NFKC');
const MODULE_ID = 'nostromo/gut/mutation-review-artifact@0.2';
const SCHEMA = 'zenomorph-gut-mutation-review-artifact/v0.2';
const REQUIRED = ['ECHO_SCAN','DUPLICATE_SCAN','PROVENANCE_SCAN'];
const ACCEPTABLE = {
  ECHO_SCAN: new Set(['CLEAR','CONTAINED']),
  DUPLICATE_SCAN: new Set(['CLEAR','CONTAINED']),
  PROVENANCE_SCAN: new Set(['TRACEABLE'])
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
  if (!Array.isArray(evidence) || evidence.length === 0) return null;
  const out=[];
  for (const item of evidence) {
    const ref=canonical(item?.ref), kind=canonical(item?.kind).toUpperCase();
    const candidateId=canonical(item?.candidateId), lineageFingerprint=canonical(item?.lineageFingerprint), derivationFingerprint=canonical(item?.derivationFingerprint);
    const verdict=canonical(item?.verdict).toUpperCase(), observation=clean(item?.observation);
    if (!ref || !kind || !verdict || !observation || candidateId!==expected.candidateId || lineageFingerprint!==expected.lineageFingerprint || derivationFingerprint!==expected.derivationFingerprint) return null;
    if (!REQUIRED.includes(kind)) return null;
    out.push({ref,kind,candidateId,lineageFingerprint,derivationFingerprint,verdict,observation});
  }
  out.sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b)));
  return out;
}
function payloadOf(artifact) {
  const candidateId=canonical(artifact?.candidateId), lineageFingerprint=canonical(artifact?.lineageFingerprint), derivationFingerprint=canonical(artifact?.derivationFingerprint), reviewRunId=canonical(artifact?.reviewRunId);
  if (!candidateId || !lineageFingerprint || !derivationFingerprint || !reviewRunId) return null;
  const evidence=normalizeEvidence(artifact?.evidence,{candidateId,lineageFingerprint,derivationFingerprint});
  if (!evidence) return null;
  const byKind=new Map();
  for (const item of evidence) {
    if (byKind.has(item.kind)) return null;
    byKind.set(item.kind,item);
  }
  if (REQUIRED.some(kind=>!byKind.has(kind))) return null;
  const unacceptable=REQUIRED.filter(kind=>!ACCEPTABLE[kind].has(byKind.get(kind).verdict));
  if (unacceptable.length) return { rejected:true, reason:'GUT_REVIEW_FINDING_BLOCKS_PASS', unacceptable, evidence };
  return {schema:SCHEMA,moduleId:MODULE_ID,organ:'GUT',kind:'METABOLIC_CONTAMINATION_REVIEW',candidateId,lineageFingerprint,derivationFingerprint,reviewRunId,evidence,checks:{echoChecked:true,duplicateChecked:true,provenanceChecked:true}};
}
export function reviewGutMutationCandidate({candidateId,lineageFingerprint,derivationFingerprint,reviewRunId,evidence}={}) {
  const draft={candidateId,lineageFingerprint,derivationFingerprint,reviewRunId,evidence};
  const payload=payloadOf(draft);
  if (!payload) return {schema:SCHEMA,moduleId:MODULE_ID,organ:'GUT',status:'HOLD',reason:'GUT_REVIEW_EVIDENCE_INCOMPLETE_OR_UNBOUND',incorporationAuthorized:false};
  if (payload.rejected) return {schema:SCHEMA,moduleId:MODULE_ID,organ:'GUT',status:'HOLD',reason:payload.reason,unacceptable:payload.unacceptable,evidence:payload.evidence,incorporationAuthorized:false};
  return {...payload,status:'PASS',evidenceRefs:payload.evidence.map(x=>x.ref),reviewArtifactFingerprint:fingerprint('gut-review-artifact-v2',payload)};
}
export function verifyGutMutationReviewArtifact(artifact) {
  if (!artifact || artifact.schema!==SCHEMA || artifact.moduleId!==MODULE_ID || canonical(artifact.organ).toUpperCase()!=='GUT' || canonical(artifact.status).toUpperCase()!=='PASS') return {ok:false,reason:'GUT_REVIEW_ARTIFACT_REQUIRED'};
  const payload=payloadOf(artifact);
  if (!payload || payload.rejected) return {ok:false,reason:payload?.reason||'GUT_REVIEW_ARTIFACT_EVIDENCE_INVALID'};
  const derived=fingerprint('gut-review-artifact-v2',payload);
  if (canonical(artifact.reviewArtifactFingerprint)!==derived) return {ok:false,reason:'GUT_REVIEW_ARTIFACT_FINGERPRINT_INVALID',derivedReviewArtifactFingerprint:derived};
  return {ok:true,payload,reviewArtifactFingerprint:derived,evidenceRefs:payload.evidence.map(x=>x.ref)};
}
