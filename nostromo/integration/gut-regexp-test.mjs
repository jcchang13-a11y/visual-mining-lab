import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';

const root=process.cwd();
const code=await fs.readFile(path.join(root,'nostromo/gut/gut-engine.js'),'utf8');
vm.runInThisContext(code,{filename:'nostromo/gut/gut-engine.js'});

const failures=[];
const check=(ok,type,detail)=>{if(!ok)failures.push({type,detail});};
let execCount=0,sourceGetterCount=0,flagsGetterCount=0;
class TrapRegExp extends RegExp{
  exec(){execCount++;throw new Error('GUT must never execute RegExp material');}
}
const patternA=new TrapRegExp('secret-claim-pattern','gi');
Object.defineProperty(patternA,'source',{configurable:true,get(){sourceGetterCount++;throw new Error('source getter must not be inspected');}});
Object.defineProperty(patternA,'flags',{configurable:true,get(){flagsGetterCount++;throw new Error('flags getter must not be inspected');}});
const patternB=/evidence-(foo|bar)+/m;
const gut=globalThis.GutEngine.digest({
  patternA,
  nested:{patternB},
  siblingClaim:'Claim: visible sibling material survives opaque RegExp quarantine.',
  siblingEvidence:'Evidence: RegExp objects are intake material, not executable instructions.'
},{source:'NOSTROMO/gut-regexp-test'});

check(execCount===0,'REGEXP_EXECUTED',{execCount});
check(sourceGetterCount===0,'REGEXP_SOURCE_INSPECTED',{sourceGetterCount});
check(flagsGetterCount===0,'REGEXP_FLAGS_INSPECTED',{flagsGetterCount});
check(gut.typeCounts?.OPAQUE_REGEXP===2,'REGEXPS_NOT_PRESERVED',gut.typeCounts);
check(gut.quarantine?.filter(x=>x.type==='OPAQUE_REGEXP').length===2,'REGEXPS_NOT_QUARANTINED',gut.quarantine);
check(gut.quarantine?.some(x=>x.path==='root.patternA'),'REGEXP_A_PATH_LOST',gut.quarantine);
check(gut.quarantine?.some(x=>x.path==='root.nested.patternB'),'REGEXP_B_PATH_LOST',gut.quarantine);
check(gut.routes?.DROPLET?.items?.some(x=>x.path==='root.siblingClaim'),'VISIBLE_SIBLING_CLAIM_LOST',gut.routes?.DROPLET);
check(gut.routes?.MUTHER?.items?.some(x=>x.path==='root.siblingEvidence'),'VISIBLE_SIBLING_EVIDENCE_LOST',gut.routes?.MUTHER);
const serialized=JSON.stringify(gut);
check(!serialized.includes('secret-claim-pattern'),'REGEXP_PATTERN_SOURCE_LEAKED',gut.quarantine);
check(!serialized.includes('evidence-(foo|bar)+'),'REGEXP_PATTERN_SOURCE_LEAKED',gut.quarantine);
check(gut.quarantine?.filter(x=>x.type==='OPAQUE_REGEXP').every(x=>x.provenance?.inputSource==='NOSTROMO/gut-regexp-test'),'REGEXP_PROVENANCE_LOST',gut.quarantine);

const result={
  schema:'nostromo-gut-regexp-test/v0.1',
  completedAt:new Date().toISOString(),
  status:failures.length?'FAIL':'PASS',
  capability:'OPAQUE_REGEXP_QUARANTINE_WITH_PATH_PROVENANCE_NO_EXECUTION_AND_NO_PATTERN_INSPECTION',
  engineVersion:gut.version,
  cases:{regexpCount:gut.typeCounts?.OPAQUE_REGEXP||0,quarantined:gut.quarantined,execCount,sourceGetterCount,flagsGetterCount},
  failures,
  boundary:'This test verifies that JavaScript RegExp objects no longer silently disappear from GUT intake. They are preserved as path-scoped opaque RegExp quarantine atoms. GUT does not call exec/test, inspect source or flags, or expose pattern text through this capability. Pattern presence is audit material only and does not establish executable intent, authorization, safety, source identity, evidence quality, semantic meaning or truth.'
};
await fs.writeFile('nostromo/integration/gut-regexp-last-result.json',JSON.stringify(result,null,2)+'\n','utf8');
console.log(JSON.stringify(result,null,2));
if(failures.length)process.exit(1);
