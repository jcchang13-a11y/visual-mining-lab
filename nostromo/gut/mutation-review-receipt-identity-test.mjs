import { reviewGutMutationCandidate } from './mutation-review-artifact.mjs';
import { issueGutMutationReviewReceipt, verifyGutMutationReviewReceipt } from './mutation-review-receipt.mjs';

const canonical=value=>typeof value==='string'?value.trim().normalize('NFKC'):'';
function fnv1a32(text, seed = 0x811c9dc5) { let hash=seed>>>0; for(let i=0;i<text.length;i++){ hash^=text.charCodeAt(i); hash=Math.imul(hash,0x01000193)>>>0; } return hash.toString(16).padStart(8,'0'); }
function fingerprint(prefix,payload){ const text=JSON.stringify(payload); return `${prefix}:${fnv1a32(text,0x811c9dc5)}${fnv1a32(text,0x9e3779b9)}`; }
function normalizeRefs(refs){ if(!Array.isArray(refs)||refs.length===0)return null; const normalized=refs.map(canonical); if(normalized.some(v=>!v))return null; return [...new Set(normalized)].sort(); }
function receiptPayload(receipt){
  const evidenceRefs=normalizeRefs(receipt?.reviewWitness?.evidenceRefs); if(!evidenceRefs)return null;
  return {schema:'zenomorph-gut-mutation-review-receipt/v0.2',issuerModule:'nostromo/gut/mutation-review-receipt@0.2',organ:'GUT',status:canonical(receipt?.status).toUpperCase(),candidateId:canonical(receipt?.candidateId),lineageFingerprint:canonical(receipt?.lineageFingerprint),derivationFingerprint:canonical(receipt?.derivationFingerprint),provenance:canonical(receipt?.provenance),reviewRunId:canonical(receipt?.reviewRunId),reviewArtifactFingerprint:canonical(receipt?.reviewArtifactFingerprint),reviewWitness:{organ:'GUT',kind:'METABOLIC_CONTAMINATION_REVIEW',candidateId:canonical(receipt?.reviewWitness?.candidateId),lineageFingerprint:canonical(receipt?.reviewWitness?.lineageFingerprint),derivationFingerprint:canonical(receipt?.reviewWitness?.derivationFingerprint),reviewRunId:canonical(receipt?.reviewWitness?.reviewRunId),evidenceRefs,checks:{echoChecked:receipt?.reviewWitness?.checks?.echoChecked===true,duplicateChecked:receipt?.reviewWitness?.checks?.duplicateChecked===true,provenanceChecked:receipt?.reviewWitness?.checks?.provenanceChecked===true},reviewWitnessFingerprint:canonical(receipt?.reviewWitness?.reviewWitnessFingerprint)}};
}
function rewrap(receipt,patch){
  const forged=structuredClone(receipt);
  Object.assign(forged,patch);
  forged.issuerFingerprint=fingerprint('gut-mutation-review-v2',receiptPayload(forged));
  return forged;
}
function assert(condition,message){ if(!condition) throw new Error(message); }
function expectReason(result,reason,label){ assert(result?.ok===false,`${label}: expected rejection`); assert(result.reason===reason,`${label}: expected ${reason}, got ${result.reason}`); }

const id={candidateId:'CAND-A',lineageFingerprint:'lineage-A',derivationFingerprint:'derive-A',reviewRunId:'gut-review-run-A'};
const evidence=[
  {ref:'echo-A',kind:'ECHO_SCAN',...id,verdict:'CLEAR',observation:'no metabolic echo detected'},
  {ref:'duplicate-A',kind:'DUPLICATE_SCAN',...id,verdict:'CLEAR',observation:'no duplicate replay detected'},
  {ref:'provenance-A',kind:'PROVENANCE_SCAN',...id,verdict:'TRACEABLE',observation:'mutation lineage remains traceable'}
];
const artifact=reviewGutMutationCandidate({...id,evidence});
assert(artifact.status==='PASS','fixture review artifact must pass');
const receipt=issueGutMutationReviewReceipt({reviewArtifact:artifact,provenance:'gut/identity-binding-test'});
assert(receipt.status==='PASS','fixture receipt must pass');
assert(verifyGutMutationReviewReceipt(receipt).ok===true,'valid aligned receipt must verify');

expectReason(verifyGutMutationReviewReceipt(rewrap(receipt,{candidateId:'CAND-B'})),'GUT_REVIEW_RECEIPT_IDENTITY_UNBOUND','candidate cover/witness swap');
expectReason(verifyGutMutationReviewReceipt(rewrap(receipt,{lineageFingerprint:'lineage-B'})),'GUT_REVIEW_RECEIPT_IDENTITY_UNBOUND','lineage cover/witness swap');
expectReason(verifyGutMutationReviewReceipt(rewrap(receipt,{derivationFingerprint:'derive-B'})),'GUT_REVIEW_RECEIPT_IDENTITY_UNBOUND','derivation cover/witness swap');
expectReason(verifyGutMutationReviewReceipt(rewrap(receipt,{reviewRunId:'gut-review-run-B'})),'GUT_REVIEW_RECEIPT_IDENTITY_UNBOUND','review-run cover/witness swap');

const witnessTamper=structuredClone(receipt);
witnessTamper.reviewWitness.reviewWitnessFingerprint='organ-review-v1:0000000000000000';
witnessTamper.issuerFingerprint=fingerprint('gut-mutation-review-v2',receiptPayload(witnessTamper));
expectReason(verifyGutMutationReviewReceipt(witnessTamper),'GUT_REVIEW_RECEIPT_WITNESS_FINGERPRINT_INVALID','nested witness fingerprint laundering');

const boundedAlias=rewrap(receipt,{candidateId:' ＣＡＮＤ-A ',lineageFingerprint:' lineage-A ',derivationFingerprint:' derive-A ',reviewRunId:' gut-review-run-A '});
assert(verifyGutMutationReviewReceipt(boundedAlias).ok===true,'trim/NFKC-equivalent identity aliases should remain equivalent');

console.log(JSON.stringify({schema:'zenomorph-gut-mutation-review-receipt-identity-test/v0.1',status:'PASS',failureClosed:'MUTATION_REVIEW_RECEIPT_IDENTITY_LAUNDERING',cases:{aligned:true,candidateSwapRejected:true,lineageSwapRejected:true,derivationSwapRejected:true,reviewRunSwapRejected:true,witnessFingerprintLaunderingRejected:true,boundedCanonicalAliasAccepted:true},boundary:'Identity binding prevents a valid GUT witness for one mutation lineage from being rewrapped as another lineage. This does not authorize incorporation or certify semantic quality.'},null,2));
