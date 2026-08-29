import fs from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {shroomAdvanceGreenhouseRound} from './repo-executors.mjs';

const cases=[
  'greenhouse/r111-nostromo-formal-round.json',
  'greenhouse/r112-nostromo-formal-round.json'
];

async function verify(statePath){
  const state=JSON.parse(await fs.readFile(statePath,'utf8'));
  const failures=[];
  const actualParentBlobSha=execFileSync('git',['hash-object',state.source],{encoding:'utf8'}).trim();
  if(state.sourceBlobSha!==actualParentBlobSha)failures.push('SOURCE_BLOB_SHA_MISMATCH');
  const dry=await shroomAdvanceGreenhouseRound({
    task:state.task,
    statePath:state.source,
    expectedSourceBlobSha:state.sourceBlobSha,
    intervention:state.intervention||{},
    event:state.event||null
  });
  if(dry.round!==state.round)failures.push('EXECUTOR_ROUND_MISMATCH');
  if(dry.previousRound!==state.previousRound)failures.push('EXECUTOR_PREVIOUS_MISMATCH');
  if(dry.provenanceFingerprint!==state.provenanceFingerprint)failures.push('PROVENANCE_FINGERPRINT_MISMATCH');
  if(JSON.stringify(dry.participants)!==JSON.stringify(state.participants))failures.push('PARTICIPANTS_MISMATCH');
  if(JSON.stringify(dry.silent)!==JSON.stringify(state.silent))failures.push('SILENT_MISMATCH');
  if(dry.event!==state.event)failures.push('EVENT_MISMATCH');
  if(!String(state.continuity||'').includes(state.previousRound))failures.push('CONTINUITY_PARENT_NOT_DECLARED');
  if(!/does not claim ten independently persistent live LLM processes/i.test(state.runtime_note||''))failures.push('RUNTIME_BOUNDARY_MISSING');
  return {
    round:state.round,
    previousRound:state.previousRound,
    statePath,
    parentPath:state.source,
    parentBlobSha:actualParentBlobSha,
    provenanceFingerprint:state.provenanceFingerprint,
    executorCompatibility:dry.compatibility||null,
    participants:state.participants.length,
    silent:state.silent.length,
    status:failures.length?'FAIL':'PASS',
    failures
  };
}

const rounds=[];
for(const p of cases)rounds.push(await verify(p));
const failures=rounds.flatMap(r=>r.failures.map(f=>`${r.round}:${f}`));
const result={
  schema:'nostromo-formal-round-test/v0.9',
  completedAt:new Date().toISOString(),
  status:failures.length?'FAIL':'PASS',
  chain:rounds.map(r=>r.round),
  rounds,
  failures,
  boundary:'Certifies repository history continuity, parent Git blob identity, deterministic executor reproducibility and provenance for the declared formal-round chain. It does not certify ten independently persistent live LLM processes.'
};
await fs.writeFile('nostromo/integration/formal-round-last-result.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));
if(failures.length)process.exit(1);
