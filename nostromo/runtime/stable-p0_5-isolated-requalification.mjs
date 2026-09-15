// ZENOMORPH Stable p0.5 isolated-generation requalification v0.1.1
// Produces NEW evidence by regenerating the historical offspring through the
// Growing/Shadow-only failure-ore path while proving canonical Stable is unchanged.
// It does not rewrite historical receipts or infer a missing gate from Stable status.
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import {runFailureOreOffspringRound} from '../integration/big-meal-failure-ore-offspring-runner.mjs';

const REGISTRY='nostromo/runtime/stable-structural-capabilities.json';
const TARGET='meal-topology-pasquinelli-2026-machine-organism-language-6fea27273abb-ore-p0_5';
const sha256=x=>crypto.createHash('sha256').update(x).digest('hex');

export async function requalifyIsolatedGeneration({outputPath=null}={}){
  const beforeText=await fs.readFile(REGISTRY,'utf8');
  const before=JSON.parse(beforeText);
  const registered=before.capabilities?.find(x=>x.id===TARGET);
  if(!registered) throw new Error('TARGET_NOT_IN_STABLE_REGISTRY');
  // Requalification is only legitimate while the historical registry still exposes
  // the missing gate. If somebody silently backfills it, fail rather than laundering history.
  if(registered.evidence?.isolated_generation===true) throw new Error('HISTORICAL_ISOLATION_EVIDENCE_ALREADY_PRESENT:REQUALIFICATION_NOT_NEEDED');

  const round=await runFailureOreOffspringRound();
  const generated=round.selected?.candidate;
  const afterText=await fs.readFile(REGISTRY,'utf8');

  const checks={
    historicalGapStillVisible:registered.evidence?.isolated_generation!==true,
    targetRegenerated:generated?.id===TARGET,
    growingShadowBoundary:String(generated?.boundary||'').includes('SHADOW/GROWING ONLY'),
    noStableAuthority:generated?.evidence?.incorporated===false,
    roundStableUnchanged:round.stableUnchanged===true,
    canonicalStableByteUnchanged:beforeText===afterText,
    canonicalStableHashUnchanged:sha256(beforeText)===sha256(afterText)
  };
  const passed=Object.values(checks).every(Boolean);
  const receipt={
    schema:'zenomorph-stable-isolated-generation-requalification/v0.1',
    observedAt:new Date().toISOString(),
    candidateId:TARGET,
    status:passed?'ISOLATED_GENERATION_REQUALIFIED':'ISOLATED_GENERATION_REQUALIFICATION_FAILED',
    evidence:{isolated_generation:passed},
    checks,
    stableRegistry:{path:REGISTRY,beforeSha256:sha256(beforeText),afterSha256:sha256(afterText)},
    sourceRound:{schema:round.schema,status:round.status,parentCandidateId:round.parentCandidateId,foodRoles:round.foodRoles},
    rule:'NEW EXECUTION EVIDENCE ONLY. DO NOT BACKDATE OR REWRITE HISTORICAL PROMOTION/INCORPORATION RECEIPTS.'
  };
  if(outputPath) await fs.writeFile(outputPath,JSON.stringify(receipt,null,2)+'\n','utf8');
  if(!passed) throw Object.assign(new Error('ISOLATED_GENERATION_REQUALIFICATION_FAILED'),{receipt});
  return receipt;
}

if(import.meta.url===`file://${process.argv[1]}`){
  const outputArg=process.argv.find(x=>x.startsWith('--output='));
  const receipt=await requalifyIsolatedGeneration({outputPath:outputArg?outputArg.slice(9):null});
  console.log(JSON.stringify(receipt,null,2));
}
