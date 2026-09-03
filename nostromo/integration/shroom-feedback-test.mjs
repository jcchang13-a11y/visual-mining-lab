// SHROOMING feedback-conditioning test v0.3
// CI-gated acceptance test for cross-organ behavioral conditioning, lexical-contamination resistance, and mixed-signal composition.
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
const mixedEvidenceQuestion=await shroomFeedbackReadingRound({text:'同一段核心材料。 EXTERNAL_CONNECTOR_FEEDBACK | public_web_finding=official evidence | claim_relations=supports | [QUESTION->SHROOMING] 哪個位置最值得重讀？',agents:10,round:6});
const mixedContradictionQuestion=await shroomFeedbackReadingRound({text:'同一段核心材料。 [CONTRADICTION->VAJRA] authoritative evidence refuted the claim. [QUESTION->SHROOMING] 哪個位置最值得重讀？',agents:10,round:7});
const externalReplay=await shroomFeedbackReadingRound({text:'同一段核心材料。 EXTERNAL_CONNECTOR_FEEDBACK | drive_hits=4 | public_web_finding=official evidence | claim_relations=supports',agents:10,round:3});
const mixedReplay=await shroomFeedbackReadingRound({text:'同一段核心材料。 [CONTRADICTION->VAJRA] authoritative evidence refuted the claim. [QUESTION->SHROOMING] 哪個位置最值得重讀？',agents:10,round:7});

if(baseline.status!=='EXECUTED'||baseline.count!==10)failures.push({type:'BASELINE_EXECUTION_FAIL'});
if(baseline.adaptation?.mode!=='BASELINE'||baseline.adaptation?.changedFromBaseline!==false)failures.push({type:'BASELINE_ADAPTATION_UNEXPECTED',adaptation:baseline.adaptation});
if(lexicalNoise.adaptation?.mode!=='BASELINE'||lexicalNoise.adaptation?.changedFromBaseline!==false)failures.push({type:'LEXICAL_NOISE_HIJACKED_CONDITIONING',adaptation:lexicalNoise.adaptation});
if(lexicalNoise.adaptation?.ignoredLexicalMentions?.evidence!==true||lexicalNoise.adaptation?.ignoredLexicalMentions?.contradiction!==true)failures.push({type:'LEXICAL_NOISE_NOT_AUDITED',adaptation:lexicalNoise.adaptation});
if(external.adaptation?.mode!=='EVIDENCE_CONDITIONED'||external.adaptation?.changedFromBaseline!==true)failures.push({type:'EXTERNAL_FEEDBACK_NOT_CONDITIONING',adaptation:external.adaptation});
if(external.reactions?.[0]?.lens!=='evidence')failures.push({type:'EXTERNAL_FEEDBACK_DID_NOT_PRIORITIZE_EVIDENCE',lens:external.reactions?.[0]?.lens});
if(contradiction.adaptation?.mode!=='CONTRADICTION_CONDITIONED'||contradiction.reactions?.[0]?.lens!=='counterexample')failures.push({type:'CONTRADICTION_DID_NOT_PRIORITIZE_COUNTEREXAMPLE',adaptation:contradiction.adaptation,lens:contradiction.reactions?.[0]?.lens});
if(explicitQuestion.adaptation?.mode!=='QUESTION_CONDITIONED'||explicitQuestion.reactions?.[0]?.lens!=='position')failures.push({type:'EXPLICIT_QUESTION_DID_NOT_CONDITION',adaptation:explicitQuestion.adaptation,lens:explicitQuestion.reactions?.[0]?.lens});
if(mixedEvidenceQuestion.adaptation?.mode!=='MIXED_CONDITIONED')failures.push({type:'MIXED_EVIDENCE_QUESTION_NOT_COMPOSED',adaptation:mixedEvidenceQuestion.adaptation});
if(!mixedEvidenceQuestion.adaptation?.activeSignalClasses?.includes('EVIDENCE')||!mixedEvidenceQuestion.adaptation?.activeSignalClasses?.includes('QUESTION'))failures.push({type:'MIXED_EVIDENCE_QUESTION_SIGNAL_LOSS',classes:mixedEvidenceQuestion.adaptation?.activeSignalClasses});
if(mixedEvidenceQuestion.reactions?.[0]?.lens!=='evidence'||mixedEvidenceQuestion.adaptation?.lensOrder?.indexOf('position')<0)failures.push({type:'MIXED_EVIDENCE_QUESTION_PRIORITY_UNEXPECTED',lensOrder:mixedEvidenceQuestion.adaptation?.lensOrder});
if(mixedContradictionQuestion.adaptation?.mode!=='MIXED_CONDITIONED')failures.push({type:'MIXED_CONTRADICTION_QUESTION_NOT_COMPOSED',adaptation:mixedContradictionQuestion.adaptation});
if(!mixedContradictionQuestion.adaptation?.activeSignalClasses?.includes('CONTRADICTION')||!mixedContradictionQuestion.adaptation?.activeSignalClasses?.includes('QUESTION'))failures.push({type:'MIXED_CONTRADICTION_QUESTION_SIGNAL_LOSS',classes:mixedContradictionQuestion.adaptation?.activeSignalClasses});
if(mixedContradictionQuestion.reactions?.[0]?.lens!=='counterexample'||mixedContradictionQuestion.adaptation?.lensOrder?.indexOf('position')<0)failures.push({type:'MIXED_CONTRADICTION_QUESTION_PRIORITY_UNEXPECTED',lensOrder:mixedContradictionQuestion.adaptation?.lensOrder});
if(JSON.stringify(external)!==JSON.stringify(externalReplay))failures.push({type:'DETERMINISTIC_REPLAY_FAIL'});
if(JSON.stringify(mixedContradictionQuestion)!==JSON.stringify(mixedReplay))failures.push({type:'MIXED_DETERMINISTIC_REPLAY_FAIL'});
if(external.adaptation?.feedbackFingerprint===baseline.adaptation?.feedbackFingerprint)failures.push({type:'FEEDBACK_FINGERPRINT_NOT_DISTINCT'});
if(external.adaptation?.conditioningBasis!=='STRUCTURED_FEEDBACK_COMPOSITION')failures.push({type:'CONDITIONING_BASIS_NOT_EXPLICIT',basis:external.adaptation?.conditioningBasis});
if(!Array.isArray(mixedContradictionQuestion.adaptation?.scoreContributions)||mixedContradictionQuestion.adaptation.scoreContributions.length<2)failures.push({type:'MIXED_SCORE_PROVENANCE_MISSING'});

