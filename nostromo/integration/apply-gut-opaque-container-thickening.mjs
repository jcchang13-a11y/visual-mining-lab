import fs from 'node:fs/promises';

const enginePath='nostromo/gut/gut-engine.js';
const metabolismTestPath='nostromo/integration/gut-metabolism-test.mjs';
let code=await fs.readFile(enginePath,'utf8');
let metabolism=await fs.readFile(metabolismTestPath,'utf8');
const failures=[];

if(code.includes("version:'0.2.36'")){
  console.log(JSON.stringify({status:'ALREADY_PATCHED',engine:'GUT v0.2.36',capability:'OPAQUE_WEAK_CONTAINER_QUARANTINE_WITH_PATH_PROVENANCE'},null,2));
  process.exit(0);
}
if(!code.includes("version:'0.2.35'")) failures.push({label:'expected-engine-version',expected:'0.2.35'});

const replaceOnce=(from,to,label)=>{
  const count=code.split(from).length-1;
  if(count!==1){failures.push({label,expected:1,found:count});return;}
  code=code.replace(from,to);
};

replaceOnce(
  "  if(value instanceof Error){const errorName=String(value.name||'Error').replace(/\\s+/g,' ').trim().slice(0,120)||'Error';const errorMessage=String(value.message||'').replace(/\\s+/g,' ').trim().slice(0,480);out.push({path,value:errorMessage?(errorName+': '+errorMessage):errorName,scalarKind:'error',errorName,provenance});return out;}\n  if(typeof value==='string'||typeof value==='number'||typeof value==='boolean'||typeof value==='bigint'||typeof value==='symbol')",
  "  if(value instanceof Error){const errorName=String(value.name||'Error').replace(/\\s+/g,' ').trim().slice(0,120)||'Error';const errorMessage=String(value.message||'').replace(/\\s+/g,' ').trim().slice(0,480);out.push({path,value:errorMessage?(errorName+': '+errorMessage):errorName,scalarKind:'error',errorName,provenance});return out;}\n  if(value instanceof WeakMap){out.push({path,value:'WeakMap opaque container',scalarKind:'opaque-container',containerType:'WeakMap',provenance});return out;}\n  if(value instanceof WeakSet){out.push({path,value:'WeakSet opaque container',scalarKind:'opaque-container',containerType:'WeakSet',provenance});return out;}\n  if(typeof value==='string'||typeof value==='number'||typeof value==='boolean'||typeof value==='bigint'||typeof value==='symbol')",
  'flatten-weak-container-retention'
);

replaceOnce(
  "if(atom?.scalarKind==='circular')return {type:'CIRCULAR_REFERENCE',status:'QUARANTINE',route:'HOLD',priority:5,reason:'cyclic-object-reference'};",
  "if(atom?.scalarKind==='circular')return {type:'CIRCULAR_REFERENCE',status:'QUARANTINE',route:'HOLD',priority:5,reason:'cyclic-object-reference'};if(atom?.scalarKind==='opaque-container')return {type:'OPAQUE_CONTAINER',status:'QUARANTINE',route:'HOLD',priority:5,reason:'non-enumerable-weak-container'};",
  'classify-opaque-container'
);

replaceOnce(
  "atom?.scalarKind==='date'||atom?.scalarKind==='error'||atom?.scalarKind==='circular'",
  "atom?.scalarKind==='date'||atom?.scalarKind==='error'||atom?.scalarKind==='circular'||atom?.scalarKind==='opaque-container'",
  'dedupe-opaque-container-path-scope'
);

code=code.replaceAll('0.2.35','0.2.36');

const oldGate="check(['0.2.27','0.2.28','0.2.29','0.2.30','0.2.31','0.2.32','0.2.33','0.2.34','0.2.35'].includes(gut.version),'GUT_VERSION',gut.version);";
const newGate="check(['0.2.27','0.2.28','0.2.29','0.2.30','0.2.31','0.2.32','0.2.33','0.2.34','0.2.35','0.2.36'].includes(gut.version),'GUT_VERSION',gut.version);";
const gateCount=metabolism.split(oldGate).length-1;
if(gateCount===1) metabolism=metabolism.replace(oldGate,newGate); else if(!metabolism.includes(newGate)) failures.push({label:'metabolism-version-gate',expected:1,found:gateCount});

if(failures.length){console.error(JSON.stringify({status:'PATCH_ABORTED',failures},null,2));process.exit(1);}
await fs.writeFile(enginePath,code,'utf8');
await fs.writeFile(metabolismTestPath,metabolism,'utf8');
console.log(JSON.stringify({status:'PATCHED',engine:'GUT v0.2.36',capability:'OPAQUE_WEAK_CONTAINER_QUARANTINE_WITH_PATH_PROVENANCE',regressionGate:'0.2.27_THROUGH_0.2.36',boundaryNote:'WeakMap and WeakSet contents cannot be enumerated by JavaScript; GUT now emits an explicit quarantined audit atom instead of silently losing the container. This does not inspect hidden entries or infer failure, source quality, identity or truth.'},null,2));
