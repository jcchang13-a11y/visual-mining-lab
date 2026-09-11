// VAJRA mutation review receipt issuer v0.2
// Wraps a verified VAJRA-generated contradiction/counterexample review artifact.
// Caller assertions cannot mint PASS receipts without a valid organ review artifact.

import { verifyVajraMutationReviewArtifact } from './mutation-review-artifact.mjs';

const clean = value => typeof value === 'string' ? value.trim() : '';
const canonical = value => clean(value).normalize('NFKC');
const MODULE_ID = 'nostromo/vajra/mutation-review-receipt@0.2';
const SCHEMA = 'zenomorph-vajra-mutation-review-receipt/v0.2';

function fnv1a32(text, seed = 0x811c9dc5) { let hash=seed>>>0; for(let i=0;i<text.length;i++){ hash^=text.charCodeAt(i); hash=Math.imul(hash,0x01000193)>>>0; } return hash.toString(16).padStart(8,'0'); }
function fingerprint(prefix,payload){ const text=JSON.stringify(payload); return `${prefix}:${fnv1a32(text,0x811c9dc5)}${fnv1a32(text,0x9e3779b9)}`; }
function normalizeRefs(refs){ if(!Array.isArray(refs)||refs.length===0) return null; const normalized=refs.map(canonical); if(normalized.some(v=>!v)) return null; return [...new Set(normalized)].sort(); }
function witnessFingerprint(witness){
  const evidenceRefs=normalizeRefs(witness?.evidenceRefs); if(!evidenceRefs) return '';
  const payload={organ:'VAJRA',kind:'CONTRADICTION_COUNTEREXAMPLE_REVIEW',candidateId:canonical(witness.candidateId),lineageFingerprint:canonical(witness.lineageFingerprint),derivationFingerprint:canonical(witness.derivationFingerprint),reviewRunId:canonical(witness.reviewRunId),evidenceRefs,checks:{contradictionChecked:true,counterexampleChecked:true,provenanceChecked:true}};
  return fingerprint('organ-review-v1',payload);
}
function receiptPayload(receipt){
  const evidenceRefs=normalizeRefs(receipt?.reviewWitness?.evidenceRefs); if(!evidenceRefs) return null;
  return {schema:SCHEMA,issuerModule:MODULE_ID,organ:'VAJRA',status:canonical(receipt?.status).toUpperCase(),candidateId:canonical(receipt?.candidateId),lineageFingerprint:canonical(receipt?.lineageFingerprint),derivationFingerprint:canonical(receipt?.derivationFingerprint),provenance:canonical(receipt?.provenance),reviewRunId:canonical(receipt?.reviewRunId),reviewArtifactFingerprint:canonical(receipt?.reviewArtifactFingerprint),reviewWitness:{organ:'VAJRA',kind:'CONTRADICTION_COUNTEREXAMPLE_REVIEW',candidateId:canonical(receipt?.reviewWitness?.candidateId),lineageFingerprint:canonical(receipt?.reviewWitness?.lineageFingerprint),derivationFingerprint:canonical(receipt?.reviewWitness?.derivationFingerprint),reviewRunId:canonical(receipt?.reviewWitness?.reviewRunId),evidenceRefs,checks:{contradictionChecked:receipt?.reviewWitness?.checks?.contradictionChecked===true,counterexampleChecked:receipt?.reviewWitness?.checks?.counterexampleChecked===true,provenanceChecked:receipt?.reviewWitness?.checks?.provenanceChecked===true},reviewWitnessFingerprint:canonical(receipt?.reviewWitness?.reviewWitnessFingerprint)}};
}
export function issueVajraMutationReviewReceipt({reviewArtifact,provenance}={}){
  const verified=verifyVajraMutationReviewArtifact(reviewArtifact);
  if(!verified.ok) return {schema:SCHEMA,issuerModule:MODULE_ID,organ:'VAJRA',status:'HOLD',reason:verified.reason||'VAJRA_REVIEW_ARTIFACT_REQUIRED',incorporationAuthorized:false};
  const p=verified.payload;
  const witness={organ:'VAJRA',kind:'CONTRADICTION_COUNTEREXAMPLE_REVIEW',candidateId:p.candidateId,lineageFingerprint:p.lineageFingerprint,derivationFingerprint:p.derivationFingerprint,reviewRunId:p.reviewRunId,evidenceRefs:verified.evidenceRefs,checks:{contradictionChecked:true,counterexampleChecked:true,provenanceChecked:true}};
  witness.reviewWitnessFingerprint=witnessFingerprint(witness);
  const base={schema:SCHEMA,issuerModule:MODULE_ID,organ:'VAJRA',status:'PASS',candidateId:p.candidateId,lineageFingerprint:p.lineageFingerprint,derivationFingerprint:p.derivationFingerprint,provenance:canonical(provenance),reviewRunId:p.reviewRunId,reviewArtifactFingerprint:verified.reviewArtifactFingerprint,reviewWitness:witness};
  const payload=receiptPayload(base);
  if(!payload||!payload.provenance||!payload.reviewArtifactFingerprint||!payload.reviewWitness.reviewWitnessFingerprint) return {schema:SCHEMA,issuerModule:MODULE_ID,organ:'VAJRA',status:'HOLD',reason:'VAJRA_REVIEW_RECEIPT_INPUT_INCOMPLETE',incorporationAuthorized:false};
  return {...base,issuerFingerprint:fingerprint('vajra-mutation-review-v2',payload)};
}
export function verifyVajraMutationReviewReceipt(receipt){
  if(!receipt||receipt.schema!==SCHEMA||receipt.issuerModule!==MODULE_ID||canonical(receipt.organ).toUpperCase()!=='VAJRA') return {ok:false,reason:'VAJRA_ISSUER_MODULE_REQUIRED'};
  const payload=receiptPayload(receipt); if(!payload) return {ok:false,reason:'VAJRA_ISSUER_EVIDENCE_REQUIRED'};
  const derived=fingerprint('vajra-mutation-review-v2',payload);
  if(canonical(receipt.issuerFingerprint)!==derived) return {ok:false,reason:'VAJRA_ISSUER_FINGERPRINT_INVALID',derivedIssuerFingerprint:derived};
  if(!payload.reviewArtifactFingerprint) return {ok:false,reason:'VAJRA_REVIEW_ARTIFACT_FINGERPRINT_REQUIRED'};
  return {ok:true,issuerModule:MODULE_ID,issuerFingerprint:derived,reviewArtifactFingerprint:payload.reviewArtifactFingerprint};
}
