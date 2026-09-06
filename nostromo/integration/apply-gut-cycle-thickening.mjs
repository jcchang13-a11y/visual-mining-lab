import fs from 'node:fs/promises';

const enginePath='nostromo/gut/gut-engine.js';
const metabolismTestPath='nostromo/integration/gut-metabolism-test.mjs';
let code=await fs.readFile(enginePath,'utf8');
let metabolism=await fs.readFile(metabolismTestPath,'utf8');
const failures=[];

if(code.includes("version:'0.2.35'")){
  console.log(JSON.stringify({status:'ALREADY_PATCHED',engine:'GUT v0.2.35',capability:'ACTIVE_ANCESTOR_CYCLE_QUARANTINE_WITH_ORIGIN_PATH'},null,2));
  process.exit(0);
}
if(!code.includes("version:'0.2.34'")) failures.push({label:'expected-engine-version',expected:'0.2.34'});

const start=code.indexOf('function flatten(');
const end=code.indexOf('function textOf',start);
if(start<0||end<0||end<=start) failures.push({label:'flatten-function-boundary',start,end});

const newFlatten=[
"function flatten(value,out,path,provenance,state){",
"  out=out||[];path=path||'root';provenance=provenance||{};state=state||{ancestors:new WeakMap()};",
"  if(value===null){out.push({path,value:null,scalarKind:'null',provenance});return out;}",
"  if(value===undefined){out.push({path,value:undefined,scalarKind:'undefined',provenance});return out;}",
"  if(value instanceof Date){const ms=value.getTime(),dateValid=Number.isFinite(ms);out.push({path,value:dateValid?value.toISOString():'Invalid Date',scalarKind:'date',dateValid,provenance});return out;}",
"  if(value instanceof Error){const errorName=String(value.name||'Error').replace(/\\s+/g,' ').trim().slice(0,120)||'Error';const errorMessage=String(value.message||'').replace(/\\s+/g,' ').trim().slice(0,480);out.push({path,value:errorMessage?(errorName+': '+errorMessage):errorName,scalarKind:'error',errorName,provenance});return out;}",
"  if(typeof value==='string'||typeof value==='number'||typeof value==='boolean'||typeof value==='bigint'||typeof value==='symbol'){out.push({path,value,provenance});return out;}",
"  if(value&&typeof value==='object'){",
"    const circularRef=state.ancestors.get(value);",
"    if(circularRef!==undefined){out.push({path,value:'Circular reference -> '+circularRef,scalarKind:'circular',circularRef,provenance});return out;}",
"    state.ancestors.set(value,path);",
"    try{",
"      if(value instanceof Map){let i=0;for(const [mapKey,mapValue] of value.entries()){const mapProv={...provenance,containerKind:'map',mapEntry:String(i)};flatten(mapKey,out,path+'{'+i+'}.key',mapProv,state);flatten(mapValue,out,path+'{'+i+'}.value',mapProv,state);i++;}return out;}",
"      if(value instanceof Set){let i=0;for(const setValue of value.values()){const setProv={...provenance,containerKind:'set',setMember:String(i)};flatten(setValue,out,path+'<'+i+'>',setProv,state);i++;}return out;}",
"      if(Array.isArray(value)){value.forEach((v,i)=>flatten(v,out,path+'['+i+']',provenance,state));return out;}",
"      const nextProv={...provenance};for(const k of ['source','executor','organ','action','status','url','sourceClass','fingerprint','sourceFingerprint','provenanceFingerprint'])if(value[k]!==undefined&&value[k]!==null)nextProv[k]=String(value[k]).slice(0,240);Object.keys(value).forEach(k=>flatten(value[k],out,path+'.'+k,nextProv,state));return out;",
"    }finally{state.ancestors.delete(value);}",
"  }",
"  return out;",
"}",
""
].join('\n');

if(!failures.length) code=code.slice(0,start)+newFlatten+code.slice(end);
code=code.replaceAll('0.2.34','0.2.35');

const classifyNeedle="if(atom?.scalarKind==='error')return {type:'ERROR_OBJECT',status:'QUARANTINE',route:'HOLD',priority:5,reason:'typed-error-object'};";
const classifyReplacement=classifyNeedle+"if(atom?.scalarKind==='circular')return {type:'CIRCULAR_REFERENCE',status:'QUARANTINE',route:'HOLD',priority:5,reason:'cyclic-object-reference'};";
const classifyCount=code.split(classifyNeedle).length-1;
if(classifyCount===1) code=code.replace(classifyNeedle,classifyReplacement); else failures.push({label:'classify-cycle-insertion',expected:1,found:classifyCount});

const dedupeNeedle="atom?.scalarKind==='date'||atom?.scalarKind==='error'";
const dedupeCount=code.split(dedupeNeedle).length-1;
if(dedupeCount===1) code=code.replace(dedupeNeedle,"atom?.scalarKind==='date'||atom?.scalarKind==='error'||atom?.scalarKind==='circular'"); else failures.push({label:'dedupe-cycle-path-scope',expected:1,found:dedupeCount});

const oldGate="check(['0.2.27','0.2.28','0.2.29','0.2.30','0.2.31','0.2.32','0.2.33','0.2.34'].includes(gut.version),'GUT_VERSION',gut.version);";
const newGate="check(['0.2.27','0.2.28','0.2.29','0.2.30','0.2.31','0.2.32','0.2.33','0.2.34','0.2.35'].includes(gut.version),'GUT_VERSION',gut.version);";
const gateCount=metabolism.split(oldGate).length-1;
if(gateCount===1) metabolism=metabolism.replace(oldGate,newGate); else if(!metabolism.includes(newGate)) failures.push({label:'metabolism-version-gate',expected:1,found:gateCount});

if(failures.length){console.error(JSON.stringify({status:'PATCH_ABORTED',failures},null,2));process.exit(1);}
await fs.writeFile(enginePath,code,'utf8');
await fs.writeFile(metabolismTestPath,metabolism,'utf8');
console.log(JSON.stringify({status:'PATCHED',engine:'GUT v0.2.35',capability:'ACTIVE_ANCESTOR_CYCLE_QUARANTINE_WITH_ORIGIN_PATH_AND_NONCYCLIC_ALIAS_PRESERVATION',regressionGate:'0.2.27_THROUGH_0.2.35',boundaryNote:'Detects only active-ancestor reference cycles; shared aliases outside the current recursion chain are traversed normally. Public status must wait for focused and full integration success.'},null,2));
