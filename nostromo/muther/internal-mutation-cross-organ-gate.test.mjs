import assert from 'node:assert/strict';
import { evaluateInternalMutation } from './internal-mutation.mjs';
import { verifyMutationDerivation } from './internal-mutation-derivation-witness.mjs';
import { deriveMutationLineageFingerprint, evaluateMutationCrossOrganGate } from './internal-mutation-cross-organ-gate.mjs';
import { reviewGutMutationCandidate } from '../gut/mutation-review-artifact.mjs';
import { reviewVajraMutationCandidate } from '../vajra/mutation-review-artifact.mjs';
import { issueGutMutationReviewReceipt } from '../gut/mutation-review-receipt.mjs';
import { issueVajraMutationReviewReceipt } from '../vajra/mutation-review-receipt.mjs';

const specimens = [
  { id:'theme-01', kind:'theme', traits:[
    { dimension:'typography', value:'compressed-sans', provenance:{artifactRef:'public:theme-01',versionRef:'v1'} },
    { dimension:'layout', value:'dense-grid', provenance:{artifactRef:'public:theme-01',versionRef:'v1'} }
  ]},
  { id:'text-03', kind:'text', traits:[
    { dimension:'cadence', value:'abrupt-fragment', provenance:{artifactRef:'public:text-03',versionRef:'v3'} },
    { dimension:'voice', value:'unstable-first-person', provenance:{artifactRef:'public:text-03',versionRef:'v3'} }
  ]}
];

const candidate = evaluateInternalMutation({ specimens, proposal:{ candidateId:'theme-11-candidate', traits:[
  { dimension:'voice-shell', value:'compressed-sans/unstable-first-person', operation:'hybridize', derivedFrom:[{specimenId:'theme-01',sourceDimension:'typography'},{specimenId:'text-03',sourceDimension:'voice'}] },
  { dimension:'reading-rhythm', value:'dense-grid/abrupt-fragment', operation:'cross-pressure', derivedFrom:[{specimenId:'theme-01',sourceDimension:'layout'},{specimenId:'text-03',sourceDimension:'cadence'}] }
]}});
assert.equal(candidate.status,'SANDBOX_CANDIDATE');

const derivationWitness = verifyMutationDerivation({ specimens, candidate, witnesses:[
  { outputDimension:'voice-shell', recipe:{type:'join',parts:[{specimenId:'theme-01',sourceDimension:'typography'},{literal:'/'},{specimenId:'text-03',sourceDimension:'voice'}]} },
  { outputDimension:'reading-rhythm', recipe:{type:'join',parts:[{specimenId:'theme-01',sourceDimension:'layout'},{literal:'/'},{specimenId:'text-03',sourceDimension:'cadence'}]} }
]});
assert.equal(derivationWitness.status,'DERIVATION_WITNESS_VERIFIED');
const lineageFingerprint = deriveMutationLineageFingerprint(candidate);

const gutFinding = kind => ({
  ECHO_SCAN:{verdict:'CLEAR',observation:'No uncontained inherited-output echo detected in the bounded candidate review.'},
  DUPLICATE_SCAN:{verdict:'CLEAR',observation:'No uncontained duplicate candidate contribution detected in the bounded candidate review.'},
  PROVENANCE_SCAN:{verdict:'TRACEABLE',observation:'All reviewed candidate contributions retain candidate, lineage, derivation and source references.'}
}[kind]);
const vajraFinding = kind => ({
  CONTRADICTION_SCAN:{verdict:'NONE_FOUND',finding:'No internal contradiction was found between the two bounded transformed traits and their declared derivation recipes.'},
  COUNTEREXAMPLE_SCAN:{verdict:'NONE_FOUND',finding:'The bounded counterexample probe did not produce a case that reverses either declared transformed trait under the reviewed scope.'},
  PROVENANCE_SCAN:{verdict:'TRACEABLE',finding:'Each reviewed transformed trait remains bound to the current candidate, lineage fingerprint and derivation fingerprint.'}
}[kind]);

