// ZENOMORPH Stable registry evidence audit v0.3.0
// DISPLAYED STATE MUST FOLLOW EVIDENCE: evidence presence is not the same claim as fresh requalification.
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
    const freshlyRequalified=new Set();
    for(const key of CURRENT_REQUIRED_EVIDENCE){
      if(historical[key]===true) evidenceSources[key]='HISTORICAL_INCORPORATION_RECEIPT';
    }
    for(const row of fresh){
      for(const key of CURRENT_REQUIRED_EVIDENCE){
        if(row?.evidence?.[key]===true){
          currentEvidence[key]=true;
          evidenceSources[key]='POST_INCORPORATION_REQUALIFICATION_ATTESTATION';
          freshlyRequalified.add(key);
        }
      }
    }
    const missing=CURRENT_REQUIRED_EVIDENCE.filter(key=>currentEvidence[key]!==true);
    const missingFreshRequalification=CURRENT_REQUIRED_EVIDENCE.filter(key=>!freshlyRequalified.has(key));
    return {
      id:capability?.id||null,
      authority:capability?.authority||null,
      incorporatedAt:capability?.incorporatedAt||null,
      currentGateEvidencePresent:missing.length===0,
      missingCurrentEvidence:missing,
      fullyRequalifiedUnderCurrentGate:missingFreshRequalification.length===0,
      freshlyRequalifiedEvidence:[...freshlyRequalified],
      missingFreshRequalification,
      evidenceSources,
      historicalEvidenceUnmodified:true,
      interpretation:missing.length>0
        ? 'CURRENT_GATE_EVIDENCE_INCOMPLETE; DO NOT INVENT OR BACKFILL EVIDENCE'
        : missingFreshRequalification.length>0
          ? 'CURRENT_GATE_EVIDENCE_PRESENT; NOT ALL GATES HAVE FRESH POST-INCORPORATION REQUALIFICATION'
          : 'FULL FRESH POST-INCORPORATION REQUALIFICATION PRESENT; HISTORICAL RECEIPT REMAINS UNMODIFIED'
    };
  });
  return {
    schema:'zenomorph-stable-registry-audit/v0.3.0',
    policy:'DISPLAYED STATE MUST FOLLOW EVIDENCE',
    currentRequiredEvidence:[...CURRENT_REQUIRED_EVIDENCE],
    stableRevision:Number(input?.revision||0),
    entryCount:entries.length,
    entries,
    allCurrentGateEvidencePresent:entries.every(entry=>entry.currentGateEvidencePresent),
    allFullyRequalifiedUnderCurrentGate:entries.every(entry=>entry.fullyRequalifiedUnderCurrentGate)
  };
}

if(import.meta.url===`file://${process.argv[1]}`){
  console.log(JSON.stringify(auditStableRegistry(),null,2));
}
