import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';

const root=process.cwd();
const resultPath=path.join(root,'nostromo','integration','gut-bigint-last-result.json');
const failures=[];
const check=(ok,type,detail)=>{if(!ok)failures.push({type,detail});};
const code=await fs.readFile(path.join(root,'nostromo','gut','gut-engine.js'),'utf8');
vm.runInThisContext(code,{filename:'nostromo/gut/gut-engine.js'});

const source='NOSTROMO/gut-bigint-test';
const input={
  counters:{huge:9007199254740993n,negative:-9007199254740993n},
  replicas:[42n,42n],
  metric:{count:4},
  textual:{bigint:'9007199254740993n'},
  claim:'Claim: integer-like machine values must not become evidence merely because they are BigInt.'
};
const gut=globalThis.GutEngine.digest(input,{source});
const paths=['root.counters.huge','root.counters.negative','root.replicas[0]','root.replicas[1]'];
const bigintItems=gut.hold.filter(x=>x.type==='BIGINT_MATERIAL');

check(gut.version==='0.2.29','GUT_COMPAT_VERSION_CHANGED',gut.version);
check(bigintItems.length===4,'BIGINT_MULTIPLICITY_LOST',bigintItems);
check(paths.every(p=>bigintItems.some(x=>x.path===p)),'BIGINT_PATH_PROVENANCE_LOST',bigintItems);
check(bigintItems.every(x=>x.route==='HOLD'&&x.status==='HOLD'),'BIGINT_NOT_HELD',bigintItems);
check(bigintItems.every(x=>x.provenance?.inputSource===source),'BIGINT_INPUT_PROVENANCE_LOST',bigintItems);
check(!gut.routes?.MUTHER?.items?.some(x=>paths.includes(x.path)),'BIGINT_PROMOTED_TO_NUMERIC_EVIDENCE',gut.routes?.MUTHER);
check(gut.routes?.MUTHER?.items?.some(x=>x.path==='root.metric.count'&&x.type==='NUMERIC_EVIDENCE'),'FINITE_NUMERIC_EVIDENCE_REGRESSED',gut.routes?.MUTHER);
check(gut.routes?.DROPLET?.items?.some(x=>x.path==='root.claim'),'CLAIM_ROUTING_REGRESSED',gut.routes?.DROPLET);
check(gut.nutrients.some(x=>x.path==='root.textual.bigint'&&x.type!=='BIGINT_MATERIAL'),'TEXT_BIGINT_WRONGLY_TYPED',gut.nutrients);
check(typeof JSON.stringify(gut)==='string','BIGINT_BROKE_JSON_SERIALIZATION','digest result was not JSON serializable');

const result={
  schema:'nostromo-gut-bigint-test/v0.1',
  completedAt:new Date().toISOString(),
  status:failures.length?'FAIL':'PASS',
  capability:'PATH_SCOPED_TYPED_BIGINT_PRESERVATION_WITHOUT_NUMERIC_EVIDENCE_PROMOTION',
  heldBigInt:bigintItems.map(x=>({path:x.path,text:x.text,type:x.type,status:x.status,route:x.route,reason:x.reason,provenance:x.provenance})),
  finiteMetricStillEvidence:gut.routes?.MUTHER?.items?.some(x=>x.path==='root.metric.count'&&x.type==='NUMERIC_EVIDENCE')||false,
  claimStillRoutedToDroplet:gut.routes?.DROPLET?.items?.some(x=>x.path==='root.claim')||false,
  jsonSerializable:true,
  failures,
  boundary:'JavaScript BigInt primitives are retained as path-scoped BIGINT_MATERIAL in HOLD. They remain auditable but cannot become numeric evidence, counts, confidence, truth or downstream claims merely because they are integer-like machine values. Literal text ending in n remains ordinary textual material.'
};
await fs.writeFile(resultPath,JSON.stringify(result,null,2)+'\n','utf8');
console.log(JSON.stringify(result,null,2));
if(failures.length)process.exit(1);
