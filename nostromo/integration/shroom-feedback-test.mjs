// SHROOMING feedback-conditioning test v0.1
import fs from 'node:fs/promises';
import path from 'node:path';
import {shroomFeedbackReadingRound} from './shroom-feedback-executor.mjs';

const root=process.cwd();
const resultPath=path.join(root,'nostromo','integration','shroom-feedback-last-result.json');
const failures=[];

const baseline=await shroomFeedbackReadingRound({text:'同一段核心材料，不附加上游回饋。',agents:10,round:1});
const external=await shroomFeedbackReadingRound({text:'同一段核心材料。 EXTERNAL_CONNECTOR_FEEDBACK | drive_hits=4 | public_web_finding=official evidence | claim_relations=supports',agents:10,round:2});
const contradiction=await shroomFeedbackReadingRound({text:'同一段核心材料。 [CONTRADICTION->VAJRA] authoritative evidence refuted the claim.',agents:10,round:3});
const externalReplay=await shroomFeedbackReadingRound({text:'同一段核心材料。 EXTERNAL_CONNECTOR_FEEDBACK | drive_hits=4 | public_web_finding=official evidence | claim_relations=supports',agents:10,round:2});

if(baseline.status!=='EXECUTED'||baseline.count!==10)failures.push({type:'BASELINE_EXECUTION_FAIL'});
if(baseline.adaptation?.mode!=='BASELINE'||baseline.adaptation?.changedFromBaseline!==false)failures.push({type:'BASELINE_ADAPTATION_UNEXPECTED',adaptation:baseline.adaptation});
if(external.adaptation?.mode!=='EVIDENCE_CONDITIONED'||external.adaptation?.changedFromBaseline!==true)failures.push({type:'EXTERNAL_FEEDBACK_NOT_CONDITIONING',adaptation:external.adaptation});
if(external.reactions?.[0]?.lens==='structure')failures.push({type:'EXTERNAL_FEEDBACK_DID_NOT_CHANGE_FIRST_LENS',lens:external.reactions?.[0]?.lens});
if(contradiction.adaptation?.mode!=='CONTRADICTION_CONDITIONED'||contradiction.reactions?.[0]?.lens!=='counterexample')failures.push({type:'CONTRADICTION_DID_NOT_PRIORITIZE_COUNTEREXAMPLE',adaptation:contradiction.adaptation,lens:contradiction.reactions?.[0]?.lens});
if(JSON.stringify(external)!==JSON.stringify(externalReplay))failures.push({type:'DETERMINISTIC_REPLAY_FAIL'});
if(external.adaptation?.feedbackFingerprint===baseline.adaptation?.feedbackFingerprint)failures.push({type:'FEEDBACK_FINGERPRINT_NOT_DISTINCT'});

const result={
  schema:'nostromo-shroom-feedback-test/v0.1',
  completedAt:new Date().toISOString(),
  status:failures.length?'FAIL':'PASS',
  baseline:{mode:baseline.adaptation.mode,firstLens:baseline.reactions[0].lens,lensOrder:baseline.adaptation.lensOrder,feedbackFingerprint:baseline.adaptation.feedbackFingerprint},
  external:{mode:external.adaptation.mode,firstLens:external.reactions[0].lens,lensOrder:external.adaptation.lensOrder,feedbackFingerprint:external.adaptation.feedbackFingerprint},
  contradiction:{mode:contradiction.adaptation.mode,firstLens:contradiction.reactions[0].lens,lensOrder:contradiction.adaptation.lensOrder,feedbackFingerprint:contradiction.adaptation.feedbackFingerprint},
  deterministicReplay:JSON.stringify(external)===JSON.stringify(externalReplay),
  failures,
  boundary:'PASS demonstrates only deterministic structural conditioning: explicit upstream feedback changes SHROOMING lens priority and exact replay is stable. It does not demonstrate semantic learning, belief revision, independent agents, or real social emergence.'
};
await fs.writeFile(resultPath,JSON.stringify(result,null,2)+'\n','utf8');
console.log(JSON.stringify(result,null,2));
if(result.status!=='PASS')process.exitCode=1;
