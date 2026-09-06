import fs from 'node:fs/promises';

const registryPath='nostromo/integration/organ-registry.json';
const focusedPath='nostromo/integration/gut-bigint-last-result.json';
const ciPath='nostromo/integration/ci-last-result.json';
const indexPath='nostromo/index.html';

const registry=JSON.parse(await fs.readFile(registryPath,'utf8'));
const focused=JSON.parse(await fs.readFile(focusedPath,'utf8'));
const ci=JSON.parse(await fs.readFile(ciPath,'utf8'));
let html=await fs.readFile(indexPath,'utf8');

if(focused.status!=='PASS') throw new Error('Focused GUT BigInt gate is not PASS');
if(ci.status!=='PASS') throw new Error('Full NOSTROMO integration is not PASS');
if(new Date(ci.completedAt)<new Date(focused.completedAt)) throw new Error('Full integration evidence predates focused BigInt evidence');

registry.schema='nostromo-organ-registry/v1.80';
registry.updatedAt=new Date().toISOString();
if(!String(registry.evidence||'').includes('gut-bigint-last-result.json')) registry.evidence += ' plus gut-bigint-last-result.json';
registry.latestThickening={
  organ:'GUT',
  version:'GUT v0.2.29 typed BigInt preservation patch',
  status:'VERIFIED_PATH_SCOPED_TYPED_BIGINT_PRESERVATION',
  test:'gut-bigint-last-result.json PASS; NOSTROMO GUT BigInt Thickening run 1 success; NOSTROMO Integration Test run 467 success',
  capabilities:[
    'JavaScript BigInt primitives are retained instead of being silently dropped by flattening',
    'BigInt atoms remain path-scoped BIGINT_MATERIAL in HOLD and preserve input provenance',
    'equal BigInt values at different structured paths remain separate auditable atoms',
    'BigInt cannot become numeric evidence, counts, confidence or truth merely because it is integer-like',
    'finite metric numerics still route to MUTHER and ordinary claim routing remains intact',
    'digest output remains JSON serializable because retained scalar material is rendered as text in the audit item'
  ],
  boundary:'This is deterministic scalar-type preservation, not semantic numeric validation, unit interpretation, measurement judgment or factual truth. BigInt is held because integer-like machine substrate should not silently acquire evidentiary authority.'
};
const gut=registry.organs?.gut;
if(!gut) throw new Error('GUT registry entry missing');
gut.actions.DIGEST='VERIFIED_HEURISTIC_METABOLIC_ROUTER_TYPED_FINITE_NONFINITE_BOOLEAN_NULLISH_AND_BIGINT_SCALAR_HANDLING_TERMINAL_MACHINE_CONTEXT_PATH_AND_ANCESTOR_QUARANTINE_OUT_OF_BAND_REFERENTIAL_CARRY_WITH_SCALAR_SCAFFOLD_CONTAINMENT';
gut.boundary=String(gut.boundary).replace('GUT v0.2.28','GUT v0.2.29');
if(!gut.boundary.includes('BIGINT_MATERIAL')) gut.boundary += ' Typed BigInt primitives are preserved as path-scoped BIGINT_MATERIAL in HOLD; equal BigInt values at distinct paths retain separate provenance and cannot become numeric evidence, counts, confidence or truth merely by scalar type.';

const gutBlock=/(<h2>GUT<\/h2><span class="status connected">)[^<]+(<\/span><\/div><div class="desc">)[\s\S]*?(<\/div><\/div><a class="unit unit-link" href="\.\/vajra\/">)/;
if(!gutBlock.test(html)) throw new Error('GUT public status block not found');
html=html.replace(gutBlock,`$1THICKENED · v0.2.29$2BigInt 不再被 flatten 靜默遺失：typed BigInt 現在依 structured path 保留為 BIGINT_MATERIAL／HOLD，來源與重複位置各自可稽核，也不會因為像整數就被升格成 evidence、count 或 truth。既有 finite numeric、failure quarantine 與 carry anti-echo 行為維持。這仍是 deterministic structural routing，不是數值語意判斷。$3`);
const chamber=/(<h2>INTEGRATION CHAMBER<\/h2><span class="status connected">)[^<]+(<\/span><\/div><div class="desc">)[\s\S]*?(<\/div><div class="hint">OPEN INTEGRATION CHAMBER →<\/div>)/;
if(!chamber.test(html)) throw new Error('Integration public status block not found');
html=html.replace(chamber,`$1CI PASS · run 467$2NOSTROMO Integration Test run 467 PASS。GUT BigInt preservation focused gate、既有 GUT metabolism／failure／lineage guards、正式 R111→R113 chain、其餘器官 guards、50 輪 integration 與 10 輪 active closed loop 全部保持通過；connector queue 無 pending request。$3`);
const recent=/(<section class="section"><div class="label">RECENT EVENTS<\/div>)[\s\S]*?(<\/section><section class="section"><div class="label">UNSOLICITED ACTIONS<\/div>)/;
if(!recent.test(html)) throw new Error('Recent events public status block not found');
html=html.replace(recent,`$1<div class="row"><span>GUT v0.2.29</span><span>修掉 BigInt source loss：JavaScript BigInt 原本不在 flatten 支援型別裡，會直接消失；現在保留為 path-scoped BIGINT_MATERIAL／HOLD。</span></div><div class="row"><span>ADVERSARIAL</span><span>測試餵入超過 Number.MAX_SAFE_INTEGER 的正負 BigInt，以及兩個不同 array position 的相同 42n；四個 atoms 全部保留各自 path 與 provenance，沒有被合併或升格成 evidence。</span></div><div class="row"><span>REGRESSION</span><span>finite metric numeric 仍正常送往 MUTHER，claim 仍正常送往 DROPLET；focused BigInt gate PASS，完整 NOSTROMO Integration Test run 467 PASS。</span></div><div class="row"><span>BOUNDARY</span><span>這次證明的是 typed BigInt preservation 與 source-loss containment；不是數值有效性、單位解讀、統計推論、事實裁決或來源獨立性證明。</span></div>$2`);
html=html.replace(/STATUS WINDOW v1\.\d+/,'STATUS WINDOW v1.80');

await fs.writeFile(registryPath,JSON.stringify(registry,null,2)+'\n','utf8');
await fs.writeFile(indexPath,html,'utf8');
console.log(JSON.stringify({status:'PROMOTED',registry:registry.schema,gut:'v0.2.29',focused:focused.status,ci:ci.status,ciCompletedAt:ci.completedAt},null,2));
