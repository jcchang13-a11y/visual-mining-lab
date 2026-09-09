import fs from 'node:fs/promises';
import vm from 'node:vm';
const load=async p=>vm.runInThisContext(await fs.readFile(p,'utf8'),{filename:p});
await load('nostromo/vajra/vajra-engine.js');
await load('nostromo/vajra/dynamic-reinspection.js');
await load('nostromo/vajra/dynamic-decomposition.js');
await load('nostromo/vajra/triage-alias-replay-guard.js');
const V=globalThis.VajraEngine;
const failures=[];
const check=(ok,type,detail)=>{if(!ok)failures.push({type,detail});};

const result={unresolved:[{targetRef:'target-1',clauseRef:'clause-1',lens:'source_quality',status:'CONTESTED_BY_RECEIPTS'}]};
const canonical={targetRef:'target-1',clauseRef:'clause-1',organ:'GUT',status:'COMPLETED',provenance:'synthetic-source-a',triageClassification:'PROVENANCE_COLLISION'};
const aliases={targetRef:'target-1',clauseRef:'clause-1',sourceOrgan:'GUT',status:'COMPLETED',provenanceFingerprint:'synthetic-source-a',classification:'provenance_collision'};

check(V.triageAliasReplayGuardVersion==='0.5','ALIAS_REPLAY_GUARD_VERSION_MISMATCH',V.triageAliasReplayGuardVersion);
const aliasReplay=V.planConflictDecomposition(result,[canonical,aliases]);
check(aliasReplay.status==='DECOMPOSED','ALIAS_REPLAY_CHANGED_STATUS',aliasReplay);
check(aliasReplay.replaySuppression?.duplicateReplayCount===1,'ALIAS_REPLAY_NOT_SUPPRESSED',aliasReplay.replaySuppression);
check(aliasReplay.provenance?.qualifyingReceiptCount===1,'ALIAS_REPLAY_INFLATED_QUALIFYING_COUNT',aliasReplay.provenance);
check(aliasReplay.schemaAliasReplayGuard?.version==='0.5','ALIAS_GUARD_METADATA_MISSING',aliasReplay.schemaAliasReplayGuard);
check(aliasReplay.facets?.some(f=>f.lens==='source_identity'&&f.preferredOrgan==='GUT'),'GUT_FACET_MISSING',aliasReplay.facets);
check(aliasReplay.facets?.some(f=>f.lens==='claim_relation'&&f.preferredOrgan==='MUTHER'),'CROSS_ORGAN_BEHAVIOR_MISSING',aliasReplay.facets);

const decoratedEcho={...canonical,summary:'Same GUT diagnosis delivered again with a different non-authoritative summary.',note:'transport decoration must not create another metabolic vote'};
const decoratedReplay=V.planConflictDecomposition(result,[canonical,decoratedEcho]);
check(decoratedReplay.status==='DECOMPOSED','DECORATED_ECHO_CHANGED_STATUS',decoratedReplay);
check(decoratedReplay.provenance?.qualifyingReceiptCount===1,'DECORATED_ECHO_INFLATED_QUALIFYING_COUNT',decoratedReplay.provenance);
check(decoratedReplay.provenance?.aliasAudit?.length===1,'DECORATED_ECHO_INFLATED_ALIAS_AUDIT',decoratedReplay.provenance);
check(decoratedReplay.schemaAliasReplayGuard?.sameProvenanceReceiptEchoCount===1,'DECORATED_ECHO_NOT_AUDITED',decoratedReplay.schemaAliasReplayGuard);
check(decoratedReplay.replaySuppression?.sameProvenanceReceiptEchoCount===1,'DECORATED_ECHO_REPLAY_COUNT_MISSING',decoratedReplay.replaySuppression);

const canonicalEquivalentProvenanceAlias={...canonical,provenance:'Synthetic Source A',provenanceFingerprint:'synthetic-source-a'};
const equivalentAliasResult=V.planConflictDecomposition(result,[canonicalEquivalentProvenanceAlias]);
check(equivalentAliasResult.status==='DECOMPOSED','CANONICAL_EQUIVALENT_PROVENANCE_ALIAS_FALSELY_HELD',equivalentAliasResult);
check((equivalentAliasResult.aliasConflicts||[]).length===0,'CANONICAL_EQUIVALENT_PROVENANCE_ALIAS_CONFLICT_EMITTED',equivalentAliasResult.aliasConflicts);
check(equivalentAliasResult.provenance?.qualifyingReceiptCount===1,'CANONICAL_EQUIVALENT_ALIAS_COUNT_WRONG',equivalentAliasResult.provenance);

const canonicalEquivalentOrganAlias={...canonical,sourceOrgan:'gut'};
const equivalentOrganAliasResult=V.planConflictDecomposition(result,[canonicalEquivalentOrganAlias]);
check(equivalentOrganAliasResult.status==='DECOMPOSED','CANONICAL_EQUIVALENT_ORGAN_ALIAS_FALSELY_HELD',equivalentOrganAliasResult);
check((equivalentOrganAliasResult.aliasConflicts||[]).length===0,'CANONICAL_EQUIVALENT_ORGAN_ALIAS_CONFLICT_EMITTED',equivalentOrganAliasResult.aliasConflicts);
check(equivalentOrganAliasResult.provenance?.qualifyingReceiptCount===1,'CANONICAL_EQUIVALENT_ORGAN_ALIAS_COUNT_WRONG',equivalentOrganAliasResult.provenance);

