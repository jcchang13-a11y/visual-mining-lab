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

code=code.replaceAll('0.2.29','0.2.30');
replaceOnce(
  "if(typeof value==='string'||typeof value==='number'||typeof value==='boolean'||typeof value==='bigint'){out.push({path,value,provenance});return out;}",
  "if(typeof value==='string'||typeof value==='number'||typeof value==='boolean'||typeof value==='bigint'||typeof value==='symbol'){out.push({path,value,provenance});return out;}",
  'flatten-symbol-retention'
);
replaceOnce(
  "if(typeof atom.value==='bigint')return {type:'BIGINT_MATERIAL',status:'HOLD',route:'HOLD',priority:1,reason:'typed-bigint-material'};if(typeof atom.value==='number'&&!Number.isFinite(atom.value))",
  "if(typeof atom.value==='bigint')return {type:'BIGINT_MATERIAL',status:'HOLD',route:'HOLD',priority:1,reason:'typed-bigint-material'};if(typeof atom.value==='symbol')return {type:'SYMBOL_MATERIAL',status:'HOLD',route:'HOLD',priority:1,reason:'typed-symbol-material'};if(typeof atom.value==='number'&&!Number.isFinite(atom.value))",
  'classify-symbol-before-semantic-routing'
);
replaceOnce(
  "if(typeof atom?.value==='number'||typeof atom?.value==='boolean'||typeof atom?.value==='bigint')return `${typeof atom.value}|${String(atom?.path||'').toLowerCase()}|${String(text).toLowerCase()}`;",
  "if(typeof atom?.value==='number'||typeof atom?.value==='boolean'||typeof atom?.value==='bigint'||typeof atom?.value==='symbol')return `${typeof atom.value}|${String(atom?.path||'').toLowerCase()}|${String(text).toLowerCase()}`;",
  'dedupe-symbol-by-path'
);
replaceOnce(
  "Typed BigInt primitives are preserved as path-scoped BIGINT_MATERIAL with status HOLD and route HOLD; they are not promoted to numeric evidence, counts, confidence or truth merely because they are integer-like machine values.",
  "Typed BigInt primitives are preserved as path-scoped BIGINT_MATERIAL with status HOLD and route HOLD; they are not promoted to numeric evidence, counts, confidence or truth merely because they are integer-like machine values. Typed JavaScript Symbol primitives are preserved as path-scoped SYMBOL_MATERIAL in HOLD instead of silently disappearing during flattening; their rendered description is audit material only and does not prove symbol identity, global registry membership or semantic meaning.",
  'boundary-symbol-claim'
);

const oldVersionGate="check(['0.2.27','0.2.28','0.2.29'].includes(gut.version),'GUT_VERSION',gut.version);";
const newVersionGate="check(['0.2.27','0.2.28','0.2.29','0.2.30'].includes(gut.version),'GUT_VERSION',gut.version);";
const versionCount=metabolism.split(oldVersionGate).length-1;
if(versionCount===1) metabolism=metabolism.replace(oldVersionGate,newVersionGate);
else if(!metabolism.includes(newVersionGate)) failures.push({label:'metabolism-version-gate',expected:1,found:versionCount});

if(failures.length){
  console.error(JSON.stringify({status:'PATCH_ABORTED',failures},null,2));
  process.exit(1);
}
await fs.writeFile(enginePath,code,'utf8');
await fs.writeFile(metabolismTestPath,metabolism,'utf8');
console.log(JSON.stringify({status:'PATCHED',engine:'GUT v0.2.30',capability:'PATH_SCOPED_TYPED_SYMBOL_PRESERVATION',regressionGate:'0.2.27_OR_0.2.28_OR_0.2.29_OR_0.2.30'},null,2));
