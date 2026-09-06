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

code=code.replaceAll('0.2.31','0.2.32');
replaceOnce(
  "if(value instanceof Date){const ms=value.getTime(),dateValid=Number.isFinite(ms);out.push({path,value:dateValid?value.toISOString():'Invalid Date',scalarKind:'date',dateValid,provenance});return out;}if(typeof value==='string'||typeof value==='number'||typeof value==='boolean'||typeof value==='bigint'||typeof value==='symbol')",
  "if(value instanceof Date){const ms=value.getTime(),dateValid=Number.isFinite(ms);out.push({path,value:dateValid?value.toISOString():'Invalid Date',scalarKind:'date',dateValid,provenance});return out;}if(value instanceof Error){const errorName=String(value.name||'Error').replace(/\\s+/g,' ').trim().slice(0,120)||'Error';const errorMessage=String(value.message||'').replace(/\\s+/g,' ').trim().slice(0,480);out.push({path,value:errorMessage?`${errorName}: ${errorMessage}`:errorName,scalarKind:'error',errorName,provenance});return out;}if(typeof value==='string'||typeof value==='number'||typeof value==='boolean'||typeof value==='bigint'||typeof value==='symbol')",
  'flatten-error-object-retention'
);
replaceOnce(
  "if(atom?.scalarKind==='date')return atom.dateValid?{type:'DATE_MATERIAL',status:'HOLD',route:'HOLD',priority:1,reason:'typed-date-material'}:{type:'INVALID_DATE',status:'QUARANTINE',route:'HOLD',priority:5,reason:'typed-invalid-date'};if(typeof atom.value==='bigint')",
  "if(atom?.scalarKind==='date')return atom.dateValid?{type:'DATE_MATERIAL',status:'HOLD',route:'HOLD',priority:1,reason:'typed-date-material'}:{type:'INVALID_DATE',status:'QUARANTINE',route:'HOLD',priority:5,reason:'typed-invalid-date'};if(atom?.scalarKind==='error')return {type:'ERROR_OBJECT',status:'QUARANTINE',route:'HOLD',priority:5,reason:'typed-error-object'};if(typeof atom.value==='bigint')",
  'classify-error-before-semantic-routing'
);
replaceOnce(
  "if(atom?.scalarKind==='null'||atom?.scalarKind==='undefined'||atom?.scalarKind==='date')return `${atom.scalarKind}|${String(atom?.path||'').toLowerCase()}|${String(text).toLowerCase()}`;",
  "if(atom?.scalarKind==='null'||atom?.scalarKind==='undefined'||atom?.scalarKind==='date'||atom?.scalarKind==='error')return `${atom.scalarKind}|${String(atom?.path||'').toLowerCase()}|${String(text).toLowerCase()}`;",
  'dedupe-error-by-path'
);
replaceOnce(
  "Date rendering does not establish event time, freshness, provenance truth or temporal relevance. Equal numeric, boolean or BigInt scalar values at distinct structured paths are kept as distinct auditable atoms instead of being collapsed by text-only duplicate detection, while ordinary textual duplicate suppression remains active.",
  "Date rendering does not establish event time, freshness, provenance truth or temporal relevance. JavaScript Error objects are preserved before generic enumerable-object traversal as path-scoped ERROR_OBJECT quarantine atoms using bounded name/message audit text, instead of disappearing because their core fields are non-enumerable. Error name/message text is diagnostic material only and does not establish root cause, truth, severity, source identity or retry policy. Error stack and cause are intentionally not promoted into semantic carry by this capability. Equal numeric, boolean or BigInt scalar values at distinct structured paths are kept as distinct auditable atoms instead of being collapsed by text-only duplicate detection, while ordinary textual duplicate suppression remains active.",
  'boundary-error-object-claim'
);

const oldVersionGate="check(['0.2.27','0.2.28','0.2.29','0.2.30','0.2.31'].includes(gut.version),'GUT_VERSION',gut.version);";
const newVersionGate="check(['0.2.27','0.2.28','0.2.29','0.2.30','0.2.31','0.2.32'].includes(gut.version),'GUT_VERSION',gut.version);";
const versionCount=metabolism.split(oldVersionGate).length-1;
if(versionCount===1) metabolism=metabolism.replace(oldVersionGate,newVersionGate);
else if(!metabolism.includes(newVersionGate)) failures.push({label:'metabolism-version-gate',expected:1,found:versionCount});

if(failures.length){
  console.error(JSON.stringify({status:'PATCH_ABORTED',failures},null,2));
  process.exit(1);
}
await fs.writeFile(enginePath,code,'utf8');
await fs.writeFile(metabolismTestPath,metabolism,'utf8');
console.log(JSON.stringify({status:'PATCHED',engine:'GUT v0.2.32',capability:'PATH_SCOPED_TYPED_ERROR_OBJECT_PRESERVATION_WITH_QUARANTINE',regressionGate:'0.2.27_THROUGH_0.2.32'},null,2));
