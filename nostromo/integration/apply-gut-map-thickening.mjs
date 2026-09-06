import fs from 'node:fs/promises';

const enginePath='nostromo/gut/gut-engine.js';
const metabolismTestPath='nostromo/integration/gut-metabolism-test.mjs';
let code=await fs.readFile(enginePath,'utf8');
let metabolism=await fs.readFile(metabolismTestPath,'utf8');
const failures=[];
const replaceOnce=(from,to,label)=>{
  const count=code.split(from).length-1;
  if(count!==1){failures.push({label,expected:1,found:count});return;}
  code=code.replace(from,to);
};

if(!code.includes("version:'0.2.32'")) failures.push({label:'expected-engine-version',expected:'0.2.32'});
code=code.replaceAll('0.2.32','0.2.33');
replaceOnce(
  "if(value instanceof Error){const errorName=String(value.name||'Error').replace(/\\s+/g,' ').trim().slice(0,120)||'Error';const errorMessage=String(value.message||'').replace(/\\s+/g,' ').trim().slice(0,480);out.push({path,value:errorMessage?`${errorName}: ${errorMessage}`:errorName,scalarKind:'error',errorName,provenance});return out;}if(typeof value==='string'||typeof value==='number'||typeof value==='boolean'||typeof value==='bigint'||typeof value==='symbol')",
  "if(value instanceof Error){const errorName=String(value.name||'Error').replace(/\\s+/g,' ').trim().slice(0,120)||'Error';const errorMessage=String(value.message||'').replace(/\\s+/g,' ').trim().slice(0,480);out.push({path,value:errorMessage?`${errorName}: ${errorMessage}`:errorName,scalarKind:'error',errorName,provenance});return out;}if(value instanceof Map){let i=0;for(const [mapKey,mapValue] of value.entries()){const mapProv={...provenance,containerKind:'map',mapEntry:String(i)};flatten(mapKey,out,`${path}{${i}}.key`,mapProv);flatten(mapValue,out,`${path}{${i}}.value`,mapProv);i++;}return out;}if(typeof value==='string'||typeof value==='number'||typeof value==='boolean'||typeof value==='bigint'||typeof value==='symbol')",
  'flatten-map-entry-retention'
);
replaceOnce(
  "function dedupeKey(atom,text){if(atom?.scalarKind==='null'||atom?.scalarKind==='undefined'||atom?.scalarKind==='date'||atom?.scalarKind==='error')",
  "function dedupeKey(atom,text){if(atom?.provenance?.containerKind==='map')return `map|${String(atom?.path||'').toLowerCase()}|${String(text).toLowerCase()}`;if(atom?.scalarKind==='null'||atom?.scalarKind==='undefined'||atom?.scalarKind==='date'||atom?.scalarKind==='error')",
  'dedupe-map-elements-by-path'
);
replaceOnce(
  "Error stack and cause are intentionally not promoted into semantic carry by this capability. Equal numeric, boolean or BigInt scalar values at distinct structured paths are kept as distinct auditable atoms instead of being collapsed by text-only duplicate detection, while ordinary textual duplicate suppression remains active.",
  "Error stack and cause are intentionally not promoted into semantic carry by this capability. JavaScript Map containers are expanded before generic enumerable-object traversal into bounded entry-index key/value paths with containerKind=map and mapEntry provenance, preventing Map payloads from silently disappearing because Map has no enumerable own data fields. Repeated equal Map key/value text at distinct entry paths remains separately auditable instead of being collapsed by global text-only deduplication. Map entry structure does not establish semantic key meaning, source independence, truth, evidence quality or ontology. Equal numeric, boolean or BigInt scalar values at distinct structured paths are kept as distinct auditable atoms instead of being collapsed by text-only duplicate detection, while ordinary textual duplicate suppression remains active.",
  'boundary-map-container-claim'
);

const oldVersionGate="check(['0.2.27','0.2.28','0.2.29','0.2.30','0.2.31','0.2.32'].includes(gut.version),'GUT_VERSION',gut.version);";
const newVersionGate="check(['0.2.27','0.2.28','0.2.29','0.2.30','0.2.31','0.2.32','0.2.33'].includes(gut.version),'GUT_VERSION',gut.version);";
const gateCount=metabolism.split(oldVersionGate).length-1;
if(gateCount===1) metabolism=metabolism.replace(oldVersionGate,newVersionGate);
else if(!metabolism.includes(newVersionGate)) failures.push({label:'metabolism-version-gate',expected:1,found:gateCount});

if(failures.length){
  console.error(JSON.stringify({status:'PATCH_ABORTED',failures},null,2));
  process.exit(1);
}
await fs.writeFile(enginePath,code,'utf8');
await fs.writeFile(metabolismTestPath,metabolism,'utf8');
console.log(JSON.stringify({status:'PATCHED',engine:'GUT v0.2.33',capability:'PATH_SCOPED_MAP_ENTRY_PRESERVATION_WITH_CONTAINER_PROVENANCE',regressionGate:'0.2.27_THROUGH_0.2.33'},null,2));
