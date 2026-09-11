// GUT mutation review receipt issuer v0.2 + identity-binding hardening v0.1
// Wraps a verified GUT-generated metabolic-contamination review artifact.
// Caller assertions cannot mint PASS receipts without a valid organ review artifact.
// Receipt identity and nested review-witness identity must remain bound to the same mutation lineage.

import { verifyGutMutationReviewArtifact } from './mutation-review-artifact.mjs';

const clean = value => typeof value === 'string' ? value.trim() : '';
const canonical = value => clean(value).normalize('NFKC');
const MODULE_ID = 'nostromo/gut/mutation-review-receipt@0.2';
const SCHEMA = 'zenomorph-gut-mutation-review-receipt/v0.2';

function fnv1a32(text, seed = 0x811c9dc5) { let hash=seed>>>0; for(let i=0;i<text.length;i++){ hash^=text.charCodeAt(i); hash=Math.imul(hash,0x01000193)>>>0; } return hash.toString(16).padStart(8,'0'); }
function fingerprint(prefix,payload){ const text=JSON.stringify(payload); return `${prefix}:${fnv1a32(text,0x811c9dc5)}${fnv1a32(text,0x9e3779b9)}`; }
function normalizeRefs(refs){ if(!Array.isArray(refs)||refs.length===0) return null; const normalized=refs.map(canonical); if(normalized.some(v=>!v)) return null; return [...new Set(normalized)].sort(); }
function witnessFingerprint(witness){
  const evidenceRefs=normalizeRefs(witness?.evidenceRefs); if(!evidenceRefs) return '';
  const payload={organ:'GUT',kind:'METABOLIC_CONTAMINATION_REVIEW',candidateId:canonical(witness.candidateId),lineageFingerprint:canonical(witness.lineageFingerprint),derivationFingerprint:canonical(witness.derivationFingerprint),reviewRunId:canonical(witness.reviewRunId),evidenceRefs,checks:{echoChecked:true,duplicateChecked:true,provenanceChecked:true}};
  return fingerprint('organ-review-v1',payload);
}
function receiptPayload(receipt){
  const evidenceRefs=normalizeRefs(receipt?.reviewWitness?.evidenceRefs); if(!evidenceRefs) return null;
  return {schema:SCHEMA,issuerModule:MODULE_ID,organ:'GUT',status:canonical(receipt?.status).toUpperCase(),candidateId:canonical(receipt?.candidateId),lineageFingerprint:canonical(receipt?.lineageFingerprint),derivationFingerprint:canonical(receipt?.derivationFingerprint),provenance:canonical(receipt?.provenance),reviewRunId:canonical(receipt?.reviewRunId),reviewArtifactFingerprint:canonical(receipt?.reviewArtifactFingerprint),reviewWitness:{organ:'GUT',kind:'METABOLIC_CONTAMINATION_REVIEW',candidateId:canonical(receipt?.reviewWitness?.candidateId),lineageFingerprint:canonical(receipt?.reviewWitness?.lineageFingerprint),derivationFingerprint:canonical(receipt?.reviewWitness?.derivationFingerprint),reviewRunId:canonical(receipt?.reviewWitness?.reviewRunId),evidenceRefs,checks:{echoChecked:receipt?.reviewWitness?.checks?.echoChecked===true,duplicateChecked:receipt?.reviewWitness?.checks?.duplicateChecked===true,provenanceChecked:receipt?.reviewWitness?.checks?.provenanceChecked===true},reviewWitnessFingerprint:canonical(receipt?.reviewWitness?.reviewWitnessFingerprint)}};
}
function verifyIdentityBinding(receipt,payload){
  const witness=payload?.reviewWitness;
  if(!payload||!witness) return {ok:false,reason:'GUT_REVIEW_RECEIPT_IDENTITY_UNBOUND'};
  if(!payload.candidateId||!payload.lineageFingerprint||!payload.derivationFingerprint||!payload.reviewRunId) return {ok:false,reason:'GUT_REVIEW_RECEIPT_IDENTITY_UNBOUND'};
  if(canonical(receipt?.reviewWitness?.organ).toUpperCase()!=='GUT'||canonical(receipt?.reviewWitness?.kind).toUpperCase()!=='METABOLIC_CONTAMINATION_REVIEW') return {ok:false,reason:'GUT_REVIEW_RECEIPT_IDENTITY_UNBOUND'};
  if(payload.candidateId!==witness.candidateId||payload.lineageFingerprint!==witness.lineageFingerprint||payload.derivationFingerprint!==witness.derivationFingerprint||payload.reviewRunId!==witness.reviewRunId) return {ok:false,reason:'GUT_REVIEW_RECEIPT_IDENTITY_UNBOUND'};
  if(!witness.checks.echoChecked||!witness.checks.duplicateChecked||!witness.checks.provenanceChecked) return {ok:false,reason:'GUT_REVIEW_RECEIPT_WITNESS_INVALID'};
  const expectedWitnessFingerprint=witnessFingerprint(receipt.reviewWitness);
  if(!expectedWitnessFingerprint||witness.reviewWitnessFingerprint!==expectedWitnessFingerprint) return {ok:false,reason:'GUT_REVIEW_RECEIPT_WITNESS_FINGERPRINT_INVALID',derivedReviewWitnessFingerprint:expectedWitnessFingerprint};
  return {ok:true};
}
export function issueGutMutationReviewReceipt({reviewArtifact,provenance}={}){
  const verified=verifyGutMutationReviewArtifact(reviewArtifact);
  if(!verified.ok) return {schema:SCHEMA,issuerModule:MODULE_ID,organ:'GUT',status:'HOLD',reason:verified.reason||'GUT_REVIEW_ARTIFACT_REQUIRED',incorporationAuthorized:false};
  const p=verified.payload;
  const witness={organ:'GUT',kind:'METABOLIC_CONTAMINATION_REVIEW',candidateId:p.candidateId,lineageFingerprint:p.lineageFingerprint,derivationFingerprint:p.derivationFingerprint,reviewRunId:p.reviewRunId,evidenceRefs:verified.evidenceRefs,checks:{echoChecked:true,duplicateChecked:true,provenanceChecked:true}};
  witness.reviewWitnessFingerprint=witnessFingerprint(witness);
  const base={schema:SCHEMA,issuerModule:MODULE_ID,organ:'GUT',status:'PASS',candidateId:p.candidateId,lineageFingerprint:p.lineageFingerprint,derivationFingerprint:p.derivationFingerprint,provenance:canonical(provenance),reviewRunId:p.reviewRunId,reviewArtifactFingerprint:verified.reviewArtifactFingerprint,reviewWitness:witness};
  const payload=receiptPayload(base);
  if(!payload||!payload.provenance||!payload.reviewArtifactFingerprint||!payload.reviewWitness.reviewWitnessFingerprint) return {schema:SCHEMA,issuerModule:MODULE_ID,organ:'GUT',status:'HOLD',reason:'GUT_REVIEW_RECEIPT_INPUT_INCOMPLETE',incorporationAuthorized:false};
  const binding=verifyIdentityBinding(base,payload);
  if(!binding.ok) return {schema:SCHEMA,issuerModule:MODULE_ID,organ:'GUT',status:'HOLD',reason:binding.reason,incorporationAuthorized:false};
  return {...base,issuerFingerprint:fingerprint('gut-mutation-review-v2',payload)};
}
export function verifyGutMutationReviewReceipt(receipt){
  if(!receipt||receipt.schema!==SCHEMA||receipt.issuerModule!==MODULE_ID||canonical(receipt.organ).toUpperCase()!=='GUT') return {ok:false,reason:'GUT_ISSUER_MODULE_REQUIRED'};
  const payload=receiptPayload(receipt); if(!payload) return {ok:false,reason:'GUT_ISSUER_EVIDENCE_REQUIRED'};
  const binding=verifyIdentityBinding(receipt,payload); if(!binding.ok) return binding;
  const derived=fingerprint('gut-mutation-review-v2',payload);
  if(canonical(receipt.issuerFingerprint)!==derived) return {ok:false,reason:'GUT_ISSUER_FINGERPRINT_INVALID',derivedIssuerFingerprint:derived};
  if(!payload.reviewArtifactFingerprint) return {ok:false,reason:'GUT_REVIEW_ARTIFACT_FINGERPRINT_REQUIRED'};
  return {ok:true,issuerModule:MODULE_ID,issuerFingerprint:derived,reviewArtifactFingerprint:payload.reviewArtifactFingerprint};
}
