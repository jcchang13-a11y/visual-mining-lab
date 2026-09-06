import fs from 'node:fs/promises';

const registryPath='nostromo/integration/organ-registry.json';
const statusPath='nostromo/index.html';
const receiptPath='nostromo/integration/gut-map-last-result.json';
const ciPath='nostromo/integration/ci-last-result.json';
const enginePath='nostromo/gut/gut-engine.js';

const [registryRaw,receiptRaw,ciRaw,engine]=await Promise.all([
  fs.readFile(registryPath,'utf8'),
  fs.readFile(receiptPath,'utf8'),
  fs.readFile(ciPath,'utf8'),
  fs.readFile(enginePath,'utf8')
]);
const registry=JSON.parse(registryRaw);
const receipt=JSON.parse(receiptRaw);
const ci=JSON.parse(ciRaw);

if(receipt.status!=='PASS') throw new Error('GUT Map receipt is not PASS');
if((receipt.failures||[]).length) throw new Error('GUT Map receipt contains failures');
if(ci.status!=='PASS'||(ci.failures||[]).length) throw new Error('Full NOSTROMO CI is not clean PASS');
if(new Date(ci.completedAt).getTime()<new Date(receipt.completedAt).getTime()) throw new Error('Full CI predates focused Map verification');
if(!engine.includes("version:'0.2.33'")) throw new Error('GUT engine is not v0.2.33');
if(!engine.includes("value instanceof Map")) throw new Error('Map preservation code not present');

registry.schema='nostromo-organ-registry/v1.84';
registry.updatedAt=new Date().toISOString();
if(!registry.evidence.includes('gut-map-last-result.json')) registry.evidence += ' plus gut-map-last-result.json';
registry.latestThickening={
  organ:'GUT',
  version:'GUT v0.2.33 Map container preservation',
  status:'VERIFIED_PATH_SCOPED_MAP_ENTRY_PRESERVATION_WITH_CONTAINER_PROVENANCE_AND_MAP_LOCAL_MULTIPLICITY',
  test:`gut-map-last-result.json PASS at ${receipt.completedAt} + full NOSTROMO Integration CI PASS at ${ci.completedAt}`,
  capabilities:[
    'JavaScript Map containers are expanded before generic enumerable-object traversal instead of silently disappearing because Map entries are not enumerable own object fields',
    'each Map entry is emitted through deterministic entry-index key/value paths and retains containerKind=map plus mapEntry provenance',
    'equal Map payload text at distinct entry paths remains separately auditable instead of being collapsed by global text-only deduplication',
    'nested evidence and finite numeric evidence inside Map values retain ordinary MUTHER routing',
    'Error objects nested in Map values retain ERROR_OBJECT quarantine behavior plus Map provenance',
    'ordinary non-Map textual duplicate suppression remains active, so Map multiplicity preservation does not disable existing pollution containment'
  ],
  boundary:'This is deterministic structural container preservation and path-scoped multiplicity. Map keys, entry order and repeated values do not establish semantic key meaning, relationship semantics, ontology, source independence, evidence quality, novelty or factual truth.'
};
const gut=registry.organs?.gut;
if(!gut) throw new Error('registry.organs.gut missing');
const priorAction=String(gut.actions?.DIGEST||'VERIFIED_HEURISTIC_METABOLIC_ROUTER');
if(!priorAction.includes('MAP_ENTRY')) gut.actions.DIGEST=priorAction+'_MAP_ENTRY_PROVENANCE';
const mapBoundary=' JavaScript Map containers are expanded before generic object traversal into deterministic entry-index key/value paths with containerKind=map and mapEntry provenance; equal Map payload text at distinct entry paths remains separately auditable. This preserves structural multiplicity only and does not infer semantic key meaning, ontology, source independence, evidence quality, novelty or truth.';
if(!String(gut.boundary||'').includes('JavaScript Map containers')) gut.boundary=String(gut.boundary||'')+mapBoundary;
gut.boundary=String(gut.boundary).replace(/GUT v0\.2\.31/g,'GUT v0.2.33').replace(/GUT v0\.2\.32/g,'GUT v0.2.33');
await fs.writeFile(registryPath,JSON.stringify(registry,null,2)+'\n','utf8');

let html=await fs.readFile(statusPath,'utf8');
html=html.replace(/<div class="unit-top"><h2>GUT<\/h2><span class="status connected">[^<]*<\/span><\/div><div class="desc">.*?<\/div><\/div><a class="unit unit-link" href="\.\/vajra\//s,
`<div class="unit-top"><h2>GUT</h2><span class="status connected">THICKENED · v0.2.33</span></div><div class="desc">Map 容器不再因 entries 非 enumerable own fields 而在 generic flatten 中消失：現在依 entry-index 保留 key／value path、containerKind=map 與 mapEntry provenance；不同 entry 的相同 payload 仍各自可追溯。這只證明結構與 multiplicity 保留，不推論 key 語意、ontology、來源獨立性或 truth。</div></div><a class="unit unit-link" href="./vajra/`);
html=html.replace(/<section class="section"><div class="label">RECENT EVENTS<\/div>.*?<\/section><section class="section"><div class="label">UNSOLICITED ACTIONS<\/div>/s,
`<section class="section"><div class="label">RECENT EVENTS</div><div class="row"><span>GUT v0.2.33</span><span>修掉 Map container source loss：Map entries 現在在 generic object traversal 前展開為 deterministic entry-index key／value paths，並保留 containerKind=map 與 mapEntry provenance。</span></div><div class="row"><span>ADVERSARIAL</span><span>同一 Map 中兩個不同 entry 使用完全相同 claim payload，兩份都保留各自 path；nested evidence／numeric evidence 仍送往 MUTHER，Map 內 Error 仍進 quarantine。</span></div><div class="row"><span>REGRESSION</span><span>普通非 Map text duplicate 仍照常被抑制；focused Map gate 與完整 NOSTROMO integration CI 均在 Map receipt 之後 PASS，才提升公開狀態。</span></div><div class="row"><span>BOUNDARY</span><span>Map multiplicity 只代表結構上有兩個 entry；不代表兩份獨立證據，也不推論 key 語意、relationship、ontology、evidence quality、novelty 或 factual truth。</span></div></section><section class="section"><div class="label">UNSOLICITED ACTIONS</div>`);
html=html.replace(/STATUS WINDOW v1\.\d+/,'STATUS WINDOW v1.84');
await fs.writeFile(statusPath,html,'utf8');

console.log(JSON.stringify({status:'PROMOTED',registry:registry.schema,gut:'v0.2.33',focusedReceipt:receipt.status,fullCi:ci.status},null,2));
