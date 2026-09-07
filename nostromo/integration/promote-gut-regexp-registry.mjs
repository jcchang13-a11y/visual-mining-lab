import fs from 'node:fs/promises';
const p='nostromo/integration/organ-registry.json';
const registry=JSON.parse(await fs.readFile(p,'utf8'));
registry.schema='nostromo-organ-registry/v1.88';
registry.updatedAt=new Date().toISOString();
if(!String(registry.evidence||'').includes('gut-regexp-last-result.json'))registry.evidence=String(registry.evidence||'').trim()+' plus gut-regexp-last-result.json';
registry.latestThickening={
  organ:'GUT',
  version:'GUT v0.2.37 opaque RegExp containment',
  status:'VERIFIED_OPAQUE_REGEXP_QUARANTINE_WITH_PATH_PROVENANCE_NO_EXECUTION_AND_NO_PATTERN_INSPECTION',
  test:'gut-regexp-last-result.json PASS + focused GUT metabolism/lineage regression + 50-round NOSTROMO integration PASS in dedicated GitHub Actions verification',
  capabilities:[
    'JavaScript RegExp objects no longer silently disappear because their core pattern state is non-enumerable',
    'RegExp intake is preserved as path-scoped OPAQUE_REGEXP quarantine with original intake provenance',
    'GUT does not execute RegExp material, call exec/test, inspect source/flags, or expose pattern text through this capability',
    'distinct RegExp objects at distinct structured paths remain separately auditable',
    'ordinary sibling claim/evidence routing remains intact under RegExp quarantine'
  ],
  boundary:'This is deterministic source-loss containment for RegExp-shaped JavaScript inputs. RegExp objects are treated as opaque quarantined audit material; their pattern source and flags are deliberately not inspected. This does not establish executable intent, authorization, safety, source identity, semantic meaning, evidence quality or factual truth.'
};
const gut=registry.organs?.gut;
if(!gut)throw new Error('registry gut entry missing');
if(!String(gut.actions?.DIGEST||'').includes('OPAQUE_REGEXP_QUARANTINE'))gut.actions.DIGEST=String(gut.actions?.DIGEST||'VERIFIED_HEURISTIC_METABOLIC_ROUTER')+'_OPAQUE_REGEXP_QUARANTINE';
if(!String(gut.boundary||'').includes('RegExp'))gut.boundary=String(gut.boundary||'')+' GUT v0.2.37 additionally preserves JavaScript RegExp objects as path-scoped OPAQUE_REGEXP quarantine atoms before generic enumerable-object traversal; it does not execute them or inspect pattern source/flags. RegExp presence is audit material only and is not evidence of intent, authorization, safety, identity, meaning or truth.';
await fs.writeFile(p,JSON.stringify(registry,null,2)+'\n','utf8');
console.log('Promoted registry to v1.88 after verified GUT RegExp containment.');
