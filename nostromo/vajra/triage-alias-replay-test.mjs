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

const aliasReplay=V.planConflictDecomposition(result,[canonical,aliases]);
check(aliasReplay.status==='DECOMPOSED','ALIAS_REPLAY_CHANGED_STATUS',aliasReplay);
check(aliasReplay.replaySuppression?.duplicateReplayCount===1,'ALIAS_REPLAY_NOT_SUPPRESSED',aliasReplay.replaySuppression);
check(aliasReplay.provenance?.qualifyingReceiptCount===1,'ALIAS_REPLAY_INFLATED_QUALIFYING_COUNT',aliasReplay.provenance);
check(aliasReplay.schemaAliasReplayGuard?.version==='0.1','ALIAS_GUARD_METADATA_MISSING',aliasReplay.schemaAliasReplayGuard);
check(aliasReplay.facets?.some(f=>f.lens==='source_identity'&&f.preferredOrgan==='GUT'),'GUT_FACET_MISSING',aliasReplay.facets);
check(aliasReplay.facets?.some(f=>f.lens==='claim_relation'&&f.preferredOrgan==='MUTHER'),'CROSS_ORGAN_BEHAVIOR_MISSING',aliasReplay.facets);

const organConflict=V.planConflictDecomposition(result,[{...canonical,sourceOrgan:'DROPLET'}]);
check(organConflict.status==='HOLD'&&organConflict.reason==='conflicting-schema-alias-fields','CONFLICTING_ORGAN_ALIAS_NOT_HELD',organConflict);
check((organConflict.facets||[]).length===0,'CONFLICTING_ORGAN_ALIAS_CREATED_FACETS',organConflict.facets);

const classConflict=V.planConflictDecomposition(result,[{...canonical,classification:'DUPLICATE_CONTAMINATION'}]);
check(classConflict.status==='HOLD'&&classConflict.reason==='conflicting-schema-alias-fields','CONFLICTING_CLASS_ALIAS_NOT_HELD',classConflict);

const provenanceConflict=V.planConflictDecomposition(result,[{...canonical,provenanceFingerprint:'synthetic-source-b'}]);
check(provenanceConflict.status==='HOLD'&&provenanceConflict.reason==='conflicting-schema-alias-fields','CONFLICTING_PROVENANCE_ALIAS_NOT_HELD',provenanceConflict);
check((provenanceConflict.aliasConflicts||[]).every(x=>!('canonicalValue' in x)&&!('aliasValue' in x)),'RAW_CONFLICT_VALUE_LEAKED',provenanceConflict.aliasConflicts);

const out={
  schema:'zenomorph-vajra-triage-alias-replay-test/v0.1',
  completedAt:new Date().toISOString(),
  status:failures.length?'FAIL':'PASS',
  capability:'GUT_TRIAGE_SCHEMA_ALIAS_REPLAY_CONTAINMENT',
  tests:{
    aliasReplayStatus:aliasReplay.status,
    duplicateReplayCount:aliasReplay.replaySuppression?.duplicateReplayCount,
    qualifyingReceiptCount:aliasReplay.provenance?.qualifyingReceiptCount,
    crossOrganFacets:(aliasReplay.facets||[]).map(f=>({lens:f.lens,preferredOrgan:f.preferredOrgan})),
    organConflict:organConflict.status,
    classConflict:classConflict.status,
    provenanceConflict:provenanceConflict.status
  },
  failures,
  provenance:'Synthetic receipts only. No private Drive names, IDs, URLs, or source text are written by this test.',
  boundary:'PASS proves only that equivalent declared GUT triage schema aliases cannot manufacture receipt multiplicity and that contradictory alias fields force a reversible HOLD. It does not infer semantic equivalence beyond the explicit alias allowlist, adjudicate source truth, or install capability state.'
};
await fs.writeFile('nostromo/vajra/triage-alias-replay-last-result.json',JSON.stringify(out,null,2)+'\n');
console.log(JSON.stringify(out,null,2));
if(failures.length) process.exitCode=1;
