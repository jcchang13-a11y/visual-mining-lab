// DROPLET freshness-scoped directional conflict adversarial test v1.0
import fs from 'node:fs/promises';
import {verifyClaim} from './droplet-claim-verify-executor.mjs';

const outPath='nostromo/integration/droplet-freshness-conflict-last-result.json';
const failures=[];
const policy={asOf:'2026-09-04',maxAgeDays:30};

const result=verifyClaim({
  claim:'The service is currently available.',
  freshnessPolicy:policy,
  evidence:[
    {id:'FRESH-SUPPORT',source:'Current official status',sourceFamily:'Official status',sourceClass:'OFFICIAL',relation:'SUPPORTS',date:'2026-09-03',fingerprint:'fresh-current-support'},
    {id:'STALE-REFUTE',source:'Historical primary incident record',sourceFamily:'Historical incident archive',sourceClass:'PRIMARY',relation:'REFUTES',date:'2025-01-01',fingerprint:'stale-historical-refute'}
  ]
});

if(result.verdict!=='SUPPORTED') failures.push({type:'STALE_OPPOSITE_BLOCKED_CURRENT_CERTAINTY',verdict:result.verdict});
if(result.conflicts.authoritativeConflict) failures.push({type:'STALE_OPPOSITE_COUNTED_AS_ELIGIBLE_CONFLICT',conflicts:result.conflicts});
if(!result.conflicts.rawAuthoritativeConflict) failures.push({type:'RAW_CONFLICT_AUDIT_LOST',conflicts:result.conflicts});
if(!result.conflicts.freshnessExcludedAuthoritativeConflict) failures.push({type:'FRESHNESS_EXCLUSION_NOT_AUDITED',conflicts:result.conflicts});
if(result.counts.eligibleAuthoritativeSupports!==1||result.counts.eligibleAuthoritativeRefutes!==0) failures.push({type:'CERTAINTY_ELIGIBILITY_DRIFT',counts:result.counts});
if(result.counts.staleEvidence!==1) failures.push({type:'STALE_EVIDENCE_NOT_RETAINED_FOR_AUDIT',counts:result.counts});

const control=verifyClaim({
  claim:'The service is currently available.',
  freshnessPolicy:policy,
  evidence:[
    {id:'FRESH-SUPPORT-2',source:'Current official status',sourceFamily:'Official status',sourceClass:'OFFICIAL',relation:'SUPPORTS',date:'2026-09-03',fingerprint:'fresh-current-support-2'},
    {id:'FRESH-REFUTE',source:'Current primary incident record',sourceFamily:'Current incident archive',sourceClass:'PRIMARY',relation:'REFUTES',date:'2026-09-03',fingerprint:'fresh-current-refute'}
  ]
});

if(control.verdict!=='INDETERMINATE') failures.push({type:'FRESH_AUTHORITATIVE_CONFLICT_FALSE_CERTAINTY',verdict:control.verdict});
if(!control.conflicts.authoritativeConflict) failures.push({type:'FRESH_AUTHORITATIVE_CONFLICT_NOT_FLAGGED',conflicts:control.conflicts});

const payload={
  schema:'nostromo-droplet-freshness-conflict-test/v1.0',
  completedAt:new Date().toISOString(),
  status:failures.length?'FAIL':'PASS',
  staleOppositeCase:result,
  freshConflictControl:control,
  failures,
  boundary:'Under an explicit freshness policy, evidence outside the certainty-eligible time window remains visible in the raw conflict audit but cannot by itself directionally block a current verdict. Fresh opposing authoritative evidence still forces INDETERMINATE. This is caller-invoked temporal scoping, not automatic inference that a claim is time-sensitive and not historical truth adjudication.'
};

await fs.writeFile(outPath,JSON.stringify(payload,null,2)+'\n','utf8');
console.log(JSON.stringify(payload,null,2));
if(payload.status!=='PASS') process.exitCode=1;
