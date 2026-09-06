import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';

const root=process.cwd();
const resultPath=path.join(root,'nostromo','integration','gut-map-last-result.json');
const failures=[];
const check=(ok,type,detail)=>{if(!ok)failures.push({type,detail});};
const code=await fs.readFile(path.join(root,'nostromo','gut','gut-engine.js'),'utf8');
vm.runInThisContext(code,{filename:'nostromo/gut/gut-engine.js'});

const source='NOSTROMO/gut-map-test';
const repeated='Claim: repeated Map payload must remain separately auditable by entry path.';
const payload=new Map([
  ['alpha',repeated],
  ['beta',repeated],
  ['nested',{evidence:'Evidence: nested Map object material remains routable.',count:2}],
  ['failure',new TypeError('connector map entry failed before evidence handoff')]
]);
const gut=globalThis.GutEngine.digest({payload,ordinaryDuplicateA:'same ordinary duplicate',ordinaryDuplicateB:'same ordinary duplicate'},{source});
const mapItems=(gut.nutrients||[]).concat(gut.quarantine||[],gut.waste||[]).filter(x=>x.provenance?.containerKind==='map');
const repeatedValues=(gut.routes?.DROPLET?.items||[]).filter(x=>x.text===repeated);
const errorItem=(gut.quarantine||[]).find(x=>x.path==='root.payload{3}.value'&&x.type==='ERROR_OBJECT');

check(gut.version==='0.2.33','GUT_VERSION',gut.version);
check(mapItems.length>=8,'MAP_ENTRIES_DISAPPEARED',mapItems);
check(['0','1','2','3'].every(i=>mapItems.some(x=>x.provenance?.mapEntry===i)),'MAP_ENTRY_PROVENANCE_LOST',mapItems);
check(mapItems.every(x=>x.provenance?.inputSource===source),'MAP_INPUT_PROVENANCE_LOST',mapItems);
check(repeatedValues.length===2,'EQUAL_MAP_VALUES_COLLAPSED',repeatedValues);
check(repeatedValues.some(x=>x.path==='root.payload{0}.value')&&repeatedValues.some(x=>x.path==='root.payload{1}.value'),'MAP_VALUE_PATHS_LOST',repeatedValues);
check((gut.routes?.MUTHER?.items||[]).some(x=>x.path==='root.payload{2}.value.evidence'),'NESTED_MAP_EVIDENCE_NOT_ROUTED',gut.routes?.MUTHER);
check((gut.routes?.MUTHER?.items||[]).some(x=>x.path==='root.payload{2}.value.count'&&x.type==='NUMERIC_EVIDENCE'),'NESTED_MAP_NUMERIC_EVIDENCE_NOT_ROUTED',gut.routes?.MUTHER);
check(!!errorItem,'MAP_ERROR_OBJECT_DISAPPEARED',gut.quarantine);
check(errorItem?.provenance?.containerKind==='map'&&errorItem?.provenance?.mapEntry==='3','MAP_ERROR_PROVENANCE_LOST',errorItem);
check((gut.waste||[]).some(x=>x.path==='root.ordinaryDuplicateB'&&x.type==='DUPLICATE'),'ORDINARY_TEXT_DEDUPE_REGRESSED',gut.waste);
check(typeof JSON.stringify(gut)==='string','MAP_HANDLING_BROKE_JSON_SERIALIZATION','digest result was not JSON serializable');

const result={
  schema:'nostromo-gut-map-test/v0.1',
  completedAt:new Date().toISOString(),
  status:failures.length?'FAIL':'PASS',
  capability:'PATH_SCOPED_MAP_ENTRY_PRESERVATION_WITH_CONTAINER_PROVENANCE_AND_MAP_LOCAL_MULTIPLICITY',
  mapItemCount:mapItems.length,
  repeatedMapValueCount:repeatedValues.length,
  mapEntryIds:[...new Set(mapItems.map(x=>x.provenance?.mapEntry).filter(Boolean))],
  nestedEvidenceRouted:(gut.routes?.MUTHER?.items||[]).some(x=>x.path==='root.payload{2}.value.evidence'),
  nestedNumericEvidenceRouted:(gut.routes?.MUTHER?.items||[]).some(x=>x.path==='root.payload{2}.value.count'&&x.type==='NUMERIC_EVIDENCE'),
  mapErrorQuarantined:!!errorItem,
  ordinaryTextDedupePreserved:(gut.waste||[]).some(x=>x.path==='root.ordinaryDuplicateB'&&x.type==='DUPLICATE'),
  failures,
  boundary:'JavaScript Map containers are expanded before generic enumerable-object traversal into deterministic entry-index key/value paths. Each emitted atom retains inputSource plus containerKind=map and mapEntry provenance. Equal Map text at distinct entry paths remains separately auditable; this preserves multiplicity but does not infer semantic key meaning, source independence, truth, evidence quality, ontology or relationship semantics.'
};
await fs.writeFile(resultPath,JSON.stringify(result,null,2)+'\n','utf8');
console.log(JSON.stringify(result,null,2));
if(failures.length)process.exit(1);
