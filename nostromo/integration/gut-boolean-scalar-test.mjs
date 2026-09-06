// Focused unit/adversarial verification for typed boolean multiplicity in GUT.
import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';

const root=process.cwd();
const resultPath=path.join(root,'nostromo','integration','gut-boolean-scalar-last-result.json');
const failures=[];
const check=(ok,type,detail)=>{if(!ok)failures.push({type,detail});};
const code=await fs.readFile(path.join(root,'nostromo','gut','gut-engine.js'),'utf8');
vm.runInThisContext(code,{filename:'nostromo/gut/gut-engine.js'});

const source='NOSTROMO/gut-boolean-scalar-test';
const input={
  audit:{verified:true,fresh:true,complete:false,independent:false},
  semantic:{claim:'Claim: two true flags do not constitute two independent pieces of evidence.'},
  duplicateA:'same textual duplicate',
  duplicateB:'same textual duplicate'
};
const gut=globalThis.GutEngine.digest(input,{source});
const booleanPaths=['root.audit.verified','root.audit.fresh','root.audit.complete','root.audit.independent'];
const booleanItems=gut.nutrients.filter(x=>x.type==='BOOLEAN_MATERIAL');

check(gut.version==='0.2.27','GUT_COMPAT_VERSION_CHANGED',gut.version);
check(booleanItems.length===4,'BOOLEAN_MULTIPLICITY_LOST',booleanItems);
check(booleanPaths.every(p=>booleanItems.some(x=>x.path===p)),'BOOLEAN_PATH_PROVENANCE_LOST',booleanItems);
check(booleanItems.every(x=>x.route==='HOLD'&&x.status==='ABSORB'),'BOOLEAN_FALSELY_PROMOTED',booleanItems);
check(booleanItems.every(x=>x.provenance?.inputSource===source),'BOOLEAN_INPUT_PROVENANCE_LOST',booleanItems);
check(!gut.waste.some(x=>booleanPaths.includes(x.path)),'BOOLEAN_FALSE_DUPLICATE_EXCRETED',gut.waste);
check(gut.waste.some(x=>x.path==='root.duplicateB'&&x.type==='DUPLICATE'),'TEXT_DUPLICATE_GUARD_REGRESSED',gut.waste);
check(gut.routes?.DROPLET?.items?.some(x=>x.path==='root.semantic.claim'),'CLAIM_ROUTING_REGRESSED',gut.routes?.DROPLET);
check(!gut.routes?.MUTHER?.items?.some(x=>booleanPaths.includes(x.path)),'BOOLEAN_FLAG_MISTAKEN_FOR_EVIDENCE',gut.routes?.MUTHER);

const result={
  schema:'nostromo-gut-boolean-scalar-test/v0.1',
  completedAt:new Date().toISOString(),
  status:failures.length?'FAIL':'PASS',
  capability:'PATH_SCOPED_TYPED_BOOLEAN_MULTIPLICITY_WITHOUT_EVIDENCE_PROMOTION',
  booleanPaths,
  booleanItems:booleanItems.map(x=>({path:x.path,text:x.text,type:x.type,status:x.status,route:x.route,reason:x.reason,provenance:x.provenance})),
  textualDuplicateStillExcreted:gut.waste.some(x=>x.path==='root.duplicateB'&&x.type==='DUPLICATE'),
  claimStillRoutedToDroplet:gut.routes?.DROPLET?.items?.some(x=>x.path==='root.semantic.claim')||false,
  failures,
  boundary:'Typed booleans are retained as path-scoped BOOLEAN_MATERIAL in HOLD so repeated true/false values at different structured locations do not collapse into one atom. Boolean flags are not evidence, confidence, source-independence proof, truth, or semantic interpretation. Ordinary textual duplicate suppression remains active.'
};
await fs.writeFile(resultPath,JSON.stringify(result,null,2)+'\n','utf8');
console.log(JSON.stringify(result,null,2));
if(failures.length)process.exit(1);
