import fs from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {shroomAdvanceGreenhouseRound,shroomParentSensitiveControl} from './repo-executors.mjs';

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
  const dry=await shroomAdvanceGreenhouseRound({task:state.task,statePath:state.source,expectedSourceBlobSha:state.sourceBlobSha,intervention:state.intervention||{},event:state.event||null});
  if(dry.round!==state.round)failures.push('EXECUTOR_ROUND_MISMATCH');
  if(dry.previousRound!==state.previousRound)failures.push('EXECUTOR_PREVIOUS_MISMATCH');
  if(dry.provenanceFingerprint!==state.provenanceFingerprint)failures.push('PROVENANCE_FINGERPRINT_MISMATCH');
  if(JSON.stringify(dry.participants)!==JSON.stringify(state.participants))failures.push('PARTICIPANTS_MISMATCH');
  if(JSON.stringify(dry.silent)!==JSON.stringify(state.silent))failures.push('SILENT_MISMATCH');
  if(dry.event!==state.event)failures.push('EVENT_MISMATCH');
  if(!String(state.continuity||'').includes(state.previousRound))failures.push('CONTINUITY_PARENT_NOT_DECLARED');
  if(!/does not claim ten independently persistent live LLM processes/i.test(state.runtime_note||''))failures.push('RUNTIME_BOUNDARY_MISSING');
  return {round:state.round,previousRound:state.previousRound,statePath,parentPath:state.source,parentBlobSha:actualParentBlobSha,provenanceFingerprint:state.provenanceFingerprint,executorCompatibility:dry.compatibility||null,participants:state.participants.length,silent:state.silent.length,status:failures.length?'FAIL':'PASS',failures};
}

function setStats(a,b){
  const A=new Set(a),B=new Set(b);
  const intersection=[...A].filter(x=>B.has(x));
  const lost=[...A].filter(x=>!B.has(x));
  const newlyVisible=[...B].filter(x=>!A.has(x));
  const union=new Set([...A,...B]);
  return {intersection,lost,newlyVisible,intersectionCount:intersection.length,unionCount:union.size,jaccard:union.size?intersection.length/union.size:1,exactReturn:lost.length===0&&newlyVisible.length===0};
}

async function matchedParentControl(){
  const r113=JSON.parse(await fs.readFile(cases[2],'utf8'));
  const parentA='greenhouse/r111-nostromo-formal-round.json';
  const parentB='greenhouse/r112-nostromo-formal-round.json';
  const shaA=execFileSync('git',['hash-object',parentA],{encoding:'utf8'}).trim();
  const shaB=execFileSync('git',['hash-object',parentB],{encoding:'utf8'}).trim();
  const common={task:r113.task,intervention:r113.intervention||{},event:r113.event||null};
  const a=await shroomAdvanceGreenhouseRound({...common,statePath:parentA,expectedSourceBlobSha:shaA});
  const b=await shroomAdvanceGreenhouseRound({...common,statePath:parentB,expectedSourceBlobSha:shaB});
  const sameParticipants=JSON.stringify(a.participants)===JSON.stringify(b.participants);
  const sameSilent=JSON.stringify(a.silent)===JSON.stringify(b.silent);
  const provenanceDiffers=a.provenanceFingerprint!==b.provenanceFingerprint;
  const failures=[];
  if(!sameParticipants)failures.push('MATCHED_PARENT_PARTICIPANTS_DIFFER');
  if(!sameSilent)failures.push('MATCHED_PARENT_SILENT_DIFFER');
  if(!provenanceDiffers)failures.push('MATCHED_PARENT_PROVENANCE_NOT_DISTINCT');
  return {taskFingerprint:'same-as-R113',intervention:r113.intervention,parentA:{path:parentA,blobSha:shaA,round:a.previousRound,generatedRound:a.round,participants:a.participants,provenanceFingerprint:a.provenanceFingerprint},parentB:{path:parentB,blobSha:shaB,round:b.previousRound,generatedRound:b.round,participants:b.participants,provenanceFingerprint:b.provenanceFingerprint},sameParticipants,sameSilent,provenanceDiffers,classification:sameParticipants&&sameSilent?'PARENT_INVARIANT_UNDER_CURRENT_VISIBILITY_RULE':'PARENT_SENSITIVE_UNDER_CURRENT_VISIBILITY_RULE',interpretation:'Under repo-executors formal baseline v0.9 the visibility selection is a function of task + intervention + trace id; parent identity affects provenance but not participant selection. Therefore R113 PARTIAL_RETURN cannot be cited as evidence of visibility path dependence in the current formal deterministic rule.',status:failures.length?'FAIL':'PASS',failures};
}

