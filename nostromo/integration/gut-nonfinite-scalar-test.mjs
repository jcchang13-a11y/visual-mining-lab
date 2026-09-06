import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';

const root=process.cwd();
const resultPath=path.join(root,'nostromo','integration','gut-nonfinite-scalar-last-result.json');
const failures=[];
const check=(ok,type,detail)=>{if(!ok)failures.push({type,detail});};
const code=await fs.readFile(path.join(root,'nostromo','gut','gut-engine.js'),'utf8');
vm.runInThisContext(code,{filename:'nostromo/gut/gut-engine.js'});

const source='NOSTROMO/gut-nonfinite-scalar-test';
const input={
  metrics:{score:NaN,rate:Infinity,count:-Infinity,value:4},
  samples:[NaN,Infinity,-Infinity],
  textual:{nan:'NaN',infinity:'Infinity'},
  claim:'Claim: non-finite machine numerics must never become evidence merely because they are numeric.'
};
const gut=globalThis.GutEngine.digest(input,{source});
const paths=['root.metrics.score','root.metrics.rate','root.metrics.count','root.samples[0]','root.samples[1]','root.samples[2]'];
const quarantined=gut.quarantine.filter(x=>x.type==='NONFINITE_NUMERIC');
check(gut.version==='0.2.28','GUT_COMPAT_VERSION_CHANGED',gut.version);
check(quarantined.length===6,'NONFINITE_MULTIPLICITY_LOST',quarantined);
check(paths.every(p=>quarantined.some(x=>x.path===p)),'NONFINITE_PATH_PROVENANCE_LOST',quarantined);
check(quarantined.every(x=>x.route==='HOLD'&&x.status==='QUARANTINE'),'NONFINITE_NOT_QUARANTINED',quarantined);
check(quarantined.every(x=>x.provenance?.inputSource===source),'NONFINITE_INPUT_PROVENANCE_LOST',quarantined);
check(!gut.nutrients.some(x=>paths.includes(x.path)),'NONFINITE_PROMOTED_TO_NUTRIENT',gut.nutrients);
check(!gut.routes?.MUTHER?.items?.some(x=>paths.includes(x.path)),'NONFINITE_PROMOTED_TO_EVIDENCE',gut.routes?.MUTHER);
check(gut.routes?.MUTHER?.items?.some(x=>x.path==='root.metrics.value'&&x.type==='NUMERIC_EVIDENCE'),'FINITE_NUMERIC_EVIDENCE_REGRESSED',gut.routes?.MUTHER);
check(gut.routes?.DROPLET?.items?.some(x=>x.path==='root.claim'),'CLAIM_ROUTING_REGRESSED',gut.routes?.DROPLET);
check(gut.nutrients.some(x=>x.path==='root.textual.nan'),'TEXT_NAN_WRONGLY_TYPED',gut.nutrients);
check(gut.nutrients.some(x=>x.path==='root.textual.infinity'),'TEXT_INFINITY_WRONGLY_TYPED',gut.nutrients);

const result={
  schema:'nostromo-gut-nonfinite-scalar-test/v0.1',
  completedAt:new Date().toISOString(),
  status:failures.length?'FAIL':'PASS',
  capability:'PATH_SCOPED_TYPED_NONFINITE_NUMERIC_QUARANTINE_WITHOUT_EVIDENCE_PROMOTION',
  quarantined:quarantined.map(x=>({path:x.path,text:x.text,type:x.type,status:x.status,route:x.route,reason:x.reason,provenance:x.provenance})),
  finiteMetricStillEvidence:gut.routes?.MUTHER?.items?.some(x=>x.path==='root.metrics.value'&&x.type==='NUMERIC_EVIDENCE')||false,
  claimStillRoutedToDroplet:gut.routes?.DROPLET?.items?.some(x=>x.path==='root.claim')||false,
  failures,
  boundary:'JavaScript NaN, Infinity and -Infinity are retained as typed path-scoped NONFINITE_NUMERIC quarantine material. They remain auditable but cannot become evidence, counts, scores, confidence, truth or downstream claims merely because typeof value is number. Literal text NaN/Infinity remains ordinary textual material.'
};
await fs.writeFile(resultPath,JSON.stringify(result,null,2)+'\n','utf8');
console.log(JSON.stringify(result,null,2));
if(failures.length)process.exit(1);
