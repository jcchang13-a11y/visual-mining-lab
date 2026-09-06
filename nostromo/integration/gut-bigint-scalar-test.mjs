import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';

const root=process.cwd();
const resultPath=path.join(root,'nostromo','integration','gut-bigint-scalar-last-result.json');
const failures=[];
const check=(ok,type,detail)=>{if(!ok)failures.push({type,detail});};
const code=await fs.readFile(path.join(root,'nostromo','gut','gut-engine.js'),'utf8');
vm.runInThisContext(code,{filename:'nostromo/gut/gut-engine.js'});

const source='NOSTROMO/gut-bigint-scalar-test';
const large=9007199254740993n;
const input={
  counters:{exact:large,total:7},
  samples:[1n,1n],
  textual:{bigint:'9007199254740993n'},
  claim:'Claim: integer-like machine primitives must not become evidence merely because they are numeric-like.'
};
const gut=globalThis.GutEngine.digest(input,{source});
const paths=['root.counters.exact','root.samples[0]','root.samples[1]'];
const heldBigInts=gut.hold.filter(x=>x.type==='BIGINT_MATERIAL');
check(gut.version==='0.2.29','GUT_COMPAT_VERSION_CHANGED',gut.version);
check(heldBigInts.length===3,'BIGINT_MULTIPLICITY_LOST',heldBigInts);
check(paths.every(p=>heldBigInts.some(x=>x.path===p)),'BIGINT_PATH_PROVENANCE_LOST',heldBigInts);
check(heldBigInts.every(x=>x.route==='HOLD'&&x.status==='ABSORB'),'BIGINT_NOT_HELD',heldBigInts);
check(heldBigInts.every(x=>x.provenance?.inputSource===source),'BIGINT_INPUT_PROVENANCE_LOST',heldBigInts);
check(gut.nutrients.filter(x=>x.type==='BIGINT_MATERIAL').length===3,'BIGINT_NOT_AUDITABLE_NUTRIENT',gut.nutrients);
check(!gut.routes?.MUTHER?.items?.some(x=>paths.includes(x.path)),'BIGINT_PROMOTED_TO_NUMERIC_EVIDENCE',gut.routes?.MUTHER);
check(gut.routes?.MUTHER?.items?.some(x=>x.path==='root.counters.total'&&x.type==='NUMERIC_EVIDENCE'),'FINITE_NUMERIC_EVIDENCE_REGRESSED',gut.routes?.MUTHER);
check(gut.routes?.DROPLET?.items?.some(x=>x.path==='root.claim'),'CLAIM_ROUTING_REGRESSED',gut.routes?.DROPLET);
check(gut.nutrients.some(x=>x.path==='root.textual.bigint'&&x.type!=='BIGINT_MATERIAL'),'TEXT_BIGINT_WRONGLY_TYPED',gut.nutrients);
check(heldBigInts.filter(x=>x.text==='1').length===2,'EQUAL_BIGINT_PATHS_COLLAPSED',heldBigInts);

const result={
  schema:'nostromo-gut-bigint-scalar-test/v0.1',
  completedAt:new Date().toISOString(),
  status:failures.length?'FAIL':'PASS',
  capability:'PATH_SCOPED_TYPED_BIGINT_PRESERVATION_WITHOUT_NUMERIC_EVIDENCE_PROMOTION',
  heldBigInts:heldBigInts.map(x=>({path:x.path,text:x.text,type:x.type,status:x.status,route:x.route,reason:x.reason,provenance:x.provenance})),
  finiteMetricStillEvidence:gut.routes?.MUTHER?.items?.some(x=>x.path==='root.counters.total'&&x.type==='NUMERIC_EVIDENCE')||false,
  claimStillRoutedToDroplet:gut.routes?.DROPLET?.items?.some(x=>x.path==='root.claim')||false,
  failures,
  boundary:'JavaScript BigInt primitives are retained as typed path-scoped BIGINT_MATERIAL in HOLD. Equal values at distinct structured paths retain distinct provenance. They remain auditable but cannot become numeric evidence, counts, confidence or truth merely because they are integer-like machine values. Literal text resembling BigInt syntax remains text.'
};
await fs.writeFile(resultPath,JSON.stringify(result,null,2)+'\n','utf8');
console.log(JSON.stringify(result,null,2));
if(failures.length)process.exit(1);
