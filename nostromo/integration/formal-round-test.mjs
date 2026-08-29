import fs from 'node:fs/promises';
import {shroomAdvanceGreenhouseRound} from './repo-executors.mjs';

const sourcePath='greenhouse/r101-r110-open-social-ontology.json';
const statePath='greenhouse/r111-nostromo-formal-round.json';
const expectedSourceBlobSha='8e54a0adde2f447e7090497470c37da9c6388a4b';
const task='test whether temporary subject forms recur, mutate or disappear under asymmetric information, conflicting tasks and partial memory access';

const state=JSON.parse(await fs.readFile(statePath,'utf8'));
const dry=await shroomAdvanceGreenhouseRound({task,statePath:sourcePath,expectedSourceBlobSha});
const failures=[];
if(state.round!=='R111')failures.push('STATE_ROUND_NOT_R111');
if(state.previousRound!=='R110')failures.push('STATE_PREVIOUS_NOT_R110');
if(state.sourceBlobSha!==expectedSourceBlobSha)failures.push('SOURCE_BLOB_SHA_MISMATCH');
if(dry.round!==state.round)failures.push('EXECUTOR_ROUND_MISMATCH');
if(dry.previousRound!==state.previousRound)failures.push('EXECUTOR_PREVIOUS_MISMATCH');
if(dry.provenanceFingerprint!==state.provenanceFingerprint)failures.push('PROVENANCE_FINGERPRINT_MISMATCH');
if(JSON.stringify(dry.participants)!==JSON.stringify(state.participants))failures.push('PARTICIPANTS_MISMATCH');
if(JSON.stringify(dry.silent)!==JSON.stringify(state.silent))failures.push('SILENT_MISMATCH');
if(!/R1-R110/.test(state.continuity||''))failures.push('CONTINUITY_NOT_DECLARED');
if(!/does not claim ten independently persistent live LLM processes/i.test(state.runtime_note||''))failures.push('RUNTIME_BOUNDARY_MISSING');
const result={schema:'nostromo-formal-round-test/v0.8',status:failures.length?'FAIL':'PASS',round:state.round,previousRound:state.previousRound,sourceBlobSha:state.sourceBlobSha,provenanceFingerprint:state.provenanceFingerprint,participants:state.participants.length,silent:state.silent.length,failures};
console.log(JSON.stringify(result,null,2));
if(failures.length)process.exit(1);
