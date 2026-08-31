// DROPLET claim verification CI test v1.1
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

  const result={
    schema:'nostromo-droplet-claim-verify-test/v1.1',
    completedAt:new Date().toISOString(),
    status:failures.length?'FAIL':'PASS',
    cases,
    failures,
    boundary:'This test validates deterministic claim verdict computation from explicit evidence, exact replay suppression, source-family audit counts, authoritative-direction conflict containment, and fingerprint-integrity conflict containment. Source-family labels are caller-supplied audit metadata and do not prove real-world independence; CI performs no web search.'
  };
  await fs.writeFile(outPath,JSON.stringify(result,null,2)+'\n','utf8');
  console.log(JSON.stringify(result,null,2));
  if(result.status!=='PASS') process.exitCode=1;
}catch(error){
  const result={schema:'nostromo-droplet-claim-verify-test/v1.1',completedAt:new Date().toISOString(),status:'FAIL',failures:[...failures,{type:'UNCAUGHT',message:String(error?.message||error)}]};
  await fs.writeFile(outPath,JSON.stringify(result,null,2)+'\n','utf8');
  console.log(JSON.stringify(result,null,2));
  process.exitCode=1;
}
