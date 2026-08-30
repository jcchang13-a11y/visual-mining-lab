import fs from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {shroomAdvanceGreenhouseRound} from './repo-executors.mjs';

const cases=[
  'greenhouse/r111-nostromo-formal-round.json',
  'greenhouse/r112-nostromo-formal-round.json',
  'greenhouse/r113-nostromo-formal-round.json'
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

function setStats(a,b){
  const A=new Set(a),B=new Set(b);
  const intersection=[...A].filter(x=>B.has(x));
  const lost=[...A].filter(x=>!B.has(x));
  const newlyVisible=[...B].filter(x=>!A.has(x));
  const union=new Set([...A,...B]);
  return {intersection,lost,newlyVisible,intersectionCount:intersection.length,unionCount:union.size,jaccard:union.size?intersection.length/union.size:1,exactReturn:lost.length===0&&newlyVisible.length===0};
}

const rounds=[];
for(const p of cases)rounds.push(await verify(p));
const failures=rounds.flatMap(r=>r.failures.map(f=>`${r.round}:${f}`));

const r111=JSON.parse(await fs.readFile(cases[0],'utf8'));
const r113=JSON.parse(await fs.readFile(cases[2],'utf8'));
const stats=setStats(r111.participants||[],r113.participants||[]);
const reversibility={
  referenceRound:'R111',
  testRound:'R113',
  classification:stats.exactReturn?'EXACT_RETURN':stats.intersectionCount>0?'PARTIAL_RETURN':'NO_RETURN',
  ...stats
};
if(r113.reversibility){
  if(r113.reversibility.classification!==reversibility.classification)failures.push('R113:REVERSIBILITY_CLASSIFICATION_MISMATCH');
  if(Boolean(r113.reversibility.exactReturn)!==reversibility.exactReturn)failures.push('R113:REVERSIBILITY_EXACT_FLAG_MISMATCH');
  if(Number(r113.reversibility.intersectionCount)!==reversibility.intersectionCount)failures.push('R113:REVERSIBILITY_INTERSECTION_MISMATCH');
  if(Number(r113.reversibility.unionCount)!==reversibility.unionCount)failures.push('R113:REVERSIBILITY_UNION_MISMATCH');
  if(Math.abs(Number(r113.reversibility.jaccard)-reversibility.jaccard)>1e-12)failures.push('R113:REVERSIBILITY_JACCARD_MISMATCH');
}else failures.push('R113:REVERSIBILITY_EVIDENCE_MISSING');

const result={
  schema:'nostromo-formal-round-test/v1.0',
  completedAt:new Date().toISOString(),
  status:failures.length?'FAIL':'PASS',
  chain:rounds.map(r=>r.round),
  rounds,
  reversibility,
  failures,
  boundary:'Certifies repository history continuity, parent Git blob identity, deterministic executor reproducibility, provenance, and the declared R111↔R113 visibility-return classification. It does not certify ten independently persistent live LLM processes or causal reversibility outside this deterministic repository model.'
};
await fs.writeFile('nostromo/integration/formal-round-last-result.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));
if(failures.length)process.exit(1);