const aliasOnlyLowerOrgan={targetRef:'target-1',clauseRef:'clause-1',sourceOrgan:'gut',status:'COMPLETED',provenanceFingerprint:'synthetic-source-a',classification:'provenance_collision'};
const aliasOnlyLowerOrganResult=V.planConflictDecomposition(result,[aliasOnlyLowerOrgan]);
check(aliasOnlyLowerOrganResult.status==='DECOMPOSED','LOWERCASE_ALIAS_ONLY_ORGAN_NOT_QUALIFIED',aliasOnlyLowerOrganResult);
check(aliasOnlyLowerOrganResult.provenance?.qualifyingReceiptCount===1,'LOWERCASE_ALIAS_ONLY_ORGAN_COUNT_WRONG',aliasOnlyLowerOrganResult.provenance);
check(aliasOnlyLowerOrganResult.facets?.some(f=>f.lens==='source_identity'&&f.preferredOrgan==='GUT'),'LOWERCASE_ALIAS_ONLY_GUT_FACET_MISSING',aliasOnlyLowerOrganResult.facets);

const sameProvDiagnosticConflict=V.planConflictDecomposition(result,[canonical,{...canonical,triageClassification:'DUPLICATE_CONTAMINATION',summary:'Same provenance, genuinely different GUT diagnosis.'}]);
check(sameProvDiagnosticConflict.status==='HOLD'&&sameProvDiagnosticConflict.reason==='conflicting-qualifying-gut-triage-classifications','SAME_PROVENANCE_DIAGNOSTIC_CONFLICT_COLLAPSED',sameProvDiagnosticConflict);
check((sameProvDiagnosticConflict.facets||[]).length===0,'DIAGNOSTIC_CONFLICT_CREATED_FACETS',sameProvDiagnosticConflict.facets);

const organConflict=V.planConflictDecomposition(result,[{...canonical,sourceOrgan:'DROPLET'}]);
check(organConflict.status==='HOLD'&&organConflict.reason==='conflicting-schema-alias-fields','CONFLICTING_ORGAN_ALIAS_NOT_HELD',organConflict);
check((organConflict.facets||[]).length===0,'CONFLICTING_ORGAN_ALIAS_CREATED_FACETS',organConflict.facets);

const classConflict=V.planConflictDecomposition(result,[{...canonical,classification:'DUPLICATE_CONTAMINATION'}]);
check(classConflict.status==='HOLD'&&classConflict.reason==='conflicting-schema-alias-fields','CONFLICTING_CLASS_ALIAS_NOT_HELD',classConflict);

const provenanceConflict=V.planConflictDecomposition(result,[{...canonical,provenanceFingerprint:'synthetic-source-b'}]);
check(provenanceConflict.status==='HOLD'&&provenanceConflict.reason==='conflicting-schema-alias-fields','CONFLICTING_PROVENANCE_ALIAS_NOT_HELD',provenanceConflict);
check((provenanceConflict.aliasConflicts||[]).every(x=>!('canonicalValue' in x)&&!('aliasValue' in x)),'RAW_CONFLICT_VALUE_LEAKED',provenanceConflict.aliasConflicts);

const unrelatedTargetConflict={targetRef:'target-unrelated',clauseRef:'clause-unrelated',organ:'GUT',sourceOrgan:'DROPLET',status:'COMPLETED',provenance:'synthetic-noise-a',triageClassification:'PROVENANCE_COLLISION'};
const unrelatedTargetResult=V.planConflictDecomposition(result,[canonical,unrelatedTargetConflict]);
check(unrelatedTargetResult.status==='DECOMPOSED','OUT_OF_SCOPE_TARGET_ALIAS_CONFLICT_POISONED_ACTIVE_BRANCH',unrelatedTargetResult);
check(unrelatedTargetResult.provenance?.qualifyingReceiptCount===1,'OUT_OF_SCOPE_TARGET_ALIAS_CONFLICT_CHANGED_QUALIFYING_COUNT',unrelatedTargetResult.provenance);
check(unrelatedTargetResult.schemaAliasReplayGuard?.rejectedOutOfScopeAliasConflictCount===1,'OUT_OF_SCOPE_TARGET_ALIAS_CONFLICT_NOT_AUDITED',unrelatedTargetResult.schemaAliasReplayGuard);
check((unrelatedTargetResult.facets||[]).length===2,'OUT_OF_SCOPE_TARGET_ALIAS_CONFLICT_CHANGED_FACETS',unrelatedTargetResult.facets);

