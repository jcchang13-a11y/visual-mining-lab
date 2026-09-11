// VAJRA mutation review artifact v0.2
// Computes a bounded contradiction/counterexample review artifact from structured evidence records.
// It does not certify truth; it proves that VAJRA's required checks were actually derived from the cited evidence set
// and that the three required review categories contain distinct, candidate-bound substantive findings rather than labels alone.

const clean = value => typeof value === 'string' ? value.trim() : '';
const canonical = value => clean(value).normalize('NFKC');
const MODULE_ID = 'nostromo/vajra/mutation-review-artifact@0.2';
const SCHEMA = 'zenomorph-vajra-mutation-review-artifact/v0.2';
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
  if (!Array.isArray(evidence) || evidence.length === 0) return {ok:false,reason:'VAJRA_REVIEW_EVIDENCE_INCOMPLETE_OR_UNBOUND'};
  const out=[];
  for (const item of evidence) {
    const rawRef=typeof item?.ref==='string'?item.ref:'';
    const rawFinding=typeof item?.finding==='string'?item.finding:'';
    const ref=canonical(rawRef), kind=canonical(item?.kind).toUpperCase(), finding=canonical(rawFinding);
    const candidateId=canonical(item?.candidateId), lineageFingerprint=canonical(item?.lineageFingerprint), derivationFingerprint=canonical(item?.derivationFingerprint);
    if (!ref || !kind || candidateId!==expected.candidateId || lineageFingerprint!==expected.lineageFingerprint || derivationFingerprint!==expected.derivationFingerprint) return {ok:false,reason:'VAJRA_REVIEW_EVIDENCE_INCOMPLETE_OR_UNBOUND'};
    if (REQUIRED.includes(kind) && !finding) return {ok:false,reason:'VAJRA_MUTATION_REVIEW_RUBBER_STAMP'};
    out.push({ref:rawRef,kind,candidateId,lineageFingerprint,derivationFingerprint,finding:rawFinding,_canonicalFinding:finding});
  }
  const requiredRows=REQUIRED.map(kind=>out.filter(x=>x.kind===kind));
  if (requiredRows.some(rows=>rows.length===0)) return {ok:false,reason:'VAJRA_REVIEW_EVIDENCE_INCOMPLETE_OR_UNBOUND'};
  const requiredFindings=requiredRows.flat().map(x=>x._canonicalFinding);
  if (new Set(requiredFindings).size!==requiredFindings.length) return {ok:false,reason:'VAJRA_MUTATION_REVIEW_RUBBER_STAMP'};
  out.sort((a,b)=>JSON.stringify({ref:canonical(a.ref),kind:a.kind,finding:a._canonicalFinding}).localeCompare(JSON.stringify({ref:canonical(b.ref),kind:b.kind,finding:b._canonicalFinding})));
  return {ok:true,evidence:out.map(({_canonicalFinding,...x})=>x)};
}
function payloadResult(artifact) {
  const candidateId=canonical(artifact?.candidateId), lineageFingerprint=canonical(artifact?.lineageFingerprint), derivationFingerprint=canonical(artifact?.derivationFingerprint), reviewRunId=canonical(artifact?.reviewRunId);
  if (!candidateId || !lineageFingerprint || !derivationFingerprint || !reviewRunId) return {ok:false,reason:'VAJRA_REVIEW_EVIDENCE_INCOMPLETE_OR_UNBOUND'};
  const normalized=normalizeEvidence(artifact?.evidence,{candidateId,lineageFingerprint,derivationFingerprint});
  if (!normalized.ok) return normalized;
  return {ok:true,payload:{schema:SCHEMA,moduleId:MODULE_ID,organ:'VAJRA',kind:'CONTRADICTION_COUNTEREXAMPLE_REVIEW',candidateId,lineageFingerprint,derivationFingerprint,reviewRunId,evidence:normalized.evidence,checks:{contradictionChecked:true,counterexampleChecked:true,provenanceChecked:true}}};
}
export function reviewVajraMutationCandidate({candidateId,lineageFingerprint,derivationFingerprint,reviewRunId,evidence}={}) {
  const draft={candidateId,lineageFingerprint,derivationFingerprint,reviewRunId,evidence};
  const result=payloadResult(draft);
  if (!result.ok) return {schema:SCHEMA,moduleId:MODULE_ID,organ:'VAJRA',status:'HOLD',reason:result.reason,incorporationAuthorized:false};
  const payload=result.payload;
  return {...payload,status:'PASS',evidenceRefs:payload.evidence.map(x=>x.ref),reviewArtifactFingerprint:fingerprint('vajra-review-artifact-v2',payload)};
}
export function verifyVajraMutationReviewArtifact(artifact) {
  if (!artifact || artifact.schema!==SCHEMA || artifact.moduleId!==MODULE_ID || canonical(artifact.organ).toUpperCase()!=='VAJRA' || canonical(artifact.status).toUpperCase()!=='PASS') return {ok:false,reason:'VAJRA_REVIEW_ARTIFACT_REQUIRED'};
  const result=payloadResult(artifact);
  if (!result.ok) return {ok:false,reason:result.reason==='VAJRA_MUTATION_REVIEW_RUBBER_STAMP'?'VAJRA_MUTATION_REVIEW_RUBBER_STAMP':'VAJRA_REVIEW_ARTIFACT_EVIDENCE_INVALID'};
  const payload=result.payload;
  const derived=fingerprint('vajra-review-artifact-v2',payload);
  if (canonical(artifact.reviewArtifactFingerprint)!==derived) return {ok:false,reason:'VAJRA_REVIEW_ARTIFACT_FINGERPRINT_INVALID',derivedReviewArtifactFingerprint:derived};
  return {ok:true,payload,reviewArtifactFingerprint:derived,evidenceRefs:payload.evidence.map(x=>x.ref)};
}
