import fs from 'node:fs/promises';

const enginePath='nostromo/gut/gut-engine.js';
const metabolismTestPath='nostromo/integration/gut-metabolism-test.mjs';
let code=await fs.readFile(enginePath,'utf8');
let metabolism=await fs.readFile(metabolismTestPath,'utf8');
const failures=[];

if(code.includes("version:'0.2.34'")){
  console.log(JSON.stringify({status:'ALREADY_PATCHED',engine:'GUT v0.2.34',capability:'PATH_SCOPED_SET_MEMBER_PRESERVATION_WITH_CONTAINER_PROVENANCE'},null,2));
  process.exit(0);
}
if(!code.includes("version:'0.2.33'")) failures.push({label:'expected-engine-version',expected:'0.2.33'});

const replaceOnce=(from,to,label)=>{
  const count=code.split(from).length-1;
  if(count!==1){failures.push({label,expected:1,found:count});return;}
  code=code.replace(from,to);
};

code=code.replaceAll('0.2.33','0.2.34');
replaceOnce(
  "if(value instanceof Map){let i=0;for(const [mapKey,mapValue] of value.entries()){const mapProv={...provenance,containerKind:'map',mapEntry:String(i)};flatten(mapKey,out,`${path}{${i}}.key`,mapProv);flatten(mapValue,out,`${path}{${i}}.value`,mapProv);i++;}return out;}if(typeof value==='string'||typeof value==='number'||typeof value==='boolean'||typeof value==='bigint'||typeof value==='symbol')",
  "if(value instanceof Map){let i=0;for(const [mapKey,mapValue] of value.entries()){const mapProv={...provenance,containerKind:'map',mapEntry:String(i)};flatten(mapKey,out,`${path}{${i}}.key`,mapProv);flatten(mapValue,out,`${path}{${i}}.value`,mapProv);i++;}return out;}if(value instanceof Set){let i=0;for(const setValue of value.values()){const setProv={...provenance,containerKind:'set',setMember:String(i)};flatten(setValue,out,`${path}<${i}>`,setProv);i++;}return out;}if(typeof value==='string'||typeof value==='number'||typeof value==='boolean'||typeof value==='bigint'||typeof value==='symbol')",
  'flatten-set-member-retention'
);
replaceOnce(
  "function dedupeKey(atom,text){if(atom?.provenance?.containerKind==='map')return `map|${String(atom?.path||'').toLowerCase()}|${String(text).toLowerCase()}`;if(atom?.scalarKind==='null'||atom?.scalarKind==='undefined'||atom?.scalarKind==='date'||atom?.scalarKind==='error')",
  "function dedupeKey(atom,text){if(atom?.provenance?.containerKind==='map')return `map|${String(atom?.path||'').toLowerCase()}|${String(text).toLowerCase()}`;if(atom?.provenance?.containerKind==='set')return `set|${String(atom?.path||'').toLowerCase()}|${String(text).toLowerCase()}`;if(atom?.scalarKind==='null'||atom?.scalarKind==='undefined'||atom?.scalarKind==='date'||atom?.scalarKind==='error')",
  'dedupe-set-members-by-path'
);
replaceOnce(
  "JavaScript Map containers are expanded before generic object traversal into deterministic entry-index key/value paths with containerKind=map and mapEntry provenance; equal Map payload text at distinct entry paths remains separately auditable. This preserves structural multiplicity only and does not infer semantic key meaning, ontology, source independence, evidence quality, novelty or truth.",
  "JavaScript Map containers are expanded before generic object traversal into deterministic entry-index key/value paths with containerKind=map and mapEntry provenance; equal Map payload text at distinct entry paths remains separately auditable. JavaScript Set containers are likewise expanded before generic enumerable-object traversal into deterministic member-index paths with containerKind=set and setMember provenance, preventing Set payloads from silently disappearing because Set has no enumerable own data fields. Distinct Set members remain separately auditable by member path. Map/Set container preservation is structural only and does not infer semantic key/member meaning, ontology, source independence, evidence quality, novelty or truth.",
  'boundary-set-container-claim'
);

const oldVersionGate="check(['0.2.27','0.2.28','0.2.29','0.2.30','0.2.31','0.2.32','0.2.33'].includes(gut.version),'GUT_VERSION',gut.version);";
const newVersionGate="check(['0.2.27','0.2.28','0.2.29','0.2.30','0.2.31','0.2.32','0.2.33','0.2.34'].includes(gut.version),'GUT_VERSION',gut.version);";
const gateCount=metabolism.split(oldVersionGate).length-1;
if(gateCount===1) metabolism=metabolism.replace(oldVersionGate,newVersionGate);
else if(!metabolism.includes(newVersionGate)) failures.push({label:'metabolism-version-gate',expected:1,found:gateCount});

if(failures.length){
  console.error(JSON.stringify({status:'PATCH_ABORTED',failures},null,2));
  process.exit(1);
}
await fs.writeFile(enginePath,code,'utf8');
await fs.writeFile(metabolismTestPath,metabolism,'utf8');
console.log(JSON.stringify({status:'PATCHED',engine:'GUT v0.2.34',capability:'PATH_SCOPED_SET_MEMBER_PRESERVATION_WITH_CONTAINER_PROVENANCE',regressionGate:'0.2.27_THROUGH_0.2.34'},null,2));
