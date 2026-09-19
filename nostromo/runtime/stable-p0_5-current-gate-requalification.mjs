// ZENOMORPH Stable p0.5 current-gate requalification v0.1.0
// Generates fresh post-incorporation evidence for the remaining current gates.
// Historical Stable receipts are read-only; this runner has no incorporation authority.
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import {runOffspringQualification} from '../integration/big-meal-offspring-qualification-runner.mjs';

const REGISTRY='nostromo/runtime/stable-structural-capabilities.json';
const TARGET='meal-topology-pasquinelli-2026-machine-organism-language-6fea27273abb-ore-p0_5';
const GATES=['stress','provenance','cross_organ','regression','held_out','usefulness_validated','cross_food_transfer','delayed_retest'];
const sha256=x=>crypto.createHash('sha256').update(x).digest('hex');

export async function requalifyCurrentGates({outputPath=null}={}){
  const beforeText=await fs.readFile(REGISTRY,'utf8');
  const registry=JSON.parse(beforeText);
  const registered=registry.capabilities?.find(x=>x.id===TARGET);
  if(!registered||registered.authority!=='STABLE') throw new Error('TARGET_NOT_CANONICAL_STABLE');

  const qualification=await runOffspringQualification();
  const afterText=await fs.readFile(REGISTRY,'utf8');
  const evidence=Object.fromEntries(GATES.map(k=>[k,qualification?.promotion?.evidence?.[k]===true]));
  const checks={
    candidateIdentityMatches:qualification?.candidate?.id===TARGET,
    qualificationPassed:qualification?.qualificationPassed===true,
    qualificationStableUnchanged:qualification?.stableUnchanged===true,
    allEightFreshGatesPassed:GATES.every(k=>evidence[k]===true),
    canonicalStableByteUnchanged:beforeText===afterText,
    canonicalStableHashUnchanged:sha256(beforeText)===sha256(afterText)
  };
  const passed=Object.values(checks).every(Boolean);
  const receipt={
    schema:'zenomorph-stable-current-gate-requalification/v0.1',
    observedAt:new Date().toISOString(),
    candidateId:TARGET,
    status:passed?'CURRENT_GATES_REQUALIFIED':'CURRENT_GATES_REQUALIFICATION_FAILED',
    evidence:Object.fromEntries(GATES.map(k=>[k,passed&&evidence[k]])),
    checks,
    stableRegistry:{path:REGISTRY,beforeSha256:sha256(beforeText),afterSha256:sha256(afterText)},
    qualificationSchema:qualification?.schema||null,
    rule:'FRESH EXECUTION EVIDENCE ONLY. DO NOT REWRITE HISTORICAL INCORPORATION EVIDENCE OR GRANT STABLE AUTHORITY.'
  };
  if(outputPath) await fs.writeFile(outputPath,JSON.stringify(receipt,null,2)+'\n','utf8');
  if(!passed) throw Object.assign(new Error('CURRENT_GATES_REQUALIFICATION_FAILED'),{receipt});
  return receipt;
}
if(import.meta.url===`file://${process.argv[1]}`){
  const outputArg=process.argv.find(x=>x.startsWith('--output='));
  const receipt=await requalifyCurrentGates({outputPath:outputArg?outputArg.slice(9):null});
  console.log(JSON.stringify(receipt,null,2));
}
