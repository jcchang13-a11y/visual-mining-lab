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

code=code.replaceAll('0.2.30','0.2.31');
replaceOnce(
  "if(value===undefined){out.push({path,value:undefined,scalarKind:'undefined',provenance});return out;}if(typeof value==='string'||typeof value==='number'||typeof value==='boolean'||typeof value==='bigint'||typeof value==='symbol'){out.push({path,value,provenance});return out;}",
  "if(value===undefined){out.push({path,value:undefined,scalarKind:'undefined',provenance});return out;}if(value instanceof Date){const ms=value.getTime(),dateValid=Number.isFinite(ms);out.push({path,value:dateValid?value.toISOString():'Invalid Date',scalarKind:'date',dateValid,provenance});return out;}if(typeof value==='string'||typeof value==='number'||typeof value==='boolean'||typeof value==='bigint'||typeof value==='symbol'){out.push({path,value,provenance});return out;}",
  'flatten-date-retention'
);
replaceOnce(
  "if(atom?.scalarKind==='undefined')return {type:'UNDEFINED_MATERIAL',status:'ABSORB',route:'HOLD',priority:1,reason:'typed-undefined-material'};if(typeof atom.value==='bigint')",
  "if(atom?.scalarKind==='undefined')return {type:'UNDEFINED_MATERIAL',status:'ABSORB',route:'HOLD',priority:1,reason:'typed-undefined-material'};if(atom?.scalarKind==='date')return atom.dateValid?{type:'DATE_MATERIAL',status:'HOLD',route:'HOLD',priority:1,reason:'typed-date-material'}:{type:'INVALID_DATE',status:'QUARANTINE',route:'HOLD',priority:5,reason:'typed-invalid-date'};if(typeof atom.value==='bigint')",
  'classify-date-before-semantic-routing'
);
replaceOnce(
  "if(atom?.scalarKind==='null'||atom?.scalarKind==='undefined')return `${atom.scalarKind}|${String(atom?.path||'').toLowerCase()}|${String(text).toLowerCase()}`;",
  "if(atom?.scalarKind==='null'||atom?.scalarKind==='undefined'||atom?.scalarKind==='date')return `${atom.scalarKind}|${String(atom?.path||'').toLowerCase()}|${String(text).toLowerCase()}`;",
  'dedupe-date-by-path'
);
replaceOnce(
  "Typed JavaScript Symbol primitives are preserved as path-scoped SYMBOL_MATERIAL in HOLD instead of silently disappearing during flattening; their rendered description is audit material only and does not prove symbol identity, global registry membership or semantic meaning.",
  "Typed JavaScript Symbol primitives are preserved as path-scoped SYMBOL_MATERIAL in HOLD instead of silently disappearing during flattening; their rendered description is audit material only and does not prove symbol identity, global registry membership or semantic meaning. JavaScript Date objects are preserved before generic object traversal: valid dates become path-scoped DATE_MATERIAL in HOLD using bounded ISO audit rendering, while invalid Date objects are quarantined as INVALID_DATE instead of disappearing because Date has no enumerable payload fields. Date rendering does not establish event time, freshness, provenance truth or temporal relevance.",
  'boundary-date-claim'
);

const oldVersionGate="check(['0.2.27','0.2.28','0.2.29','0.2.30'].includes(gut.version),'GUT_VERSION',gut.version);";
const newVersionGate="check(['0.2.27','0.2.28','0.2.29','0.2.30','0.2.31'].includes(gut.version),'GUT_VERSION',gut.version);";
const versionCount=metabolism.split(oldVersionGate).length-1;
if(versionCount===1) metabolism=metabolism.replace(oldVersionGate,newVersionGate);
else if(!metabolism.includes(newVersionGate)) failures.push({label:'metabolism-version-gate',expected:1,found:versionCount});

if(failures.length){
  console.error(JSON.stringify({status:'PATCH_ABORTED',failures},null,2));
  process.exit(1);
}
await fs.writeFile(enginePath,code,'utf8');
await fs.writeFile(metabolismTestPath,metabolism,'utf8');
console.log(JSON.stringify({status:'PATCHED',engine:'GUT v0.2.31',capability:'PATH_SCOPED_TYPED_DATE_PRESERVATION_WITH_INVALID_DATE_QUARANTINE',regressionGate:'0.2.27_THROUGH_0.2.31'},null,2));