const boundEvidence = (organ, reviewRunId) => {
  const kinds = organ === 'GUT' ? ['ECHO_SCAN','DUPLICATE_SCAN','PROVENANCE_SCAN'] : ['CONTRADICTION_SCAN','COUNTEREXAMPLE_SCAN','PROVENANCE_SCAN'];
  return kinds.map((kind,index)=>({
    ref:`${organ.toLowerCase()}:review:${reviewRunId}:${index+1}`,
    kind,
    candidateId:candidate.candidateId,
    lineageFingerprint,
    derivationFingerprint:derivationWitness.derivationFingerprint,
    ...(organ==='GUT' ? gutFinding(kind) : vajraFinding(kind))
  }));
};
function issuedReceipt(organ, provenance, reviewRunId) {
  const common={candidateId:candidate.candidateId,lineageFingerprint,derivationFingerprint:derivationWitness.derivationFingerprint,reviewRunId,evidence:boundEvidence(organ,reviewRunId)};
  const artifact=organ==='GUT' ? reviewGutMutationCandidate(common) : reviewVajraMutationCandidate(common);
  assert.equal(artifact.status,'PASS');
  return organ==='GUT' ? issueGutMutationReviewReceipt({reviewArtifact:artifact,provenance}) : issueVajraMutationReviewReceipt({reviewArtifact:artifact,provenance});
}

const gut = issuedReceipt('GUT','gut/stress-run-01','gut-review-run-01');
const vajra = issuedReceipt('VAJRA','vajra/adversarial-run-01','vajra-review-run-01');
assert.equal(gut.status,'PASS');
assert.equal(vajra.status,'PASS');
const eligible = evaluateMutationCrossOrganGate({candidate,lineageFingerprint,derivationWitness,gutReceipt:gut,vajraReceipt:vajra});
assert.equal(eligible.status,'ELIGIBLE_FOR_CONTROLLED_INCORPORATION_STAGE');
assert.equal(eligible.crossOrganAgreement,true);
assert.equal(eligible.organIssuedReviewReceipts,true);
assert.equal(eligible.issuerModules.length,2);
assert.equal(eligible.issuerFingerprints.length,2);
assert.equal(eligible.incorporationAuthorized,false);
assert.equal(eligible.bodyMutationApplied,false);

const callerMint = issueGutMutationReviewReceipt({candidateId:candidate.candidateId,lineageFingerprint,derivationFingerprint:derivationWitness.derivationFingerprint,provenance:'gut/fake',reviewRunId:'fake',evidenceRefs:['fake'],reviewWitnessFingerprint:'fake'});
assert.equal(callerMint.status,'HOLD');
assert.equal(callerMint.reason,'GUT_REVIEW_ARTIFACT_REQUIRED');

const labelOnlyGut = reviewGutMutationCandidate({candidateId:candidate.candidateId,lineageFingerprint,derivationFingerprint:derivationWitness.derivationFingerprint,reviewRunId:'gut-label-only',evidence:boundEvidence('GUT','gut-label-only').map(({verdict,observation,...item})=>item)});
assert.equal(labelOnlyGut.status,'HOLD');
assert.equal(labelOnlyGut.reason,'GUT_REVIEW_EVIDENCE_INCOMPLETE_OR_UNBOUND');

const labelOnlyVajra = reviewVajraMutationCandidate({candidateId:candidate.candidateId,lineageFingerprint,derivationFingerprint:derivationWitness.derivationFingerprint,reviewRunId:'vajra-label-only',evidence:boundEvidence('VAJRA','vajra-label-only').map(({finding,...item})=>item)});
assert.equal(labelOnlyVajra.status,'HOLD');
assert.equal(labelOnlyVajra.reason,'VAJRA_MUTATION_REVIEW_RUBBER_STAMP');

const verdictOnlyVajra = reviewVajraMutationCandidate({candidateId:candidate.candidateId,lineageFingerprint,derivationFingerprint:derivationWitness.derivationFingerprint,reviewRunId:'vajra-verdict-only',evidence:boundEvidence('VAJRA','vajra-verdict-only').map(({finding,...item})=>item)});
assert.equal(verdictOnlyVajra.status,'HOLD');
assert.equal(verdictOnlyVajra.reason,'VAJRA_MUTATION_REVIEW_RUBBER_STAMP');

