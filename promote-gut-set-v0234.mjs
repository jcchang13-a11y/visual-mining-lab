import fs from 'node:fs/promises';

const registryPath='nostromo/integration/organ-registry.json';
const setResultPath='nostromo/integration/gut-set-last-result.json';
const ciPath='nostromo/integration/ci-last-result.json';
const registry=JSON.parse(await fs.readFile(registryPath,'utf8'));
const setResult=JSON.parse(await fs.readFile(setResultPath,'utf8'));
const ci=JSON.parse(await fs.readFile(ciPath,'utf8'));

const failures=[];
if(setResult.status!=='PASS'||setResult.engineVersion!=='0.2.34') failures.push({type:'FOCUSED_SET_EVIDENCE_NOT_PASS',setResult});
if(ci.status!=='PASS'||!Array.isArray(ci.failures)||ci.failures.length) failures.push({type:'FULL_CI_NOT_PASS',status:ci.status,failures:ci.failures});
if(failures.length){console.error(JSON.stringify({status:'PROMOTION_BLOCKED',failures},null,2));process.exit(1);}

registry.schema='nostromo-organ-registry/v1.85';
registry.updatedAt=new Date().toISOString();
if(!String(registry.evidence||'').includes('gut-set-last-result.json')) registry.evidence=String(registry.evidence||'')+' plus gut-set-last-result.json';
registry.latestThickening={
  organ:'GUT',
  version:'GUT v0.2.34 Set container preservation',
  status:'VERIFIED_PATH_SCOPED_SET_MEMBER_PRESERVATION_WITH_CONTAINER_PROVENANCE_AND_SET_LOCAL_MULTIPLICITY',
  test:`gut-set-last-result.json PASS at ${setResult.completedAt} + full NOSTROMO Integration CI PASS at ${ci.completedAt}`,
  capabilities:[
    'JavaScript Set containers are expanded before generic enumerable-object traversal instead of silently disappearing because Set members are not enumerable own object fields',
    'each Set member is emitted through a deterministic member-index path and retains containerKind=set plus setMember provenance',
    'equal rendered payload text from distinct Set member objects remains separately auditable by member path instead of being collapsed by global text-only deduplication',
    'evidence and finite numeric material inside Set members retain ordinary routing behavior',
    'Error objects inside Set members retain ERROR_OBJECT quarantine behavior plus Set provenance',
    'ordinary non-Set textual duplicate suppression remains active, so Set multiplicity preservation does not disable existing pollution containment'
  ],
  boundary:'This is deterministic structural container preservation and path-scoped multiplicity. Set membership, insertion order and repeated rendered values do not establish semantic membership, ontology, source independence, evidence quality, novelty or factual truth.'
};
const gut=registry.organs?.gut;
if(!gut) throw new Error('registry.organs.gut missing');
gut.actions.DIGEST='VERIFIED_HEURISTIC_METABOLIC_ROUTER_TYPED_FINITE_NONFINITE_BOOLEAN_NULLISH_BIGINT_SYMBOL_DATE_ERROR_MAP_AND_SET_HANDLING_WITH_PATH_SCOPED_CONTAINER_PROVENANCE_AND_OUT_OF_BAND_REFERENTIAL_CARRY';
const setBoundary=' JavaScript Set containers are expanded before generic object traversal into deterministic member-index paths with containerKind=set and setMember provenance; Set members no longer disappear because Set has no enumerable own payload fields, and distinct retained member paths preserve local structural multiplicity. This does not infer semantic membership, ontology, source independence, evidence quality, novelty or truth.';
if(!gut.boundary.includes('JavaScript Set containers')) gut.boundary=gut.boundary+setBoundary;
gut.boundary=gut.boundary.replace('GUT v0.2.33 is','GUT v0.2.34 is');

await fs.writeFile(registryPath,JSON.stringify(registry,null,2)+'\n','utf8');
console.log(JSON.stringify({status:'PROMOTED',schema:registry.schema,latestThickening:registry.latestThickening,ciCompletedAt:ci.completedAt},null,2));