const result={
  schema:'nostromo-shroom-feedback-test/v0.3',
  completedAt:new Date().toISOString(),
  status:failures.length?'FAIL':'PASS',
  baseline:{mode:baseline.adaptation.mode,firstLens:baseline.reactions[0].lens,lensOrder:baseline.adaptation.lensOrder,feedbackFingerprint:baseline.adaptation.feedbackFingerprint},
  lexicalNoise:{mode:lexicalNoise.adaptation.mode,firstLens:lexicalNoise.reactions[0].lens,changedFromBaseline:lexicalNoise.adaptation.changedFromBaseline,ignoredLexicalMentions:lexicalNoise.adaptation.ignoredLexicalMentions},
  external:{mode:external.adaptation.mode,firstLens:external.reactions[0].lens,lensOrder:external.adaptation.lensOrder,feedbackFingerprint:external.adaptation.feedbackFingerprint},
  contradiction:{mode:contradiction.adaptation.mode,firstLens:contradiction.reactions[0].lens,lensOrder:contradiction.adaptation.lensOrder,feedbackFingerprint:contradiction.adaptation.feedbackFingerprint},
  explicitQuestion:{mode:explicitQuestion.adaptation.mode,firstLens:explicitQuestion.reactions[0].lens,lensOrder:explicitQuestion.adaptation.lensOrder,feedbackFingerprint:explicitQuestion.adaptation.feedbackFingerprint},
  mixedEvidenceQuestion:{mode:mixedEvidenceQuestion.adaptation.mode,activeSignalClasses:mixedEvidenceQuestion.adaptation.activeSignalClasses,firstLens:mixedEvidenceQuestion.reactions[0].lens,lensOrder:mixedEvidenceQuestion.adaptation.lensOrder,lensScores:mixedEvidenceQuestion.adaptation.lensScores},
  mixedContradictionQuestion:{mode:mixedContradictionQuestion.adaptation.mode,activeSignalClasses:mixedContradictionQuestion.adaptation.activeSignalClasses,firstLens:mixedContradictionQuestion.reactions[0].lens,lensOrder:mixedContradictionQuestion.adaptation.lensOrder,lensScores:mixedContradictionQuestion.adaptation.lensScores},
  deterministicReplay:JSON.stringify(external)===JSON.stringify(externalReplay),
  mixedDeterministicReplay:JSON.stringify(mixedContradictionQuestion)===JSON.stringify(mixedReplay),
  failures,
  boundary:'PASS demonstrates deterministic structural multi-signal conditioning with lexical-contamination resistance: explicit structured evidence, contradiction and question signals can compose bounded lens priorities instead of one precedence branch silently erasing the others. Ordinary prose mentions cannot reorder the reader, and score contributions remain auditable. This does not demonstrate semantic learning, belief revision, independent agents, or real social emergence.'
};
await fs.writeFile(resultPath,JSON.stringify(result,null,2)+'\n','utf8');
console.log(JSON.stringify(result,null,2));
if(result.status!=='PASS')process.exitCode=1;