const unknownVerdict = reviewVajraMutationCandidate({candidateId:candidate.candidateId,lineageFingerprint,derivationFingerprint:derivationWitness.derivationFingerprint,reviewRunId:'vajra-unknown',evidence:boundEvidence('VAJRA','vajra-unknown').map(item=>item.kind==='CONTRADICTION_SCAN'?{...item,verdict:'MAYBE'}:item)});
assert.equal(unknownVerdict.status,'HOLD');
assert.equal(unknownVerdict.reason,'VAJRA_REVIEW_VERDICT_INVALID');

for (const [kind,verdict] of [['CONTRADICTION_SCAN','FOUND'],['COUNTEREXAMPLE_SCAN','FOUND'],['PROVENANCE_SCAN','BROKEN']]) {
  const blocked=reviewVajraMutationCandidate({candidateId:candidate.candidateId,lineageFingerprint,derivationFingerprint:derivationWitness.derivationFingerprint,reviewRunId:`vajra-block-${kind}`,evidence:boundEvidence('VAJRA',`vajra-block-${kind}`).map(item=>item.kind===kind?{...item,verdict,finding:`Blocking diagnostic ${kind} recorded despite distinct review prose.`}:item)});
  assert.equal(blocked.status,'HOLD');
  assert.equal(blocked.reason,'VAJRA_REVIEW_FINDING_BLOCKS_PASS');
  assert.deepEqual(blocked.blockingDiagnostics,[kind]);
}

const missingDiagnostic = reviewVajraMutationCandidate({candidateId:candidate.candidateId,lineageFingerprint,derivationFingerprint:derivationWitness.derivationFingerprint,reviewRunId:'vajra-missing',evidence:boundEvidence('VAJRA','vajra-missing').filter(x=>x.kind!=='COUNTEREXAMPLE_SCAN')});
assert.equal(missingDiagnostic.status,'HOLD');
assert.equal(missingDiagnostic.reason,'VAJRA_REVIEW_EVIDENCE_INCOMPLETE_OR_UNBOUND');

const replayedVajraEvidence = boundEvidence('VAJRA','vajra-replayed').map((item,index)=>({...item,finding:index===1?'  Ｓａｍｅ　ｆｉｎｄｉｎｇ  ':'Same finding'}));
const replayedVajra = reviewVajraMutationCandidate({candidateId:candidate.candidateId,lineageFingerprint,derivationFingerprint:derivationWitness.derivationFingerprint,reviewRunId:'vajra-replayed',evidence:replayedVajraEvidence});
assert.equal(replayedVajra.status,'HOLD');
assert.equal(replayedVajra.reason,'VAJRA_MUTATION_REVIEW_RUBBER_STAMP');

const contaminatedEvidence = boundEvidence('GUT','gut-contaminated').map(item=>item.kind==='ECHO_SCAN' ? {...item,verdict:'DETECTED',observation:'Repeated inherited output remains uncontained.'} : item);
const contaminatedGut = reviewGutMutationCandidate({candidateId:candidate.candidateId,lineageFingerprint,derivationFingerprint:derivationWitness.derivationFingerprint,reviewRunId:'gut-contaminated',evidence:contaminatedEvidence});
assert.equal(contaminatedGut.status,'HOLD');
assert.equal(contaminatedGut.reason,'GUT_REVIEW_FINDING_BLOCKS_PASS');

const incompleteGut = reviewGutMutationCandidate({candidateId:candidate.candidateId,lineageFingerprint,derivationFingerprint:derivationWitness.derivationFingerprint,reviewRunId:'gut-incomplete',evidence:boundEvidence('GUT','gut-incomplete').filter(x=>x.kind!=='PROVENANCE_SCAN')});
assert.equal(incompleteGut.status,'HOLD');
assert.equal(incompleteGut.reason,'GUT_REVIEW_EVIDENCE_INCOMPLETE_OR_UNBOUND');

