import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';

const root=process.cwd();
const resultPath=path.join(root,'nostromo','integration','gut-nullish-scalar-last-result.json');
const failures=[];
const check=(ok,type,detail)=>{if(!ok)failures.push({type,detail});};
const code=await fs.readFile(path.join(root,'nostromo','gut','gut-engine.js'),'utf8');
vm.runInThisContext(code,{filename:'nostromo/gut/gut-engine.js'});

const source='NOSTROMO/gut-nullish-scalar-test';
const input={
  state:{explicitNull:null,missingValue:undefined,secondNull:null,secondUndefined:undefined},
  textual:{nullWord:'null',undefinedWord:'undefined'},
  semantic:{claim:'Claim: a missing structured value must not be promoted into evidence or certainty.'},
  duplicateA:'same textual duplicate',
  duplicateB:'same textual duplicate'
};
const gut=globalThis.GutEngine.digest(input,{source});
const expected=[
  ['root.state.explicitNull','NULL_MATERIAL','null'],
  ['root.state.missingValue','UNDEFINED_MATERIAL','undefined'],
  ['root.state.secondNull','NULL_MATERIAL','null'],
  ['root.state.secondUndefined','UNDEFINED_MATERIAL','undefined']
];
const typed=gut.nutrients.filter(x=>x.type==='NULL_MATERIAL'||x.type==='UNDEFINED_MATERIAL');

check(gut.version==='0.2.28','GUT_COMPAT_VERSION_CHANGED',gut.version);
check(typed.length===4,'NULLISH_MULTIPLICITY_LOST',typed);
for(const [p,t,text] of expected){
  const item=typed.find(x=>x.path===p);
  check(!!item,'NULLISH_PATH_LOST',{path:p,typed});
  if(item){
    check(item.type===t,'NULLISH_KIND_CONFLATED',item);
    check(item.text===text,'NULLISH_TEXT_NOT_AUDITABLE',item);
    check(item.route==='HOLD'&&item.status==='ABSORB','NULLISH_FALSELY_PROMOTED',item);
    check(item.provenance?.inputSource===source,'NULLISH_INPUT_PROVENANCE_LOST',item);
  }
}
check(!gut.waste.some(x=>expected.some(([p])=>p===x.path)),'TYPED_NULLISH_FALSELY_EXCRETED',gut.waste);
check(gut.waste.some(x=>x.path==='root.textual.nullWord'&&x.type==='LOW_SIGNAL'),'TEXT_NULL_GUARD_REGRESSED',gut.waste);
check(gut.waste.some(x=>x.path==='root.textual.undefinedWord'&&x.type==='LOW_SIGNAL'),'TEXT_UNDEFINED_GUARD_REGRESSED',gut.waste);
check(gut.waste.some(x=>x.path==='root.duplicateB'&&x.type==='DUPLICATE'),'TEXT_DUPLICATE_GUARD_REGRESSED',gut.waste);
check(gut.routes?.DROPLET?.items?.some(x=>x.path==='root.semantic.claim'),'CLAIM_ROUTING_REGRESSED',gut.routes?.DROPLET);
check(!gut.routes?.MUTHER?.items?.some(x=>expected.some(([p])=>p===x.path)),'NULLISH_FLAG_MISTAKEN_FOR_EVIDENCE',gut.routes?.MUTHER);

const result={
  schema:'nostromo-gut-nullish-scalar-test/v0.1',
  completedAt:new Date().toISOString(),
  status:failures.length?'FAIL':'PASS',
  capability:'PATH_SCOPED_TYPED_NULL_AND_UNDEFINED_PRESERVATION_WITHOUT_SEMANTIC_PROMOTION',
  typedItems:typed.map(x=>({path:x.path,text:x.text,type:x.type,status:x.status,route:x.route,reason:x.reason,provenance:x.provenance})),
  textualNullStillLowSignal:gut.waste.some(x=>x.path==='root.textual.nullWord'&&x.type==='LOW_SIGNAL'),
  textualUndefinedStillLowSignal:gut.waste.some(x=>x.path==='root.textual.undefinedWord'&&x.type==='LOW_SIGNAL'),
  textualDuplicateStillExcreted:gut.waste.some(x=>x.path==='root.duplicateB'&&x.type==='DUPLICATE'),
  claimStillRoutedToDroplet:gut.routes?.DROPLET?.items?.some(x=>x.path==='root.semantic.claim')||false,
  failures,
  boundary:'Explicit structured null and JavaScript undefined are retained as distinct path-scoped substrate types in HOLD. This prevents silent null/undefined conflation and loss without treating either as evidence, truth, confidence, absence proof, or a semantic conclusion. Literal text "null" and "undefined" remain ordinary low-signal text under the existing policy.'
};
await fs.writeFile(resultPath,JSON.stringify(result,null,2)+'\n','utf8');
console.log(JSON.stringify(result,null,2));
if(failures.length)process.exit(1);