async function parentSensitiveBranchControl(){
  const r113=JSON.parse(await fs.readFile(cases[2],'utf8'));
  const parentA='greenhouse/r111-nostromo-formal-round.json';
  const parentB='greenhouse/r112-nostromo-formal-round.json';
  const shaA=execFileSync('git',['hash-object',parentA],{encoding:'utf8'}).trim();
  const shaB=execFileSync('git',['hash-object',parentB],{encoding:'utf8'}).trim();
  const common={task:r113.task,intervention:r113.intervention||{}};
  const a1=await shroomParentSensitiveControl({...common,statePath:parentA,expectedSourceBlobSha:shaA});
  const a2=await shroomParentSensitiveControl({...common,statePath:parentA,expectedSourceBlobSha:shaA});
  const b=await shroomParentSensitiveControl({...common,statePath:parentB,expectedSourceBlobSha:shaB});
  const deterministic=JSON.stringify(a1)===JSON.stringify(a2);
  const parentChangesParticipants=JSON.stringify(a1.participants)!==JSON.stringify(b.participants);
  const parentChangesSilent=JSON.stringify(a1.silent)!==JSON.stringify(b.silent);
  const fingerprintDiffers=a1.transitionFingerprint!==b.transitionFingerprint;
  const failures=[];
  if(!deterministic)failures.push('PARENT_SENSITIVE_BRANCH_NOT_DETERMINISTIC');
  if(!parentChangesParticipants)failures.push('PARENT_SENSITIVE_BRANCH_PARTICIPANTS_INVARIANT');
  if(!parentChangesSilent)failures.push('PARENT_SENSITIVE_BRANCH_SILENT_INVARIANT');
  if(!fingerprintDiffers)failures.push('PARENT_SENSITIVE_BRANCH_FINGERPRINT_INVARIANT');
  return {model:'EXPERIMENTAL_PARENT_SENSITIVE_V1',parentA:{path:parentA,blobSha:shaA,participants:a1.participants,silent:a1.silent,transitionFingerprint:a1.transitionFingerprint},parentB:{path:parentB,blobSha:shaB,participants:b.participants,silent:b.silent,transitionFingerprint:b.transitionFingerprint},deterministic,parentChangesParticipants,parentChangesSilent,fingerprintDiffers,classification:parentChangesParticipants?'PARENT_SENSITIVE_BY_CONSTRUCTION':'PARENT_INVARIANT',interpretation:'This isolated counterfactual branch deliberately includes parent round ordinal in participant selection. It proves the infrastructure can execute and audit a parent-sensitive transition while preserving the formal parent-invariant baseline. It is an engineering control, not evidence that the real greenhouse is path-dependent.',status:failures.length?'FAIL':'PASS',failures,boundary:a1.boundary};
}

const rounds=[];
for(const p of cases)rounds.push(await verify(p));
const failures=rounds.flatMap(r=>r.failures.map(f=>`${r.round}:${f}`));
const r111=JSON.parse(await fs.readFile(cases[0],'utf8'));
const r113=JSON.parse(await fs.readFile(cases[2],'utf8'));
const stats=setStats(r111.participants||[],r113.participants||[]);
const reversibility={referenceRound:'R111',testRound:'R113',classification:stats.exactReturn?'EXACT_RETURN':stats.intersectionCount>0?'PARTIAL_RETURN':'NO_RETURN',...stats};
if(r113.reversibility){
  if(r113.reversibility.classification!==reversibility.classification)failures.push('R113:REVERSIBILITY_CLASSIFICATION_MISMATCH');
  if(Boolean(r113.reversibility.exactReturn)!==reversibility.exactReturn)failures.push('R113:REVERSIBILITY_EXACT_FLAG_MISMATCH');
  if(Number(r113.reversibility.intersectionCount)!==reversibility.intersectionCount)failures.push('R113:REVERSIBILITY_INTERSECTION_MISMATCH');
  if(Number(r113.reversibility.unionCount)!==reversibility.unionCount)failures.push('R113:REVERSIBILITY_UNION_MISMATCH');
  if(Math.abs(Number(r113.reversibility.jaccard)-reversibility.jaccard)>1e-12)failures.push('R113:REVERSIBILITY_JACCARD_MISMATCH');
}else failures.push('R113:REVERSIBILITY_EVIDENCE_MISSING');

const parentControl=await matchedParentControl();
for(const f of parentControl.failures)failures.push(`PARENT_CONTROL:${f}`);
const parentSensitiveControl=await parentSensitiveBranchControl();
for(const f of parentSensitiveControl.failures)failures.push(`PARENT_SENSITIVE_CONTROL:${f}`);

const result={schema:'nostromo-formal-round-test/v1.2',completedAt:new Date().toISOString(),status:failures.length?'FAIL':'PASS',chain:rounds.map(r=>r.round),rounds,reversibility,parentControl,parentSensitiveControl,failures,boundary:'Certifies formal repository history continuity and reproducibility, the parent-invariant v0.9 baseline, and an isolated parent-sensitive counterfactual executor. The new branch is explicitly separated from formal greenhouse history: it demonstrates executor capability and matched-control observability, not real causal path dependence or ten independently persistent live LLM processes.'};
await fs.writeFile('nostromo/integration/formal-round-last-result.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));
if(failures.length)process.exit(1);
