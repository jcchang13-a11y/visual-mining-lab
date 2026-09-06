import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';

const root=process.cwd();
const resultPath=path.join(root,'nostromo','integration','gut-symbol-last-result.json');
const failures=[];
const check=(ok,type,detail)=>{if(!ok)failures.push({type,detail});};
const code=await fs.readFile(path.join(root,'nostromo','gut','gut-engine.js'),'utf8');
vm.runInThisContext(code,{filename:'nostromo/gut/gut-engine.js'});

const source='NOSTROMO/gut-symbol-test';
const shared=Symbol.for('shared-audit-symbol');
const local=Symbol('local-audit-symbol');
const input={
  opaque:{shared,local},
  repeats:[shared,shared],
  metric:{count:2},
  claim:'Claim: opaque runtime tokens must not become evidence merely because they have a readable description.',
  textual:{symbol:'Symbol(shared-audit-symbol)'}
};
const gut=globalThis.GutEngine.digest(input,{source});
const symbolPaths=['root.opaque.shared','root.opaque.local','root.repeats[0]','root.repeats[1]'];
const symbolItems=gut.hold.filter(x=>x.type==='SYMBOL_MATERIAL');

check(gut.version==='0.2.30','GUT_COMPAT_VERSION_CHANGED',gut.version);
check(symbolItems.length===4,'SYMBOL_MULTIPLICITY_LOST',symbolItems);
check(symbolPaths.every(p=>symbolItems.some(x=>x.path===p)),'SYMBOL_PATH_PROVENANCE_LOST',symbolItems);
check(symbolItems.every(x=>x.route==='HOLD'&&x.status==='HOLD'),'SYMBOL_NOT_HELD',symbolItems);
check(symbolItems.every(x=>x.provenance?.inputSource===source),'SYMBOL_INPUT_PROVENANCE_LOST',symbolItems);
check(!gut.routes?.MUTHER?.items?.some(x=>symbolPaths.includes(x.path)),'SYMBOL_PROMOTED_TO_EVIDENCE',gut.routes?.MUTHER);
check(!gut.routes?.DROPLET?.items?.some(x=>symbolPaths.includes(x.path)),'SYMBOL_PROMOTED_TO_CLAIM',gut.routes?.DROPLET);
check(gut.routes?.MUTHER?.items?.some(x=>x.path==='root.metric.count'&&x.type==='NUMERIC_EVIDENCE'),'FINITE_NUMERIC_EVIDENCE_REGRESSED',gut.routes?.MUTHER);
check(gut.routes?.DROPLET?.items?.some(x=>x.path==='root.claim'),'CLAIM_ROUTING_REGRESSED',gut.routes?.DROPLET);
check(gut.nutrients.some(x=>x.path==='root.textual.symbol'&&x.type!=='SYMBOL_MATERIAL'),'TEXT_SYMBOL_WRONGLY_TYPED',gut.nutrients);
check(typeof JSON.stringify(gut)==='string','SYMBOL_BROKE_JSON_SERIALIZATION','digest result was not JSON serializable');
check(symbolItems.filter(x=>x.text==='Symbol(shared-audit-symbol)').length===3,'SYMBOL_RENDERING_NOT_AUDITABLE',symbolItems);

const result={
  schema:'nostromo-gut-symbol-test/v0.1',
  completedAt:new Date().toISOString(),
  status:failures.length?'FAIL':'PASS',
  capability:'PATH_SCOPED_TYPED_SYMBOL_PRESERVATION_WITHOUT_EVIDENCE_OR_CLAIM_PROMOTION',
  heldSymbols:symbolItems.map(x=>({path:x.path,text:x.text,type:x.type,status:x.status,route:x.route,reason:x.reason,provenance:x.provenance})),
  finiteMetricStillEvidence:gut.routes?.MUTHER?.items?.some(x=>x.path==='root.metric.count'&&x.type==='NUMERIC_EVIDENCE')||false,
  claimStillRoutedToDroplet:gut.routes?.DROPLET?.items?.some(x=>x.path==='root.claim')||false,
  jsonSerializable:true,
  failures,
  boundary:'JavaScript Symbol primitives are retained as path-scoped SYMBOL_MATERIAL in HOLD. Their String(Symbol(...)) rendering is audit text only: it does not establish symbol identity, equality across paths, global Symbol registry membership, semantic meaning, evidence, confidence or truth.'
};
await fs.writeFile(resultPath,JSON.stringify(result,null,2)+'\n','utf8');
console.log(JSON.stringify(result,null,2));
if(failures.length)process.exit(1);
