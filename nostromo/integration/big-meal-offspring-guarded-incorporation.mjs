// ZENOMORPH guarded offspring incorporation v0.1.0
// The only purpose of this runner is to materialize a freshly authorized, content-agnostic
// structural capability into the authoritative Stable registry. It never executes connectors.
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import {issueOffspringPromotionReceipt} from './big-meal-offspring-promotion-receipt.mjs';

const sha=value=>crypto.createHash('sha256').update(typeof value==='string'?value:JSON.stringify(value)).digest('hex');
const REGISTRY='nostromo/runtime/stable-structural-capabilities.json';
const REQUIRED=['stress','provenance','cross_organ','regression','held_out','usefulness_validated','cross_food_transfer','delayed_retest'];

export async function guardedIncorporation({apply=false,outputPath=null}={}){
  const promotion=await issueOffspringPromotionReceipt();
  if(promotion?.promotion?.promotable!==true||promotion?.promotion?.incorporated!==false) throw new Error('FRESH_PROMOTION_RECEIPT_REQUIRED');
  if(promotion?.stableUnchanged!==true||promotion?.qualification?.passed!==true||promotion?.qualification?.crossFoodExplicit!==true) throw new Error('PROMOTION_BOUNDARY_INCOMPLETE');
  if(REQUIRED.some(k=>promotion?.evidence?.[k]!==true)) throw new Error('PROMOTION_EVIDENCE_INCOMPLETE');
  if((promotion?.connectorAudit?.pending||[]).length!==0) throw new Error('UNRESOLVED_CONNECTOR_QUEUE_BLOCKS_INCORPORATION');
  const c=promotion?.candidate||{};
  if(!c.id||!c.kind||!c.sourceMealId||!c.sourceSha256||!c.parameters||!Number.isFinite(Number(c.parameters.pressureScale))) throw new Error('STRUCTURAL_CANDIDATE_IDENTITY_INCOMPLETE');
  const registry=JSON.parse(await fs.readFile(REGISTRY,'utf8'));
  if(registry?.schema!=='zenomorph-stable-structural-capabilities/v0.1'||!Array.isArray(registry.capabilities)) throw new Error('INVALID_STABLE_REGISTRY');
  const beforeFingerprint=sha(registry);
  const existing=registry.capabilities.find(x=>x.id===c.id);
  if(existing){
    const same=existing.promotionReceiptFingerprint===promotion.receiptFingerprint&&sha(existing.parameters)===sha(c.parameters);
    if(!same) throw new Error('STABLE_IDENTITY_CONFLICT');
    const result={schema:'zenomorph-guarded-incorporation-receipt/v0.1',status:'ALREADY_INCORPORATED_IDEMPOTENT',candidateId:c.id,promotionReceiptFingerprint:promotion.receiptFingerprint,stable:{revision:registry.revision,fingerprint:beforeFingerprint},incorporated:true,connectorPrivacy:'NO_CONNECTOR_EXECUTION_OR_PRIVATE_PAYLOAD_ACCESSED',boundary:'DISPLAYED STATE MAY CALL THIS INCORPORATED ONLY BECAUSE THE AUTHORITATIVE Stable REGISTRY ALREADY CONTAINS THE EXACT RECEIPT-BOUND STRUCTURE.'};
    if(outputPath) await fs.writeFile(outputPath,JSON.stringify(result,null,2)+'\n');return result;
  }
  const capability={id:c.id,kind:c.kind,parameters:structuredClone(c.parameters),sourceMealId:c.sourceMealId,sourceSha256:c.sourceSha256,promotionReceiptFingerprint:promotion.receiptFingerprint,qualificationFingerprint:promotion?.qualification?.fingerprint||null,evidence:Object.fromEntries(REQUIRED.map(k=>[k,true])),incorporatedAt:new Date().toISOString(),authority:'STABLE',boundary:'CONTENT_AGNOSTIC STRUCTURAL CAPABILITY ONLY; NO SOURCE TEXT, TOPIC, CLAIM, SUMMARY, SEMANTIC HINT, OR PRIVATE CONNECTOR PAYLOAD.'};
  const next={...registry,revision:Number(registry.revision||0)+1,capabilities:[...registry.capabilities,capability]};
  const afterFingerprint=sha(next);
  if(apply) await fs.writeFile(REGISTRY,JSON.stringify(next,null,2)+'\n','utf8');
  const result={schema:'zenomorph-guarded-incorporation-receipt/v0.1',status:apply?'INCORPORATION_STAGED_POSTCHECKS_REQUIRED':'DRY_RUN_AUTHORIZED',candidateId:c.id,candidateFingerprint:sha(c),promotionReceiptFingerprint:promotion.receiptFingerprint,evidence:promotion.evidence,connectorAudit:{pending:promotion.connectorAudit.pending,requestCount:promotion.connectorAudit.requestCount},stable:{beforeRevision:registry.revision,afterRevision:next.revision,beforeFingerprint,afterFingerprint},incorporated:Boolean(apply),postChecksRequired:['fresh-process-stable-load','qualification-regression','runtime-regression','registry-identity'],rollback:'Git commit occurs only after all post-checks; failed post-checks leave repository Stable unchanged.',boundary:'A staged registry write has no repository authority until post-checks pass and the exact registry plus receipt are committed.'};
  if(outputPath) await fs.writeFile(outputPath,JSON.stringify(result,null,2)+'\n','utf8');return result;
}

if(import.meta.url===`file://${process.argv[1]}`){const apply=process.argv.includes('--apply');const outputArg=process.argv.find(x=>x.startsWith('--output='));const result=await guardedIncorporation({apply,outputPath:outputArg?outputArg.slice(9):null});console.log(JSON.stringify(result,null,2));}
