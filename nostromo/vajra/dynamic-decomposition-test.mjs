import fs from 'node:fs/promises';
import vm from 'node:vm';
const load=async p=>vm.runInThisContext(await fs.readFile(p,'utf8'),{filename:p});
await load('nostromo/vajra/vajra-engine.js');
await load('nostromo/vajra/dynamic-reinspection.js');
await load('nostromo/vajra/dynamic-decomposition.js');
const V=globalThis.VajraEngine;
const failures=[];const check=(ok,type,detail)=>{if(!ok)failures.push({type,detail});};
const parent={status:'CONTESTED_BY_RECEIPTS',targetRef:'target-001',clauseRef:'clause-001',lens:'source_quality',evidenceKeys:['receipt-A','receipt-B']};
const state={status:'CONTESTED_BY_RECEIPTS',unresolved:[parent]};
const gutReceipt={targetRef:'target-001',clauseRef:'clause-001',lens:'metabolic_contamination',organ:'GUT',status:'COMPLETED',provenance:'gut-triage-evidence-001',triageClassification:'PROVENANCE_COLLISION',summary:'De-identified structural triage found source aliases that must not be counted as independent evidence.'};
check(V.dynamicDecompositionVersion==='1.3','DYNAMIC_DECOMPOSITION_VERSION_BASELINE_MISMATCH',V.dynamicDecompositionVersion);
const decomposed=V.planConflictDecomposition(state,[gutReceipt]);
check(decomposed.status==='DECOMPOSED','QUALIFYING_TRIAGE_DID_NOT_DECOMPOSE',decomposed);
check(decomposed.parent?.closed===false,'PARENT_FALSELY_CLOSED',decomposed.parent);
check(decomposed.facets?.length===2,'WRONG_FACET_COUNT',decomposed.facets);
check(decomposed.facets?.some(f=>f.lens==='source_identity'&&f.preferredOrgan==='GUT'),'SOURCE_IDENTITY_FACET_MISSING',decomposed.facets);
check(decomposed.facets?.some(f=>f.lens==='claim_relation'&&f.preferredOrgan==='MUTHER'),'CLAIM_RELATION_FACET_MISSING',decomposed.facets);
check(decomposed.facets?.every(f=>f.targetRef==='target-001'&&f.clauseRef==='clause-001'),'PROVENANCE_SCOPE_LOST',decomposed.facets);
check(Boolean(decomposed.provenance?.triageProvenanceFingerprint&&decomposed.provenance?.diagnosticFingerprint&&decomposed.provenance?.aliasAudit?.length===1),'PROVENANCE_AUDIT_NOT_RETAINED',decomposed.provenance);
check(decomposed.behaviorRegulation?.classification==='PROVENANCE_COLLISION','PROVENANCE_PROFILE_NOT_AUDITED',decomposed.behaviorRegulation);
check(decomposed.provenance?.independenceClaimed===false,'BASELINE_FALSE_INDEPENDENCE_CLAIM',decomposed.provenance);

const lowerCaseAlias={...gutReceipt,organ:undefined,sourceOrgan:'gut',provenance:'gut-triage-evidence-002'};
const aliasResult=V.planConflictDecomposition(state,[lowerCaseAlias]);
check(aliasResult.status==='DECOMPOSED','LOWERCASE_GUT_ALIAS_FALSELY_REJECTED',aliasResult);
check(aliasResult.provenance?.organIdentity==='GUT','ORGAN_ALIAS_NOT_CANONICALIZED',aliasResult.provenance);

const agreeingDualAlias={...gutReceipt,organ:'GUT',sourceOrgan:'gut',provenance:'gut-triage-evidence-003'};
const agreeingDualResult=V.planConflictDecomposition(state,[agreeingDualAlias]);
check(agreeingDualResult.status==='DECOMPOSED','AGREEING_DUAL_ORGAN_ALIAS_FALSELY_REJECTED',agreeingDualResult);

const conflictingDualAlias={...gutReceipt,organ:'GUT',sourceOrgan:'DROPLET',provenance:'gut-triage-evidence-004'};
const conflictingDualResult=V.planConflictDecomposition(state,[conflictingDualAlias]);
check(conflictingDualResult.status==='HOLD','CONFLICTING_DUAL_ORGAN_ALIAS_NOT_HELD',conflictingDualResult);
check(conflictingDualResult.facets?.length===0,'CONFLICTING_DUAL_ORGAN_ALIAS_MANUFACTURED_FACETS',conflictingDualResult.facets);
check(conflictingDualResult.rejected?.some(r=>r.reason==='organ-alias-conflict'),'CONFLICTING_DUAL_ORGAN_ALIAS_NOT_AUDITED',conflictingDualResult.rejected);

