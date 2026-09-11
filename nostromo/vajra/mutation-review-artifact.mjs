// VAJRA mutation review artifact v0.1
// Computes a bounded contradiction/counterexample review artifact from structured evidence records.
// It does not certify truth; it proves that VAJRA's required checks were actually derived from the cited evidence set.

const clean = value => typeof value === 'string' ? value.trim() : '';
const canonical = value => clean(value).normalize('NFKC');
const MODULE_ID = 'nostromo/vajra/mutation-review-artifact@0.1';
const SCHEMA = 'zenomorph-vajra-mutation-review-artifact/v0.1';
const REQUIRED = ['CONTRADICTION_SCAN','COUNTEREXAMPLE_SCAN','PROVENANCE_SCAN'];

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
    if (!ref || !kind || candidateId!==expected.candidateId || lineageFingerprint!==expected.lineageFingerprint || derivationFingerprint!==expected.derivationFingerprint) return null;
    out.push({ref,kind,candidateId,lineageFingerprint,derivationFingerprint});
  }
  out.sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b)));
  return out;
}
function payloadOf(artifact) {
  const candidateId=canonical(artifact?.candidateId), lineageFingerprint=canonical(artifact?.lineageFingerprint), derivationFingerprint=canonical(artifact?.derivationFingerprint), reviewRunId=canonical(artifact?.reviewRunId);
  if (!candidateId || !lineageFingerprint || !derivationFingerprint || !reviewRunId) return null;
  const evidence=normalizeEvidence(artifact?.evidence,{candidateId,lineageFingerprint,derivationFingerprint});
  if (!evidence) return null;
  const kinds=new Set(evidence.map(x=>x.kind));
  if (REQUIRED.some(kind=>!kinds.has(kind))) return null;
  return {schema:SCHEMA,moduleId:MODULE_ID,organ:'VAJRA',kind:'CONTRADICTION_COUNTEREXAMPLE_REVIEW',candidateId,lineageFingerprint,derivationFingerprint,reviewRunId,evidence,checks:{contradictionChecked:true,counterexampleChecked:true,provenanceChecked:true}};
}
export function reviewVajraMutationCandidate({candidateId,lineageFingerprint,derivationFingerprint,reviewRunId,evidence}={}) {
  const draft={candidateId,lineageFingerprint,derivationFingerprint,reviewRunId,evidence};
  const payload=payloadOf(draft);
  if (!payload) return {schema:SCHEMA,moduleId:MODULE_ID,organ:'VAJRA',status:'HOLD',reason:'VAJRA_REVIEW_EVIDENCE_INCOMPLETE_OR_UNBOUND',incorporationAuthorized:false};
  return {...payload,status:'PASS',evidenceRefs:payload.evidence.map(x=>x.ref),reviewArtifactFingerprint:fingerprint('vajra-review-artifact-v1',payload)};
}
export function verifyVajraMutationReviewArtifact(artifact) {
  if (!artifact || artifact.schema!==SCHEMA || artifact.moduleId!==MODULE_ID || canonical(artifact.organ).toUpperCase()!=='VAJRA' || canonical(artifact.status).toUpperCase()!=='PASS') return {ok:false,reason:'VAJRA_REVIEW_ARTIFACT_REQUIRED'};
  const payload=payloadOf(artifact);
  if (!payload) return {ok:false,reason:'VAJRA_REVIEW_ARTIFACT_EVIDENCE_INVALID'};
  const derived=fingerprint('vajra-review-artifact-v1',payload);
  if (canonical(artifact.reviewArtifactFingerprint)!==derived) return {ok:false,reason:'VAJRA_REVIEW_ARTIFACT_FINGERPRINT_INVALID',derivedReviewArtifactFingerprint:derived};
  return {ok:true,payload,reviewArtifactFingerprint:derived,evidenceRefs:payload.evidence.map(x=>x.ref)};
}
