import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';

const root=process.cwd();
const code=await fs.readFile(path.join(root,'nostromo/gut/gut-engine.js'),'utf8');
vm.runInThisContext(code,{filename:'nostromo/gut/gut-engine.js'});

const failures=[];
const check=(ok,type,detail)=>{if(!ok)failures.push({type,detail});};
let executionCount=0;
function dangerousCallable(){executionCount++;return 'Claim: executed callable must never become material.';}
const anonymous=()=>{executionCount++;return 'Evidence: anonymous callable body must remain inaccessible.';};
const gut=globalThis.GutEngine.digest({
  named:dangerousCallable,
  nested:{anonymous},
  siblingClaim:'Claim: visible sibling material survives callable quarantine.',
  siblingEvidence:'Evidence: callable inputs are audit material, not instructions.'
},{source:'NOSTROMO/gut-callable-test'});

check(executionCount===0,'CALLABLE_EXECUTED',{executionCount});
check(gut.typeCounts?.OPAQUE_CALLABLE===2,'CALLABLES_NOT_PRESERVED',gut.typeCounts);
check(gut.quarantine?.filter(x=>x.type==='OPAQUE_CALLABLE').length===2,'CALLABLES_NOT_QUARANTINED',gut.quarantine);
check(gut.quarantine?.some(x=>x.path==='root.named'&&x.callableName==='dangerousCallable'),'NAMED_CALLABLE_PATH_OR_NAME_LOST',gut.quarantine);
check(gut.quarantine?.some(x=>x.path==='root.nested.anonymous'&&x.callableName==='anonymous'),'ANONYMOUS_CALLABLE_PATH_LOST',gut.quarantine);
check(gut.routes?.DROPLET?.items?.some(x=>x.path==='root.siblingClaim'),'VISIBLE_SIBLING_CLAIM_LOST',gut.routes?.DROPLET);
check(gut.routes?.MUTHER?.items?.some(x=>x.path==='root.siblingEvidence'),'VISIBLE_SIBLING_EVIDENCE_LOST',gut.routes?.MUTHER);
check(!JSON.stringify(gut).includes('executed callable must never become material'),'CALLABLE_RETURN_FABRICATED',gut);
check(!JSON.stringify(gut).includes('anonymous callable body must remain inaccessible'),'CALLABLE_BODY_LEAKED',gut);
check(gut.quarantine?.filter(x=>x.type==='OPAQUE_CALLABLE').every(x=>x.provenance?.inputSource==='NOSTROMO/gut-callable-test'),'CALLABLE_PROVENANCE_LOST',gut.quarantine);

const result={
  schema:'nostromo-gut-callable-test/v0.1',
  completedAt:new Date().toISOString(),
  status:failures.length?'FAIL':'PASS',
  capability:'OPAQUE_CALLABLE_QUARANTINE_WITH_PATH_PROVENANCE_AND_NO_EXECUTION',
  engineVersion:gut.version,
  cases:{callableCount:gut.typeCounts?.OPAQUE_CALLABLE||0,quarantined:gut.quarantined,executionCount},
  failures,
  boundary:'This test verifies that JavaScript function values no longer silently disappear from GUT intake. They are preserved as path-scoped opaque callable quarantine atoms, never invoked, and their source/closure/return value is not inspected or promoted. A callable name is audit metadata only and does not establish authorization, capability, safety, identity, evidence quality or truth.'
};
await fs.writeFile('nostromo/integration/gut-callable-last-result.json',JSON.stringify(result,null,2)+'\n','utf8');
console.log(JSON.stringify(result,null,2));
if(failures.length)process.exit(1);