const nonGutAlias={...gutReceipt,organ:undefined,sourceOrgan:'droplet',provenance:'gut-triage-evidence-005'};
const nonGutResult=V.planConflictDecomposition(state,[nonGutAlias]);
check(nonGutResult.status==='HOLD','NON_GUT_ALIAS_WRONGLY_QUALIFIED',nonGutResult);
check(nonGutResult.rejected?.some(r=>r.reason==='gut-receipt-required'),'NON_GUT_ALIAS_REJECTION_NOT_AUDITED',nonGutResult.rejected);

// Adversarial regression: decorative/schema payload changes must not manufacture a second metabolic diagnosis.
const decoratedReplay={...gutReceipt,summary:'Same diagnosis, rewritten summary only.',note:'non-diagnostic decoration'};
const decoratedReplayResult=V.planConflictDecomposition(state,[gutReceipt,decoratedReplay]);
check(decoratedReplayResult.status==='DECOMPOSED','DECORATED_REPLAY_CHANGED_STATUS',decoratedReplayResult);
check(decoratedReplayResult.provenance?.qualifyingReceiptCount===1,'DECORATED_REPLAY_INFLATED_QUALIFYING_COUNT',decoratedReplayResult.provenance);
check(decoratedReplayResult.provenance?.aliasAudit?.length===1,'DECORATED_REPLAY_INFLATED_ALIAS_AUDIT',decoratedReplayResult.provenance);
check(decoratedReplayResult.replaySuppression?.duplicateReplayCount===1,'DECORATED_REPLAY_DUPLICATE_COUNT_WRONG',decoratedReplayResult.replaySuppression);
check(decoratedReplayResult.rejected?.some(r=>r.reason==='duplicate-diagnostic-receipt-replay'),'DECORATED_REPLAY_NOT_AUDITED_AS_DIAGNOSTIC_DUPLICATE',decoratedReplayResult.rejected);

// Counter-adversarial boundary: same provenance with a genuinely different classification must remain visible as conflict.
const changedDiagnosis={...gutReceipt,summary:'Same source, genuinely different diagnosis.',triageClassification:'DUPLICATE_CONTAMINATION'};
const changedDiagnosisResult=V.planConflictDecomposition(state,[gutReceipt,changedDiagnosis]);
check(changedDiagnosisResult.status==='HOLD','DIAGNOSTIC_DISAGREEMENT_WAS_SUPPRESSED',changedDiagnosisResult);
check(changedDiagnosisResult.reason==='conflicting-qualifying-gut-triage-classifications','DIAGNOSTIC_DISAGREEMENT_REASON_LOST',changedDiagnosisResult);
check(changedDiagnosisResult.facets?.length===0,'DIAGNOSTIC_DISAGREEMENT_MANUFACTURED_FACETS',changedDiagnosisResult.facets);
check(changedDiagnosisResult.conflict?.qualifyingReceiptCount===2,'DIAGNOSTIC_DISAGREEMENT_FALSELY_DEDUPED',changedDiagnosisResult.conflict);

const result={schema:'zenomorph-vajra-dynamic-decomposition-test/v1.3-diagnostic-replay',completedAt:new Date().toISOString(),status:failures.length?'FAIL':'PASS',capability:'GUT_TRIAGE_DIAGNOSTIC_REPLAY_CONTAINMENT',tests:{decomposed,aliasResult,agreeingDualResult,conflictingDualResult,nonGutResult,decoratedReplayResult,changedDiagnosisResult},provenance:{fixture:'synthetic de-identified contested source-quality parent, GUT schema aliases, decorated replay, and diagnostic disagreement'},failures,boundary:'PASS requires bounded organ identity canonicalization plus diagnostic replay containment: decorative receipt changes may not inflate metabolic evidence multiplicity, while a genuine classification disagreement from the same provenance must remain a zero-facet HOLD. It does not decide source truth, execute generated facets, or install persistent capability state.'};
await fs.writeFile('nostromo/vajra/dynamic-decomposition-last-result.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));
if(failures.length) process.exitCode=1;