const wrongEvidence=boundEvidence('VAJRA','vajra-wrong').map(x=>({...x,candidateId:'other-candidate'}));
const wrongArtifact=reviewVajraMutationCandidate({candidateId:candidate.candidateId,lineageFingerprint,derivationFingerprint:derivationWitness.derivationFingerprint,reviewRunId:'vajra-wrong',evidence:wrongEvidence});
assert.equal(wrongArtifact.status,'HOLD');

const gutArtifact=reviewGutMutationCandidate({candidateId:candidate.candidateId,lineageFingerprint,derivationFingerprint:derivationWitness.derivationFingerprint,reviewRunId:'gut-tamper',evidence:boundEvidence('GUT','gut-tamper')});
const tamperedArtifact=structuredClone(gutArtifact);
tamperedArtifact.evidence[0].ref='gut:injected:after-review';
const tamperedReceipt=issueGutMutationReviewReceipt({reviewArtifact:tamperedArtifact,provenance:'gut/tampered'});
assert.equal(tamperedReceipt.status,'HOLD');
assert.equal(tamperedReceipt.reason,'GUT_REVIEW_ARTIFACT_FINGERPRINT_INVALID');

const tamperedGut = structuredClone(gut);
tamperedGut.reviewWitness.evidenceRefs.push('gut:evidence:post-issue-injection');
const tampered = evaluateMutationCrossOrganGate({candidate,lineageFingerprint,derivationWitness,gutReceipt:tamperedGut,vajraReceipt:vajra});
assert.equal(tampered.status,'HOLD');
assert.equal(tampered.reason,'GUT_REVIEW_RECEIPT_WITNESS_FINGERPRINT_INVALID');

const outerTamperedGut = structuredClone(gut);
outerTamperedGut.provenance='gut/tampered-after-issue';
const outerTampered = evaluateMutationCrossOrganGate({candidate,lineageFingerprint,derivationWitness,gutReceipt:outerTamperedGut,vajraReceipt:vajra});
assert.equal(outerTampered.status,'HOLD');
assert.equal(outerTampered.reason,'GUT_ISSUER_FINGERPRINT_INVALID');

const sharedGut = issuedReceipt('GUT','gut/shared',' shared-run ');
const sharedVajra = issuedReceipt('VAJRA','vajra/shared','ｓｈａｒｅｄ－ｒｕｎ');
const sharedRun = evaluateMutationCrossOrganGate({candidate,lineageFingerprint,derivationWitness,gutReceipt:sharedGut,vajraReceipt:sharedVajra});
assert.equal(sharedRun.status,'HOLD');
assert.equal(sharedRun.reason,'CROSS_ORGAN_REVIEW_RUN_INDEPENDENCE_NOT_DEMONSTRATED');

const tamperedCandidate=structuredClone(candidate);
tamperedCandidate.candidateTraits[0].value='post-review-unseen-typography';
const stale=evaluateMutationCrossOrganGate({candidate:tamperedCandidate,lineageFingerprint,derivationWitness,gutReceipt:gut,vajraReceipt:vajra});
assert.equal(stale.status,'HOLD');
assert.equal(stale.reason,'MUTHER_CALLER_LINEAGE_NOT_BOUND_TO_CANDIDATE');

console.log(JSON.stringify({
  schema:'zenomorph-muther-internal-mutation-cross-organ-gate-test/v0.11',
  status:'PASS',
  capability:'MUTHER_MUTATION_REQUIRES_EXPLICIT_VAJRA_DIAGNOSTIC_VERDICTS_AND_GUT_WITNESS_IDENTITY_TAMPER_IS_SEPARATED_FROM_OUTER_RECEIPT_TAMPER',
  boundary:'PASS proves the mutation gate requires structured VAJRA contradiction, counterexample and provenance outcomes tied to exact lineage, and distinguishes nested GUT witness tamper from outer receipt tamper. It does not prove truth, semantic understanding, cryptographic organ identity, or authority to mutate the persistent body.'
},null,2));
