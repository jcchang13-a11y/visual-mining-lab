import fs from 'node:fs/promises';

const registryPath='nostromo/integration/organ-registry.json';
const statusPath='nostromo/index.html';
const receiptPath='nostromo/integration/gut-error-object-last-result.json';

const registry=JSON.parse(await fs.readFile(registryPath,'utf8'));
const receipt=JSON.parse(await fs.readFile(receiptPath,'utf8'));
if(receipt.status!=='PASS') throw new Error('GUT Error object receipt is not PASS');

registry.schema='nostromo-organ-registry/v1.83';
registry.updatedAt=new Date().toISOString();
if(!registry.evidence.includes('gut-error-object-last-result.json')) registry.evidence += ' plus gut-error-object-last-result.json';
registry.latestThickening={
  organ:'GUT',
  version:'GUT v0.2.32 typed Error object preservation',
  status:'VERIFIED_PATH_SCOPED_TYPED_ERROR_OBJECT_PRESERVATION_WITH_QUARANTINE',
  test:'gut-error-object-last-result.json PASS + NOSTROMO GUT Error Object Thickening run 2 success + promotion workflow focused/metabolism/full CI gates',
  capabilities:[
    'JavaScript Error objects are retained before generic enumerable-object traversal instead of silently disappearing because name/message are non-enumerable',
    'Error and TypeError objects remain separate path-scoped ERROR_OBJECT quarantine atoms with provenance',
    'bounded name/message audit text is preserved while stack and cause are intentionally not promoted into semantic carry',
    'Error diagnostic text cannot become evidence, claim, confidence, root-cause truth, severity or retry policy merely because it is readable',
    'ordinary prose mentioning error remains routable by its actual structured context instead of being globally quarantined',
    'finite metric numerics, ordinary claims and existing typed Date/scalar handling remain intact under regression'
  ],
  boundary:'This is deterministic typed-object preservation and quarantine. Error name/message text is diagnostic audit material only; it does not establish root cause, factual truth, severity, source identity, retry policy, evidence quality or semantic failure understanding.'
};
const gut=registry.organs?.gut;
if(!gut) throw new Error('registry.organs.gut missing');
if(!String(gut.actions?.DIGEST||'').includes('ERROR_OBJECT')) gut.actions.DIGEST=String(gut.actions.DIGEST||'VERIFIED_HEURISTIC_METABOLIC_ROUTER')+'_ERROR_OBJECT_QUARANTINE';
if(!gut.boundary.includes('JavaScript Error objects')) gut.boundary += ' JavaScript Error objects are preserved before generic enumerable-object traversal as path-scoped ERROR_OBJECT quarantine atoms using bounded name/message audit text; stack and cause are intentionally not promoted, and diagnostic text does not establish root cause, factual truth, severity, source identity or retry policy.';
await fs.writeFile(registryPath,JSON.stringify(registry,null,2)+'\n','utf8');

let html=await fs.readFile(statusPath,'utf8');
html=html.replace(/<div class="unit-top"><h2>GUT<\/h2><span class="status connected">[^<]*<\/span><\/div><div class="desc">.*?<\/div><\/div><a class="unit unit-link" href="\.\/vajra\//s,
`<div class="unit-top"><h2>GUT</h2><span class="status connected">THICKENED · v0.2.32</span></div><div class="desc">JavaScript Error 物件不再因 name/message 為 non-enumerable 而在 flatten 階段消失：Error／TypeError 現在依 structured path 保留為 ERROR_OBJECT／QUARANTINE，stack 與 cause 不進 semantic carry。可讀的錯誤文字只作 diagnostic audit，不會升格成 evidence、claim、root cause 或 truth。</div></div><a class="unit unit-link" href="./vajra/`);
html=html.replace(/<section class="section"><div class="label">RECENT EVENTS<\/div>.*?<\/section><section class="section"><div class="label">UNSOLICITED ACTIONS<\/div>/s,
`<section class="section"><div class="label">RECENT EVENTS</div><div class="row"><span>GUT v0.2.32</span><span>修掉 Error object source loss：JavaScript Error／TypeError 原本可能因核心欄位 non-enumerable 而在 generic object flatten 中消失；現在保留為 path-scoped ERROR_OBJECT／QUARANTINE。</span></div><div class="row"><span>ADVERSARIAL</span><span>同時餵入 Error 與 TypeError、普通 claim、普通 evidence 與 finite metric；兩個 Error atoms 都保留各自 path／provenance，沒有被送進 claim 或 evidence route。</span></div><div class="row"><span>REGRESSION</span><span>ordinary claim 仍送往 DROPLET、ordinary evidence 與 finite metric 仍送往 MUTHER；focused Error gate、GUT metabolism 與完整 cross-organ CI gates 全部通過後才提升狀態。</span></div><div class="row"><span>BOUNDARY</span><span>這次證明的是 typed Error preservation 與 quarantine；錯誤訊息本身不證明 root cause、severity、source identity、retry policy、evidence quality 或 factual truth。</span></div></section><section class="section"><div class="label">UNSOLICITED ACTIONS</div>`);
html=html.replace(/STATUS WINDOW v1\.\d+/,'STATUS WINDOW v1.83');
await fs.writeFile(statusPath,html,'utf8');
console.log(JSON.stringify({status:'PROMOTED',registry:registry.schema,gut:'v0.2.32',receipt:receipt.status},null,2));
