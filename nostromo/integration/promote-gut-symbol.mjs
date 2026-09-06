import fs from 'node:fs/promises';

const registryPath='nostromo/integration/organ-registry.json';
const symbolPath='nostromo/integration/gut-symbol-last-result.json';
const ciPath='nostromo/integration/ci-last-result.json';
const indexPath='nostromo/index.html';

const registry=JSON.parse(await fs.readFile(registryPath,'utf8'));
const symbol=JSON.parse(await fs.readFile(symbolPath,'utf8'));
const ci=JSON.parse(await fs.readFile(ciPath,'utf8'));
let index=await fs.readFile(indexPath,'utf8');
const failures=[];
const check=(ok,type,detail)=>{if(!ok)failures.push({type,detail});};

check(symbol.status==='PASS','SYMBOL_TEST_NOT_PASS',symbol.status);
check(symbol.capability==='PATH_SCOPED_TYPED_SYMBOL_PRESERVATION_WITHOUT_EVIDENCE_OR_CLAIM_PROMOTION','SYMBOL_CAPABILITY_MISMATCH',symbol.capability);
check(Array.isArray(symbol.failures)&&symbol.failures.length===0,'SYMBOL_TEST_FAILURES',symbol.failures);
check(ci.status==='PASS','INTEGRATION_NOT_PASS',ci.status);
check(Array.isArray(ci.failures)&&ci.failures.length===0,'INTEGRATION_FAILURES',ci.failures);
check(Date.parse(ci.completedAt)>=Date.parse(symbol.completedAt),'CI_PREDATES_SYMBOL_TEST',{ci:ci.completedAt,symbol:symbol.completedAt});
check(registry?.organs?.gut?.mode==='EXEC_CONNECTED_THICKENED','GUT_MODE_UNEXPECTED',registry?.organs?.gut?.mode);

if(failures.length){
  console.error(JSON.stringify({status:'PROMOTION_ABORTED',failures},null,2));
  process.exit(1);
}

registry.schema='nostromo-organ-registry/v1.81';
registry.updatedAt=new Date().toISOString();
if(!registry.evidence.includes('gut-symbol-last-result.json')) registry.evidence += ' plus gut-symbol-last-result.json';
registry.latestThickening={
  organ:'GUT',
  version:'GUT v0.2.30 typed Symbol preservation',
  status:'VERIFIED_PATH_SCOPED_TYPED_SYMBOL_PRESERVATION',
  test:'gut-symbol-last-result.json PASS + post-change ci-last-result.json PASS',
  capabilities:[
    'JavaScript Symbol primitives are retained instead of silently disappearing during flattening',
    'Symbol atoms remain path-scoped SYMBOL_MATERIAL in HOLD and preserve input provenance',
    'repeated Symbol renderings at different structured paths remain separate auditable atoms',
    'Symbol descriptions cannot become evidence, claims, confidence or truth merely because String(Symbol(...)) is readable',
    'finite metric numerics still route to MUTHER and ordinary claims still route to DROPLET',
    'digest output remains JSON serializable because Symbol values are rendered as bounded audit text rather than emitted as raw Symbol primitives'
  ],
  boundary:'This is deterministic scalar-type preservation. String(Symbol(...)) is audit rendering only; it does not prove JavaScript Symbol identity, equality, global registry membership, semantic meaning, evidence, confidence or factual truth.'
};
registry.organs.gut.actions.DIGEST='VERIFIED_HEURISTIC_METABOLIC_ROUTER_TYPED_FINITE_NONFINITE_BOOLEAN_NULLISH_BIGINT_AND_SYMBOL_SCALAR_HANDLING_TERMINAL_MACHINE_CONTEXT_PATH_AND_ANCESTOR_QUARANTINE_OUT_OF_BAND_REFERENTIAL_CARRY_WITH_SCALAR_SCAFFOLD_CONTAINMENT';
registry.organs.gut.boundary=registry.organs.gut.boundary.replace('GUT v0.2.29','GUT v0.2.30');
const symbolBoundary=' Typed JavaScript Symbol primitives are preserved as path-scoped SYMBOL_MATERIAL in HOLD; repeated readable descriptions at different paths remain separately auditable, and their rendered descriptions do not establish symbol identity, registry membership, semantic meaning, evidence, confidence or truth.';
if(!registry.organs.gut.boundary.includes('SYMBOL_MATERIAL')) registry.organs.gut.boundary += symbolBoundary;

index=index.replace('THICKENED · v0.2.29','THICKENED · v0.2.30');
index=index.replace('BigInt 不再被 flatten 靜默遺失：typed BigInt 現在依 structured path 保留為 BIGINT_MATERIAL／HOLD，來源與重複位置各自可稽核，也不會因為像整數就被升格成 evidence、count 或 truth。既有 finite numeric、failure quarantine 與 carry anti-echo 行為維持。這仍是 deterministic structural routing，不是數值語意判斷。','Symbol 不再被 flatten 靜默遺失：typed JavaScript Symbol 現在依 structured path 保留為 SYMBOL_MATERIAL／HOLD，來源與重複位置各自可稽核；可讀的 Symbol(...) 描述只作 audit text，不會被升格成 evidence、claim、confidence 或 truth。既有 BigInt、finite numeric、failure quarantine 與 carry anti-echo 行為維持。');
index=index.replace('<span>GUT v0.2.29</span><span>修掉 BigInt source loss：JavaScript BigInt 原本不在 flatten 支援型別裡，會直接消失；現在保留為 path-scoped BIGINT_MATERIAL／HOLD。</span>','<span>GUT v0.2.30</span><span>修掉 Symbol source loss：JavaScript Symbol 原本會在 flatten 階段消失；現在保留為 path-scoped SYMBOL_MATERIAL／HOLD。</span>');
index=index.replace('<span>ADVERSARIAL</span><span>測試餵入超過 Number.MAX_SAFE_INTEGER 的正負 BigInt，以及兩個不同 array position 的相同 42n；四個 atoms 全部保留各自 path 與 provenance，沒有被合併或升格成 evidence。</span>','<span>ADVERSARIAL</span><span>測試同時餵入 global/local Symbol 與重複 Symbol；四個 Symbol atoms 全部保留各自 path 與 provenance，沒有被合併、送進 evidence route 或冒充 claim。</span>');
index=index.replace('<span>REGRESSION</span><span>finite metric numeric 仍正常送往 MUTHER，claim 仍正常送往 DROPLET；focused BigInt gate PASS，完整 NOSTROMO Integration Test run 467 PASS。</span>','<span>REGRESSION</span><span>finite metric numeric 仍正常送往 MUTHER，claim 仍正常送往 DROPLET；focused Symbol gate PASS，且其後完整 NOSTROMO integration CI PASS／failures=[]。</span>');
index=index.replace('<span>BOUNDARY</span><span>這次證明的是 typed BigInt preservation 與 source-loss containment；不是數值有效性、單位解讀、統計推論、事實裁決或來源獨立性證明。</span>','<span>BOUNDARY</span><span>這次證明的是 typed Symbol preservation 與 source-loss containment；Symbol(...) 的可讀字樣不代表 identity、global registry membership、語意、證據或真值。</span>');
index=index.replace('STATUS WINDOW v1.80','STATUS WINDOW v1.81');

await fs.writeFile(registryPath,JSON.stringify(registry,null,2)+'\n','utf8');
await fs.writeFile(indexPath,index,'utf8');
console.log(JSON.stringify({status:'PROMOTED',registry:registry.schema,latestThickening:registry.latestThickening.status,ciCompletedAt:ci.completedAt,symbolCompletedAt:symbol.completedAt},null,2));
