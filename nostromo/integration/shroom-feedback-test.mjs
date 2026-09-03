// SHROOMING feedback-conditioning test v0.2
// CI-gated acceptance test for cross-organ behavioral conditioning and lexical-contamination resistance.
import fs from 'node:fs/promises';
import path from 'node:path';
import {shroomFeedbackReadingRound} from './shroom-feedback-executor.mjs';

const root=process.cwd();
const resultPath=path.join(root,'nostromo','integration','shroom-feedback-last-result.json');
const failures=[];

const baseline=await shroomFeedbackReadingRound({text:'同一段核心材料，不附加上游回饋。',agents:10,round:1});
const lexicalNoise=await shroomFeedbackReadingRound({text:'這段普通材料只是在討論 evidence、source、contradiction、counterevidence 與證據這些詞，沒有任何上游機器標記。',agents:10,round:2});
const external=await shroomFeedbackReadingRound({text:'同一段核心材料。 EXTERNAL_CONNECTOR_FEEDBACK | drive_hits=4 | public_web_finding=official evidence | claim_relations=supports',agents:10,round:3});
const contradiction=await shroomFeedbackReadingRound({text:'同一段核心材料。 [CONTRADICTION->VAJRA] authoritative evidence refuted the claim.',agents:10,round:4});
const explicitQuestion=await shroomFeedbackReadingRound({text:'同一段核心材料。 [QUESTION->SHROOMING] 哪個位置最值得重讀？',agents:10,round:5});
const externalReplay=await shroomFeedbackReadingRound({text:'同一段核心材料。 EXTERNAL_CONNECTOR_FEEDBACK | drive_hits=4 | public_web_finding=official evidence | claim_relations=supports',agents:10,round:3});

if(baseline.status!=='EXECUTED'||baseline.count!==10)failures.push({type:'BASELINE_EXECUTION_FAIL'});
if(baseline.adaptation?.mode!=='BASELINE'||baseline.adaptation?.changedFromBaseline!==false)failures.push({type:'BASELINE_ADAPTATION_UNEXPECTED',adaptation:baseline.adaptation});
if(lexicalNoise.adaptation?.mode!=='BASELINE'||lexicalNoise.adaptation?.changedFromBaseline!==false)failures.push({type:'LEXICAL_NOISE_HIJACKED_CONDITIONING',adaptation:lexicalNoise.adaptation});
if(lexicalNoise.adaptation?.ignoredLexicalMentions?.evidence!==true||lexicalNoise.adaptation?.ignoredLexicalMentions?.contradiction!==true)failures.push({type:'LEXICAL_NOISE_NOT_AUDITED',adaptation:lexicalNoise.adaptation});
if(external.adaptation?.mode!=='EVIDENCE_CONDITIONED'||external.adaptation?.changedFromBaseline!==true)failures.push({type:'EXTERNAL_FEEDBACK_NOT_CONDITIONING',adaptation:external.adaptation});
if(external.reactions?.[0]?.lens!=='evidence')failures.push({type:'EXTERNAL_FEEDBACK_DID_NOT_PRIORITIZE_EVIDENCE',lens:external.reactions?.[0]?.lens});
if(contradiction.adaptation?.mode!=='CONTRADICTION_CONDITIONED'||contradiction.reactions?.[0]?.lens!=='counterexample')failures.push({type:'CONTRADICTION_DID_NOT_PRIORITIZE_COUNTEREXAMPLE',adaptation:contradiction.adaptation,lens:contradiction.reactions?.[0]?.lens});
if(explicitQuestion.adaptation?.mode!=='QUESTION_CONDITIONED'||explicitQuestion.reactions?.[0]?.lens!=='position')failures.push({type:'EXPLICIT_QUESTION_DID_NOT_CONDITION',adaptation:explicitQuestion.adaptation,lens:explicitQuestion.reactions?.[0]?.lens});
if(JSON.stringify(external)!==JSON.stringify(externalReplay))failures.push({type:'DETERMINISTIC_REPLAY_FAIL'});
if(external.adaptation?.feedbackFingerprint===baseline.adaptation?.feedbackFingerprint)failures.push({type:'FEEDBACK_FINGERPRINT_NOT_DISTINCT'});
if(external.adaptation?.conditioningBasis!=='STRUCTURED_FEEDBACK_ONLY')failures.push({type:'CONDITIONING_BASIS_NOT_EXPLICIT',basis:external.adaptation?.conditioningBasis});

const result={
  schema:'nostromo-shroom-feedback-test/v0.2',
  completedAt:new Date().toISOString(),
  status:failures.length?'FAIL':'PASS',
  baseline:{mode:baseline.adaptation.mode,firstLens:baseline.reactions[0].lens,lensOrder:baseline.adaptation.lensOrder,feedbackFingerprint:baseline.adaptation.feedbackFingerprint},
  lexicalNoise:{mode:lexicalNoise.adaptation.mode,firstLens:lexicalNoise.reactions[0].lens,changedFromBaseline:lexicalNoise.adaptation.changedFromBaseline,ignoredLexicalMentions:lexicalNoise.adaptation.ignoredLexicalMentions},
  external:{mode:external.adaptation.mode,firstLens:external.reactions[0].lens,lensOrder:external.adaptation.lensOrder,feedbackFingerprint:external.adaptation.feedbackFingerprint},
  contradiction:{mode:contradiction.adaptation.mode,firstLens:contradiction.reactions[0].lens,lensOrder:contradiction.adaptation.lensOrder,feedbackFingerprint:contradiction.adaptation.feedbackFingerprint},
  explicitQuestion:{mode:explicitQuestion.adaptation.mode,firstLens:explicitQuestion.reactions[0].lens,lensOrder:explicitQuestion.adaptation.lensOrder,feedbackFingerprint:explicitQuestion.adaptation.feedbackFingerprint},
  deterministicReplay:JSON.stringify(external)===JSON.stringify(externalReplay),
  failures,
  boundary:'PASS demonstrates deterministic structural conditioning with lexical-contamination resistance: explicit structured upstream markers can change SHROOMING lens priority, while ordinary prose merely mentioning evidence/source/contradiction/counterevidence cannot by itself reorder the reader. Ignored lexical mentions remain auditable. This does not demonstrate semantic learning, belief revision, independent agents, or real social emergence.'
};
await fs.writeFile(resultPath,JSON.stringify(result,null,2)+'\n','utf8');
console.log(JSON.stringify(result,null,2));
if(result.status!=='PASS')process.exitCode=1;
