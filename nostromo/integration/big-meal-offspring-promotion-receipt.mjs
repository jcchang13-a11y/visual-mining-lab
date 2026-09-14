// ZENOMORPH offspring promotion receipt v0.1.0
// Converts a fresh, complete qualification result into promotion authorization evidence only.
// This runner MUST NOT mutate Stable and MUST NOT incorporate the candidate.
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import {runOffspringQualification} from './big-meal-offspring-qualification-runner.mjs';

const sha=value=>crypto.createHash('sha256').update(typeof value==='string'?value:JSON.stringify(value)).digest('hex');

const REQUIRED_EVIDENCE=[
  'stress','provenance','cross_organ','regression','held_out',
  'usefulness_validated','cross_food_transfer','delayed_retest'
];

async function fileSha(path){
  const b=await fs.readFile(path);
  return sha(b);
}

export async function issueOffspringPromotionReceipt({outputPath=null}={}){
  const stablePaths=[
    'nostromo/runtime',
    'nostromo/gut',
    'nostromo/vajra',
    'nostromo/muther',
    'nostromo/droplet',
    'mycelium/state.json'
  ];

  // Snapshot only files that exist and are regular files; directories are represented by their
  // repository-visible path marker and are never modified by this runner.
  const stableBefore={};
  for(const p of stablePaths){
    try{
      const s=await fs.stat(p);
      stableBefore[p]=s.isFile()?await fileSha(p):'DIRECTORY_UNTOUCHED_BY_RECEIPT_RUNNER';
    }catch{ stableBefore[p]='ABSENT'; }
  }

  const qualification=await runOffspringQualification();
  const evidence=qualification?.promotion?.evidence||{};
  const missingEvidence=REQUIRED_EVIDENCE.filter(k=>evidence[k]!==true);
  const qualificationIdentity=qualification?.candidate?.id||null;
  const qualificationPassed=qualification?.qualificationPassed===true;
  const crossFoodExplicit=qualification?.crossFoodTransfer?.passed===true;
  const stableQualificationBoundary=qualification?.stableUnchanged===true;
  const qualificationHadNoAuthority=qualification?.promotion?.promotable===false && qualification?.promotion?.incorporated===false;

  const connectorQueue=JSON.parse(await fs.readFile('nostromo/integration/connector-queue.json','utf8'));
  const connectorAudit={
    schema:connectorQueue?.schema||null,
    pending:(connectorQueue?.requests||[]).filter(x=>!['EXECUTED','REJECTED','BLOCKED'].includes(x?.status)).map(x=>x?.id),
    requestCount:(connectorQueue?.requests||[]).length,
    boundary:'Promotion receipt does not execute connectors, expose private connector payloads, or grant connector authority.'
  };

  const promotable=Boolean(
    qualificationPassed &&
    crossFoodExplicit &&
    stableQualificationBoundary &&
    qualificationHadNoAuthority &&
    missingEvidence.length===0
  );

  const stableAfter={};
  for(const p of stablePaths){
    try{
      const s=await fs.stat(p);
      stableAfter[p]=s.isFile()?await fileSha(p):'DIRECTORY_UNTOUCHED_BY_RECEIPT_RUNNER';
    }catch{ stableAfter[p]='ABSENT'; }
  }
  const stableUnchanged=JSON.stringify(stableBefore)===JSON.stringify(stableAfter);
  if(!stableUnchanged) throw new Error('PROMOTION_RECEIPT_MUTATED_STABLE');

  const receiptCore={
    candidateId:qualificationIdentity,
    pressureScale:qualification?.candidate?.pressureScale,
    qualificationSchema:qualification?.schema,
    qualificationFingerprint:sha(qualification),
    evidence:Object.fromEntries(REQUIRED_EVIDENCE.map(k=>[k,evidence[k]===true])),
    crossFoodExplicit,
    stableQualificationBoundary,
    qualificationHadNoAuthority,
    missingEvidence,
    connectorAudit,
    stableUnchanged
  };

  const result={
    schema:'zenomorph-offspring-promotion-receipt/v0.1',
    observedAt:new Date().toISOString(),
    candidate:{id:qualificationIdentity,pressureScale:qualification?.candidate?.pressureScale},
    receiptFingerprint:sha(receiptCore),
    evidence:receiptCore.evidence,
    qualification:{passed:qualificationPassed,fingerprint:receiptCore.qualificationFingerprint,crossFoodExplicit,stableQualificationBoundary,qualificationHadNoAuthority},
    connectorAudit,
    stableUnchanged,
    promotion:{
      promotable:promotable&&stableUnchanged,
      incorporated:false,
      reason:promotable&&stableUnchanged
        ? 'FULL_PROMOTION_RECEIPT_ISSUED; SEPARATE_GUARDED_INCORPORATION_REQUIRED'
        : 'PROMOTION_RECEIPT_REFUSED; QUALIFICATION_OR_EVIDENCE_INCOMPLETE'
    },
    boundary:'PROMOTION AUTHORIZATION EVIDENCE ONLY. This runner has no Stable-write path and incorporation remains false.'
  };

  if(outputPath) await fs.writeFile(outputPath,JSON.stringify(result,null,2)+'\n','utf8');
  return result;
}

if(import.meta.url===`file://${process.argv[1]}`){
  const outputArg=process.argv.find(x=>x.startsWith('--output='));
  const result=await issueOffspringPromotionReceipt({outputPath:outputArg?outputArg.slice(9):null});
  console.log(JSON.stringify(result,null,2));
}
