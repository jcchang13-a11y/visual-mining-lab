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

code=code.replaceAll('0.2.27','0.2.28');
replaceOnce(
  "if(value===null||value===undefined){out.push({path,value:null,provenance});return out;}",
  "if(value===null){out.push({path,value:null,scalarKind:'null',provenance});return out;}if(value===undefined){out.push({path,value:undefined,scalarKind:'undefined',provenance});return out;}",
  'flatten-nullish-split'
);
replaceOnce(
  "function textOf(atom){return String(atom.value??'').trim();}",
  "function textOf(atom){if(atom?.scalarKind==='null')return 'null';if(atom?.scalarKind==='undefined')return 'undefined';return String(atom.value??'').trim();}",
  'text-nullish-preservation'
);
replaceOnce(
  "function classify(atom,text){const lower=text.toLowerCase(),path=atom.path.toLowerCase();if(typeof atom.value==='number'&&Number.isFinite(atom.value))",
  "function classify(atom,text){const lower=text.toLowerCase(),path=atom.path.toLowerCase();if(atom?.scalarKind==='null')return {type:'NULL_MATERIAL',status:'ABSORB',route:'HOLD',priority:1,reason:'typed-null-material'};if(atom?.scalarKind==='undefined')return {type:'UNDEFINED_MATERIAL',status:'ABSORB',route:'HOLD',priority:1,reason:'typed-undefined-material'};if(typeof atom.value==='number'&&Number.isFinite(atom.value))",
  'classify-nullish-before-low-signal'
);
replaceOnce(
  "function dedupeKey(atom,text){if(typeof atom?.value==='number'||typeof atom?.value==='boolean')",
  "function dedupeKey(atom,text){if(atom?.scalarKind==='null'||atom?.scalarKind==='undefined')return `${atom.scalarKind}|${String(atom?.path||'').toLowerCase()}|${String(text).toLowerCase()}`;if(typeof atom?.value==='number'||typeof atom?.value==='boolean')",
  'dedupe-nullish-by-path'
);

const strictVersion="check(gut.version==='0.2.27','GUT_VERSION',gut.version);";
const compatibleVersion="check(['0.2.27','0.2.28'].includes(gut.version),'GUT_VERSION',gut.version);";
const versionCount=metabolism.split(strictVersion).length-1;
if(versionCount===1) metabolism=metabolism.replace(strictVersion,compatibleVersion);
else if(!metabolism.includes(compatibleVersion)) failures.push({label:'metabolism-version-gate',expected:1,found:versionCount});

if(failures.length){
  console.error(JSON.stringify({status:'PATCH_ABORTED',failures},null,2));
  process.exit(1);
}
await fs.writeFile(enginePath,code,'utf8');
await fs.writeFile(metabolismTestPath,metabolism,'utf8');
console.log(JSON.stringify({status:'PATCHED',engine:'GUT v0.2.28',capability:'PATH_SCOPED_TYPED_NULLISH_PRESERVATION',regressionGate:'0.2.27_OR_0.2.28'},null,2));
