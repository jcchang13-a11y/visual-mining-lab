// DROPLET claim verification CI test v1.3
import fs from 'node:fs/promises';
import {verifyClaim} from './droplet-claim-verify-executor.mjs';

const outPath='nostromo/integration/droplet-claim-verify-last-result.json';
const claim='Magentic-One is a generalist multi-agent system published by Microsoft Research in November 2024.';
const failures=[];
const cases={};

try{
  cases.baseline=verifyClaim({
    claim,
    evidence:[
      {id:'E1',source:'Microsoft Research',sourceFamily:'Microsoft Research',sourceClass:'OFFICIAL',relation:'SUPPORTS',date:'2024-11-04',fingerprint:'05b19aff31a0265e'},
      {id:'E2',source:'Microsoft Research publication record',sourceFamily:'Microsoft Research',sourceClass:'OFFICIAL',relation:'SUPPORTS',date:'2024-11',fingerprint:'164fbdd09a7f060f'}
    ]
  });
  if(cases.baseline.status!=='EXECUTED') failures.push({case:'baseline',type:'NOT_EXECUTED'});
  if(cases.baseline.verdict!=='SUPPORTED') failures.push({case:'baseline',type:'UNEXPECTED_VERDICT',verdict:cases.baseline.verdict});
  if(cases.baseline.counts.authoritativeSupportFamilies!==1) failures.push({case:'baseline',type:'SOURCE_FAMILY_COUNT_DRIFT',count:cases.baseline.counts.authoritativeSupportFamilies});

  cases.duplicateReplay=verifyClaim({
    claim,
    evidence:[
      {id:'D1',source:'Official page',sourceFamily:'Publisher A',sourceClass:'OFFICIAL',relation:'SUPPORTS',fingerprint:'same-proof'},
      {id:'D2',source:'Copied official page',sourceFamily:'Publisher A',sourceClass:'OFFICIAL',relation:'SUPPORTS',fingerprint:'same-proof'},
      {id:'D3',source:'Copied official page again',sourceFamily:'Publisher A',sourceClass:'OFFICIAL',relation:'SUPPORTS',fingerprint:'same-proof'}
    ]
  });
  if(cases.duplicateReplay.verdict!=='SUPPORTED') failures.push({case:'duplicateReplay',type:'UNEXPECTED_VERDICT',verdict:cases.duplicateReplay.verdict});
  if(cases.duplicateReplay.counts.uniqueEvidence!==1||cases.duplicateReplay.counts.duplicatesSuppressed!==2) failures.push({case:'duplicateReplay',type:'REPLAY_NOT_SUPPRESSED',counts:cases.duplicateReplay.counts});
  if(cases.duplicateReplay.counts.authoritativeSupports!==1) failures.push({case:'duplicateReplay',type:'DUPLICATE_AMPLIFIED_SUPPORT',count:cases.duplicateReplay.counts.authoritativeSupports});

  cases.authoritativeConflict=verifyClaim({
    claim,
    evidence:[
      {id:'C1',source:'Official source A',sourceFamily:'Authority A',sourceClass:'OFFICIAL',relation:'SUPPORTS',fingerprint:'support-a'},
      {id:'C2',source:'Primary source B',sourceFamily:'Authority B',sourceClass:'PRIMARY',relation:'REFUTES',fingerprint:'refute-b'}
    ]
  });
  if(cases.authoritativeConflict.verdict!=='INDETERMINATE') failures.push({case:'authoritativeConflict',type:'FALSE_CERTAINTY',verdict:cases.authoritativeConflict.verdict});
  if(!cases.authoritativeConflict.conflicts.authoritativeConflict) failures.push({case:'authoritativeConflict',type:'CONFLICT_NOT_FLAGGED'});

  cases.fingerprintIntegrity=verifyClaim({
    claim,
    evidence:[
      {id:'I1',source:'Source X',sourceFamily:'Source X',sourceClass:'OFFICIAL',relation:'SUPPORTS',fingerprint:'same-payload'},
      {id:'I2',source:'Source X mirror',sourceFamily:'Source X',sourceClass:'OFFICIAL',relation:'REFUTES',fingerprint:'same-payload'}
    ]
  });
  if(cases.fingerprintIntegrity.verdict!=='INDETERMINATE') failures.push({case:'fingerprintIntegrity',type:'INTEGRITY_CONFLICT_FALSE_CERTAINTY',verdict:cases.fingerprintIntegrity.verdict});
  if(!cases.fingerprintIntegrity.conflicts.integrityConflict) failures.push({case:'fingerprintIntegrity',type:'INTEGRITY_CONFLICT_NOT_FLAGGED'});

  cases.lowAuthorityOnly=verifyClaim({
    claim,
    evidence:[{id:'L1',source:'Unclassified repost',sourceFamily:'Unknown repost',sourceClass:'SECONDARY',relation:'SUPPORTS',fingerprint:'secondary-only'}]
  });
  if(cases.lowAuthorityOnly.verdict!=='INDETERMINATE') failures.push({case:'lowAuthorityOnly',type:'LOW_AUTHORITY_UPGRADED_TO_TRUTH',verdict:cases.lowAuthorityOnly.verdict});

  const policy={asOf:'2026-09-02',maxAgeDays:180};
  cases.staleAuthority=verifyClaim({
    claim:'The service is currently available.',
    freshnessPolicy:policy,
    evidence:[{id:'S1',source:'Official status page snapshot',sourceFamily:'Official status',sourceClass:'OFFICIAL',relation:'SUPPORTS',date:'2024-11-04',fingerprint:'stale-official'}]
  });
  if(cases.staleAuthority.verdict!=='INDETERMINATE') failures.push({case:'staleAuthority',type:'STALE_EVIDENCE_CREATED_CERTAINTY',verdict:cases.staleAuthority.verdict});
  if(cases.staleAuthority.counts.staleEvidence!==1||cases.staleAuthority.counts.eligibleAuthoritativeSupports!==0) failures.push({case:'staleAuthority',type:'STALE_EVIDENCE_NOT_QUARANTINED',counts:cases.staleAuthority.counts});

  cases.freshAuthority=verifyClaim({
    claim:'The service is currently available.',
    freshnessPolicy:policy,
    evidence:[{id:'F1',source:'Official status page',sourceFamily:'Official status',sourceClass:'OFFICIAL',relation:'SUPPORTS',date:'2026-09-01',fingerprint:'fresh-official'}]
  });
  if(cases.freshAuthority.verdict!=='SUPPORTED') failures.push({case:'freshAuthority',type:'FRESH_EVIDENCE_BLOCKED',verdict:cases.freshAuthority.verdict});
  if(cases.freshAuthority.counts.eligibleAuthoritativeSupports!==1) failures.push({case:'freshAuthority',type:'FRESH_EVIDENCE_NOT_ELIGIBLE',counts:cases.freshAuthority.counts});

  cases.unknownDateAuthority=verifyClaim({
    claim:'The service is currently available.',
    freshnessPolicy:policy,
    evidence:[{id:'U1',source:'Official undated page',sourceFamily:'Official status',sourceClass:'OFFICIAL',relation:'SUPPORTS',fingerprint:'undated-official'}]
  });
  if(cases.unknownDateAuthority.verdict!=='INDETERMINATE') failures.push({case:'unknownDateAuthority',type:'UNDATED_EVIDENCE_CREATED_CERTAINTY',verdict:cases.unknownDateAuthority.verdict});
  if(cases.unknownDateAuthority.counts.unknownDateEvidence!==1) failures.push({case:'unknownDateAuthority',type:'UNKNOWN_DATE_NOT_FLAGGED',counts:cases.unknownDateAuthority.counts});

  cases.futureAuthority=verifyClaim({
    claim:'The service is currently available.',
    freshnessPolicy:policy,
    evidence:[{id:'T1',source:'Future official status page',sourceFamily:'Official status',sourceClass:'OFFICIAL',relation:'SUPPORTS',date:'2026-09-03',fingerprint:'future-official'}]
  });
  if(cases.futureAuthority.verdict!=='INDETERMINATE') failures.push({case:'futureAuthority',type:'FUTURE_EVIDENCE_CREATED_CERTAINTY',verdict:cases.futureAuthority.verdict});
  if(cases.futureAuthority.counts.futureEvidence!==1||cases.futureAuthority.counts.eligibleAuthoritativeSupports!==0) failures.push({case:'futureAuthority',type:'FUTURE_EVIDENCE_NOT_QUARANTINED',counts:cases.futureAuthority.counts});

  cases.partialMonthOverlap=verifyClaim({
    claim:'The service is currently available.',
    freshnessPolicy:policy,
    evidence:[{id:'T2',source:'Month-only official record',sourceFamily:'Official status',sourceClass:'OFFICIAL',relation:'SUPPORTS',date:'2026-09',fingerprint:'month-overlap'}]
  });
  if(cases.partialMonthOverlap.verdict!=='INDETERMINATE') failures.push({case:'partialMonthOverlap',type:'OVERLAPPING_DATE_RANGE_CREATED_CERTAINTY',verdict:cases.partialMonthOverlap.verdict});
  if(cases.partialMonthOverlap.counts.overlappingDateEvidence!==1||cases.partialMonthOverlap.counts.eligibleAuthoritativeSupports!==0) failures.push({case:'partialMonthOverlap',type:'OVERLAPPING_DATE_RANGE_NOT_QUARANTINED',counts:cases.partialMonthOverlap.counts});

  const result={
    schema:'nostromo-droplet-claim-verify-test/v1.3',
    completedAt:new Date().toISOString(),
    status:failures.length?'FAIL':'PASS',
    cases,
    failures,
    boundary:'This test validates deterministic claim verdict computation from explicit evidence, exact replay suppression, source-family audit counts, authoritative-direction conflict containment, fingerprint-integrity conflict containment, and opt-in temporal gating that prevents stale, undated, future-dated, or date-range-overlapping evidence from creating certainty. CI performs no web search and does not infer whether a claim is time-sensitive.'
  };
  await fs.writeFile(outPath,JSON.stringify(result,null,2)+'\n','utf8');
  console.log(JSON.stringify(result,null,2));
  if(result.status!=='PASS') process.exitCode=1;
}catch(error){
  const result={schema:'nostromo-droplet-claim-verify-test/v1.3',completedAt:new Date().toISOString(),status:'FAIL',failures:[...failures,{type:'UNCAUGHT',message:String(error?.message||error)}]};
  await fs.writeFile(outPath,JSON.stringify(result,null,2)+'\n','utf8');
  console.log(JSON.stringify(result,null,2));
  process.exitCode=1;
}
