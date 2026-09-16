// ZENOMORPH Stable registry evidence audit v0.2.0
// DISPLAYED STATE MUST FOLLOW EVIDENCE: historical incorporation is not retroactive proof of current qualification.
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const registry=require('./stable-structural-capabilities.json');
const attestations=require('./stable-requalification-attestations.json');

export const CURRENT_REQUIRED_EVIDENCE=[
  'isolated_generation','stress','provenance','cross_organ','regression','held_out',
  'usefulness_validated','cross_food_transfer','delayed_retest'
];

export function auditStableRegistry(input=registry,supplemental=attestations){
  const capabilities=Array.isArray(input?.capabilities)?input.capabilities:[];
  const supplementalRows=Array.isArray(supplemental?.attestations)?supplemental.attestations:[];
  const entries=capabilities.map(capability=>{
    const historical=capability?.evidence||{};
    const fresh=supplementalRows.filter(row=>row?.candidateId===capability?.id);
    const currentEvidence={...historical};
    const evidenceSources={};
    for(const key of CURRENT_REQUIRED_EVIDENCE){
      if(historical[key]===true) evidenceSources[key]='HISTORICAL_INCORPORATION_RECEIPT';
    }
    for(const row of fresh){
      for(const key of CURRENT_REQUIRED_EVIDENCE){
        if(row?.evidence?.[key]===true){
          currentEvidence[key]=true;
          evidenceSources[key]='POST_INCORPORATION_REQUALIFICATION_ATTESTATION';
        }
      }
    }
    const missing=CURRENT_REQUIRED_EVIDENCE.filter(key=>currentEvidence[key]!==true);
    return {
      id:capability?.id||null,
      authority:capability?.authority||null,
      incorporatedAt:capability?.incorporatedAt||null,
      currentGateSatisfied:missing.length===0,
      missingCurrentEvidence:missing,
      evidenceSources,
      historicalEvidenceUnmodified:true,
      interpretation:missing.length===0
        ? 'CURRENT_GATE_EVIDENCE_PRESENT; POST-INCORPORATION ATTESTATIONS ARE NOT HISTORICAL BACKFILL'
        : 'HISTORICAL_STABLE_ENTRY_NOT_SELF_PROVING_UNDER_CURRENT_GATE; DO NOT INVENT OR BACKFILL EVIDENCE'
    };
  });
  return {
    schema:'zenomorph-stable-registry-audit/v0.2.0',
    policy:'DISPLAYED STATE MUST FOLLOW EVIDENCE',
    currentRequiredEvidence:[...CURRENT_REQUIRED_EVIDENCE],
    stableRevision:Number(input?.revision||0),
    entryCount:entries.length,
    entries,
    allCurrentGateSatisfied:entries.every(entry=>entry.currentGateSatisfied)
  };
}

if(import.meta.url===`file://${process.argv[1]}`){
  console.log(JSON.stringify(auditStableRegistry(),null,2));
}
