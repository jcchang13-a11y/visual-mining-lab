import fs from 'node:fs/promises';

const enginePath='nostromo/gut/gut-engine.js';
let code=await fs.readFile(enginePath,'utf8');
const replaceOne=(from,to,label)=>{
  const count=code.split(from).length-1;
  if(count!==1)throw new Error(`${label}: expected exactly one match, got ${count}`);
  code=code.replace(from,to);
};
replaceOne('/* NOSTROMO GUT v0.2.36+boolean+nonfinite+callable — deterministic auditable metabolic router */','/* NOSTROMO GUT v0.2.37+boolean+nonfinite+callable+regexp — deterministic auditable metabolic router */','header');
replaceOne("  if(value instanceof WeakSet){out.push({path,value:'WeakSet opaque container',scalarKind:'opaque-container',containerType:'WeakSet',provenance});return out;}\n  if(typeof value==='function')", "  if(value instanceof WeakSet){out.push({path,value:'WeakSet opaque container',scalarKind:'opaque-container',containerType:'WeakSet',provenance});return out;}\n  if(value instanceof RegExp){out.push({path,value:'RegExp opaque pattern',scalarKind:'regexp',provenance});return out;}\n  if(typeof value==='function')",'regexp flatten');
replaceOne("if(atom?.scalarKind==='callable')return {type:'OPAQUE_CALLABLE',status:'QUARANTINE',route:'HOLD',priority:5,reason:'callable-not-executed'};if(typeof atom.value==='bigint')", "if(atom?.scalarKind==='callable')return {type:'OPAQUE_CALLABLE',status:'QUARANTINE',route:'HOLD',priority:5,reason:'callable-not-executed'};if(atom?.scalarKind==='regexp')return {type:'OPAQUE_REGEXP',status:'QUARANTINE',route:'HOLD',priority:5,reason:'regexp-not-executed-or-inspected'};if(typeof atom.value==='bigint')",'regexp classify');
replaceOne("atom?.scalarKind==='opaque-container'||atom?.scalarKind==='callable')", "atom?.scalarKind==='opaque-container'||atom?.scalarKind==='callable'||atom?.scalarKind==='regexp')",'regexp dedupe');
replaceOne("return {organ:'GUT',version:'0.2.36'", "return {organ:'GUT',version:'0.2.37'",'version');
replaceOne("Callable presence does not establish action authorization, capability, safety, provenance truth, semantic meaning or factual truth. These rules are auditable heuristics, not semantic truth.", "Callable presence does not establish action authorization, capability, safety, provenance truth, semantic meaning or factual truth. JavaScript RegExp objects are preserved as path-scoped OPAQUE_REGEXP quarantine atoms before generic enumerable-object traversal, preventing silent disappearance of non-enumerable pattern objects. GUT does not execute the pattern, call exec/test, inspect pattern source or flags, or promote pattern presence into evidence, code intent, safety, provenance truth, semantic meaning or factual truth. These rules are auditable heuristics, not semantic truth.",'boundary');
await fs.writeFile(enginePath,code,'utf8');

const metabolismPath='nostromo/integration/gut-metabolism-test.mjs';
let metabolism=await fs.readFile(metabolismPath,'utf8');
const oldVersionCheck="check(['0.2.27','0.2.28','0.2.29','0.2.30','0.2.31','0.2.32','0.2.33','0.2.34','0.2.35','0.2.36'].includes(gut.version),'GUT_VERSION',gut.version);";
const newVersionCheck="check(['0.2.27','0.2.28','0.2.29','0.2.30','0.2.31','0.2.32','0.2.33','0.2.34','0.2.35','0.2.36','0.2.37'].includes(gut.version),'GUT_VERSION',gut.version);";
const versionCount=metabolism.split(oldVersionCheck).length-1;
if(versionCount!==1)throw new Error(`metabolism version gate: expected exactly one match, got ${versionCount}`);
metabolism=metabolism.replace(oldVersionCheck,newVersionCheck);
await fs.writeFile(metabolismPath,metabolism,'utf8');
console.log('Applied GUT v0.2.37 opaque RegExp containment and aligned the explicit version allow-list in its existing metabolism regression.');