const unrelatedClauseConflict={targetRef:'target-1',clauseRef:'clause-unrelated',organ:'GUT',sourceOrgan:'DROPLET',status:'COMPLETED',provenance:'synthetic-noise-b',triageClassification:'PROVENANCE_COLLISION'};
const unrelatedClauseResult=V.planConflictDecomposition(result,[canonical,unrelatedClauseConflict]);
check(unrelatedClauseResult.status==='DECOMPOSED','OUT_OF_SCOPE_CLAUSE_ALIAS_CONFLICT_POISONED_ACTIVE_BRANCH',unrelatedClauseResult);
check(unrelatedClauseResult.schemaAliasReplayGuard?.rejectedOutOfScopeAliasConflictCount===1,'OUT_OF_SCOPE_CLAUSE_ALIAS_CONFLICT_NOT_AUDITED',unrelatedClauseResult.schemaAliasReplayGuard);

const missingScopeConflict={organ:'GUT',sourceOrgan:'DROPLET',status:'COMPLETED',provenance:'synthetic-noise-c',triageClassification:'PROVENANCE_COLLISION'};
const missingScopeResult=V.planConflictDecomposition(result,[canonical,missingScopeConflict]);
check(missingScopeResult.status==='DECOMPOSED','MISSING_SCOPE_ALIAS_CONFLICT_POISONED_ACTIVE_BRANCH',missingScopeResult);
check(missingScopeResult.schemaAliasReplayGuard?.rejectedOutOfScopeAliasConflictCount===1,'MISSING_SCOPE_ALIAS_CONFLICT_NOT_AUDITED',missingScopeResult.schemaAliasReplayGuard);

const out={
  schema:'zenomorph-vajra-triage-alias-replay-test/v0.5',
  completedAt:new Date().toISOString(),
  status:failures.length?'FAIL':'PASS',
  capability:'GUT_TRIAGE_SCHEMA_ALIAS_REPLAY_CONTAINMENT_WITH_PARENT_SCOPED_CONFLICT_AUTHORITY',
  tests:{
    aliasReplayStatus:aliasReplay.status,
    duplicateReplayCount:aliasReplay.replaySuppression?.duplicateReplayCount,
    qualifyingReceiptCount:aliasReplay.provenance?.qualifyingReceiptCount,
    decoratedEcho:{status:decoratedReplay.status,qualifyingReceiptCount:decoratedReplay.provenance?.qualifyingReceiptCount,aliasAuditCount:decoratedReplay.provenance?.aliasAudit?.length,echoCount:decoratedReplay.schemaAliasReplayGuard?.sameProvenanceReceiptEchoCount},
    canonicalEquivalentProvenanceAlias:{status:equivalentAliasResult.status,qualifyingReceiptCount:equivalentAliasResult.provenance?.qualifyingReceiptCount,aliasConflictCount:(equivalentAliasResult.aliasConflicts||[]).length},
    canonicalEquivalentOrganAlias:{status:equivalentOrganAliasResult.status,qualifyingReceiptCount:equivalentOrganAliasResult.provenance?.qualifyingReceiptCount,aliasConflictCount:(equivalentOrganAliasResult.aliasConflicts||[]).length},
    lowercaseAliasOnlyOrgan:{status:aliasOnlyLowerOrganResult.status,qualifyingReceiptCount:aliasOnlyLowerOrganResult.provenance?.qualifyingReceiptCount},
    sameProvenanceDiagnosticConflict:{status:sameProvDiagnosticConflict.status,reason:sameProvDiagnosticConflict.reason},
    crossOrganFacets:(aliasReplay.facets||[]).map(f=>({lens:f.lens,preferredOrgan:f.preferredOrgan})),
    organConflict:organConflict.status,
    classConflict:classConflict.status,
    provenanceConflict:provenanceConflict.status,
    outOfScopeConflictContainment:{unrelatedTargetStatus:unrelatedTargetResult.status,unrelatedClauseStatus:unrelatedClauseResult.status,missingScopeStatus:missingScopeResult.status,rejectedTargetConflicts:unrelatedTargetResult.schemaAliasReplayGuard?.rejectedOutOfScopeAliasConflictCount,rejectedClauseConflicts:unrelatedClauseResult.schemaAliasReplayGuard?.rejectedOutOfScopeAliasConflictCount,rejectedMissingScopeConflicts:missingScopeResult.schemaAliasReplayGuard?.rejectedOutOfScopeAliasConflictCount}
  },
  failures,
  provenance:'Synthetic receipts only. No private Drive names, IDs, URLs, or source text are written by this test.',
  boundary:'PASS proves only that equivalent GUT receipt aliases remain bounded, same-provenance/same-classification echoes cannot manufacture evidential multiplicity, and contradictory alias fields can change decomposition behavior only when targetRef+clauseRef scope matches an active contested source-quality parent. Out-of-scope or scope-missing alias conflicts remain fingerprinted audit evidence but cannot manufacture HOLD, target selection, multiplicity, or facets. Genuine scoped alias disagreement and same-provenance diagnostic disagreement remain HOLD. It does not adjudicate source truth or install capability state.'
};
await fs.writeFile('nostromo/vajra/triage-alias-replay-last-result.json',JSON.stringify(out,null,2)+'\n');
console.log(JSON.stringify(out,null,2));
if(failures.length) process.exitCode=1;
