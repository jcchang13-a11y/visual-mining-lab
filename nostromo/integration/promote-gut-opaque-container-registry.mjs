import fs from 'node:fs/promises';

const registryPath='nostromo/integration/organ-registry.json';
const ciPath='nostromo/integration/ci-last-result.json';
const metabolismPath='nostromo/integration/gut-metabolism-last-result.json';
const focusedPath='nostromo/integration/gut-opaque-container-last-result.json';
const cyclePath='nostromo/integration/gut-cycle-last-result.json';

const registry=JSON.parse(await fs.readFile(registryPath,'utf8'));
const ci=JSON.parse(await fs.readFile(ciPath,'utf8'));
const metabolism=JSON.parse(await fs.readFile(metabolismPath,'utf8'));
const focused=JSON.parse(await fs.readFile(focusedPath,'utf8'));
const cycle=JSON.parse(await fs.readFile(cyclePath,'utf8'));
const failures=[];
if(ci.status!=='PASS'||(ci.failures||[]).length) failures.push({label:'full-ci-not-pass',status:ci.status,failures:ci.failures||[]});
if(metabolism.status!=='PASS'||metabolism?.gut?.version!=='0.2.36') failures.push({label:'full-ci-gut-version-not-current',status:metabolism.status,engineVersion:metabolism?.gut?.version});
if(focused.status!=='PASS'||focused.engineVersion!=='0.2.36') failures.push({label:'focused-opaque-test-not-pass',status:focused.status,engineVersion:focused.engineVersion});
if(cycle.status!=='PASS') failures.push({label:'cycle-baseline-not-pass',status:cycle.status});
if(failures.length){console.error(JSON.stringify({status:'PROMOTION_ABORTED',failures},null,2));process.exit(1);}

registry.schema='nostromo-organ-registry/v1.86';
registry.updatedAt=new Date().toISOString();
const evidenceParts=String(registry.evidence||'').split(' plus ').filter(Boolean);
for(const item of ['gut-cycle-last-result.json','gut-opaque-container-last-result.json']) if(!evidenceParts.includes(item)) evidenceParts.push(item);
registry.evidence=evidenceParts.join(' plus ');
registry.latestThickening={
  organ:'GUT',
  version:'GUT v0.2.36 opaque weak-container containment',
  status:'VERIFIED_OPAQUE_WEAKMAP_WEAKSET_QUARANTINE_WITH_PATH_PROVENANCE_AND_NO_HIDDEN_ENTRY_FABRICATION',
  test:`gut-opaque-container-last-result.json PASS at ${focused.completedAt} + full NOSTROMO Integration CI PASS at ${ci.completedAt}`,
  capabilities:[
    'WeakMap and WeakSet containers no longer silently disappear from GUT intake merely because JavaScript does not expose enumerable entries',
    'each inaccessible weak container becomes a path-scoped OPAQUE_CONTAINER quarantine atom that preserves the visible container type and intake provenance',
    'GUT does not fabricate or infer hidden WeakMap/WeakSet entries; sibling visible material remains independently routable',
    'ordinary Map and Set traversal remains inspectable and regression-tested rather than being misclassified as opaque',
    'the previously verified active-ancestor cycle guard remains in force, preserving explicit cycle origin paths without falsely classifying non-cyclic aliases'
  ],
  boundary:'This is deterministic source-loss containment at the JavaScript object boundary. WeakMap and WeakSet entries are intentionally inaccessible to enumeration, so NOSTROMO records the opaque container instead of pretending to inspect it or dropping it silently. Opaque-container quarantine does not establish failure, maliciousness, semantic identity, source independence, evidence quality, hidden-entry content or factual truth.'
};
const gut=registry.organs?.gut;
if(!gut) failures.push({label:'gut-registry-missing'});
else {
  gut.actions.DIGEST='VERIFIED_HEURISTIC_METABOLIC_ROUTER_TYPED_FINITE_NONFINITE_BOOLEAN_NULLISH_BIGINT_SYMBOL_DATE_ERROR_MAP_SET_CYCLE_AND_OPAQUE_WEAK_CONTAINER_HANDLING_WITH_PATH_SCOPED_CONTAINER_PROVENANCE_AND_OUT_OF_BAND_REFERENTIAL_CARRY';
  gut.boundary=String(gut.boundary||'')
    .replace(/^GUT v0\.2\.34/, 'GUT v0.2.36')
    + ' Active-ancestor object cycles are explicitly quarantined as CIRCULAR_REFERENCE atoms with origin paths while non-cyclic shared aliases remain traversable before ordinary downstream deduplication. WeakMap and WeakSet containers are explicitly quarantined as path-scoped OPAQUE_CONTAINER atoms because JavaScript does not expose enumerable weak-container entries; hidden entries are neither fabricated nor inferred, and visible sibling material remains routable. These protections prevent silent structural loss but do not infer object ownership, hidden content, semantic identity, source independence, evidence quality, causality or truth.';
}
if(failures.length){console.error(JSON.stringify({status:'PROMOTION_ABORTED',failures},null,2));process.exit(1);}
await fs.writeFile(registryPath,JSON.stringify(registry,null,2)+'\n','utf8');
console.log(JSON.stringify({status:'PROMOTED',registry:registry.schema,thickening:registry.latestThickening.version,ciCompletedAt:ci.completedAt,focusedCompletedAt:focused.completedAt},null,2));
