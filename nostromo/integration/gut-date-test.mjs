import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';

const root=process.cwd();
const resultPath=path.join(root,'nostromo','integration','gut-date-last-result.json');
const failures=[];
const check=(ok,type,detail)=>{if(!ok)failures.push({type,detail});};
const code=await fs.readFile(path.join(root,'nostromo','gut','gut-engine.js'),'utf8');
vm.runInThisContext(code,{filename:'nostromo/gut/gut-engine.js'});

const source='NOSTROMO/gut-date-test';
const stamp='2026-09-06T12:34:56.000Z';
const input={
  temporal:{observedAt:new Date(stamp),invalidAt:new Date('not-a-date')},
  repeats:[new Date(stamp),new Date(stamp)],
  metric:{count:2},
  claim:'Claim: a readable runtime date must not become evidence or freshness merely because it can be rendered.'
};
const gut=globalThis.GutEngine.digest(input,{source});
const validPaths=['root.temporal.observedAt','root.repeats[0]','root.repeats[1]'];
const dateItems=gut.hold.filter(x=>x.type==='DATE_MATERIAL');
const invalidItems=gut.quarantine.filter(x=>x.type==='INVALID_DATE');

check(gut.version==='0.2.31','GUT_COMPAT_VERSION_CHANGED',gut.version);
check(dateItems.length===3,'DATE_MULTIPLICITY_LOST',dateItems);
check(validPaths.every(p=>dateItems.some(x=>x.path===p)),'DATE_PATH_PROVENANCE_LOST',dateItems);
check(dateItems.every(x=>x.text===stamp&&x.route==='HOLD'&&x.status==='HOLD'),'VALID_DATE_NOT_HELD',dateItems);
check(dateItems.every(x=>x.provenance?.inputSource===source),'DATE_INPUT_PROVENANCE_LOST',dateItems);
check(invalidItems.length===1&&invalidItems[0].path==='root.temporal.invalidAt','INVALID_DATE_DISAPPEARED',invalidItems);
check(invalidItems.every(x=>x.text==='Invalid Date'&&x.route==='HOLD'&&x.status==='QUARANTINE'),'INVALID_DATE_NOT_QUARANTINED',invalidItems);
check(!gut.routes?.MUTHER?.items?.some(x=>validPaths.includes(x.path)||x.path==='root.temporal.invalidAt'),'DATE_PROMOTED_TO_EVIDENCE',gut.routes?.MUTHER);
check(!gut.routes?.DROPLET?.items?.some(x=>validPaths.includes(x.path)||x.path==='root.temporal.invalidAt'),'DATE_PROMOTED_TO_CLAIM',gut.routes?.DROPLET);
check(gut.routes?.MUTHER?.items?.some(x=>x.path==='root.metric.count'&&x.type==='NUMERIC_EVIDENCE'),'FINITE_NUMERIC_EVIDENCE_REGRESSED',gut.routes?.MUTHER);
check(gut.routes?.DROPLET?.items?.some(x=>x.path==='root.claim'),'CLAIM_ROUTING_REGRESSED',gut.routes?.DROPLET);
check(typeof JSON.stringify(gut)==='string','DATE_BROKE_JSON_SERIALIZATION','digest result was not JSON serializable');

const result={
  schema:'nostromo-gut-date-test/v0.1',
  completedAt:new Date().toISOString(),
  status:failures.length?'FAIL':'PASS',
  capability:'PATH_SCOPED_TYPED_DATE_PRESERVATION_WITH_INVALID_DATE_QUARANTINE_WITHOUT_EVIDENCE_FRESHNESS_OR_CLAIM_PROMOTION',
  heldDates:dateItems.map(x=>({path:x.path,text:x.text,type:x.type,status:x.status,route:x.route,reason:x.reason,provenance:x.provenance})),
  quarantinedDates:invalidItems.map(x=>({path:x.path,text:x.text,type:x.type,status:x.status,route:x.route,reason:x.reason,provenance:x.provenance})),
  finiteMetricStillEvidence:gut.routes?.MUTHER?.items?.some(x=>x.path==='root.metric.count'&&x.type==='NUMERIC_EVIDENCE')||false,
  claimStillRoutedToDroplet:gut.routes?.DROPLET?.items?.some(x=>x.path==='root.claim')||false,
  jsonSerializable:true,
  failures,
  boundary:'JavaScript Date objects are retained before enumerable-object traversal. Valid Date values are rendered to ISO text only for audit and remain DATE_MATERIAL in HOLD. Invalid Date values are preserved as INVALID_DATE and quarantined. Neither representation establishes event time, source truth, freshness, temporal relevance, evidence, confidence or factual truth.'
};
await fs.writeFile(resultPath,JSON.stringify(result,null,2)+'\n','utf8');
console.log(JSON.stringify(result,null,2));
if(failures.length)process.exit(1);
