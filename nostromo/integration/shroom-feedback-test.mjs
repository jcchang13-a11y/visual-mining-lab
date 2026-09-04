// SHROOMING feedback-conditioning test v0.5
// CI-gated acceptance test for cross-organ behavioral conditioning, lexical-contamination resistance, mixed-signal lens composition, signal-aware stance composition, and bounded disagreement preservation.
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
const tripleMixed=await shroomFeedbackReadingRound({text:'同一段核心材料。 EXTERNAL_CONNECTOR_FEEDBACK | public_web_finding=official evidence | claim_relations=refutes | [CONTRADICTION->VAJRA] upstream conflict. [QUESTION->SHROOMING] 還有哪個位置值得重讀？',agents:10,round:8});
const externalReplay=await shroomFeedbackReadingRound({text:'同一段核心材料。 EXTERNAL_CONNECTOR_FEEDBACK | drive_hits=4 | public_web_finding=official evidence | claim_relations=supports',agents:10,round:3});
const tripleReplay=await shroomFeedbackReadingRound({text:'同一段核心材料。 EXTERNAL_CONNECTOR_FEEDBACK | public_web_finding=official evidence | claim_relations=refutes | [CONTRADICTION->VAJRA] upstream conflict. [QUESTION->SHROOMING] 還有哪個位置值得重讀？',agents:10,round:8});

const stanceSet=x=>new Set((x.reactions||[]).map(r=>r.stance));
const allNoClosure=x=>(x.reactions||[]).every(r=>r.closureAuthority==='NONE');
const hasAll=(set,values)=>values.every(v=>set.has(v));
const coverage=x=>x.adaptation?.disagreement?.signalCoverage||{};

if(baseline.status!=='EXECUTED'||baseline.count!==10)failures.push({type:'BASELINE_EXECUTION_FAIL'});
if(baseline.adaptation?.mode!=='BASELINE'||baseline.adaptation?.changedFromBaseline!==false)failures.push({type:'BASELINE_ADAPTATION_UNEXPECTED',adaptation:baseline.adaptation});
if(stanceSet(baseline).size!==1||!stanceSet(baseline).has('OBSERVE'))failures.push({type:'BASELINE_STANCE_NOT_NEUTRAL',stances:[...stanceSet(baseline)]});
if(lexicalNoise.adaptation?.mode!=='BASELINE'||lexicalNoise.adaptation?.changedFromBaseline!==false)failures.push({type:'LEXICAL_NOISE_HIJACKED_CONDITIONING',adaptation:lexicalNoise.adaptation});
if(lexicalNoise.adaptation?.ignoredLexicalMentions?.evidence!==true||lexicalNoise.adaptation?.ignoredLexicalMentions?.contradiction!==true)failures.push({type:'LEXICAL_NOISE_NOT_AUDITED',adaptation:lexicalNoise.adaptation});
if(external.adaptation?.mode!=='EVIDENCE_CONDITIONED'||external.adaptation?.changedFromBaseline!==true)failures.push({type:'EXTERNAL_FEEDBACK_NOT_CONDITIONING',adaptation:external.adaptation});
if(external.reactions?.[0]?.lens!=='evidence')failures.push({type:'EXTERNAL_FEEDBACK_DID_NOT_PRIORITIZE_EVIDENCE',lens:external.reactions?.[0]?.lens});
if(contradiction.adaptation?.mode!=='CONTRADICTION_CONDITIONED'||contradiction.reactions?.[0]?.lens!=='counterexample')failures.push({type:'CONTRADICTION_DID_NOT_PRIORITIZE_COUNTEREXAMPLE',adaptation:contradiction.adaptation,lens:contradiction.reactions?.[0]?.lens});
if(explicitQuestion.adaptation?.mode!=='QUESTION_CONDITIONED'||explicitQuestion.reactions?.[0]?.lens!=='position')failures.push({type:'EXPLICIT_QUESTION_DID_NOT_CONDITION',adaptation:explicitQuestion.adaptation,lens:explicitQuestion.reactions?.[0]?.lens});

if(mixedEvidenceQuestion.adaptation?.mode!=='MIXED_CONDITIONED')failures.push({type:'MIXED_EVIDENCE_QUESTION_NOT_COMPOSED',adaptation:mixedEvidenceQuestion.adaptation});
if(!mixedEvidenceQuestion.adaptation?.activeSignalClasses?.includes('EVIDENCE')||!mixedEvidenceQuestion.adaptation?.activeSignalClasses?.includes('QUESTION'))failures.push({type:'MIXED_EVIDENCE_QUESTION_SIGNAL_LOSS',classes:mixedEvidenceQuestion.adaptation?.activeSignalClasses});
if(mixedEvidenceQuestion.reactions?.[0]?.lens!=='evidence'||mixedEvidenceQuestion.adaptation?.lensOrder?.indexOf('position')<0)failures.push({type:'MIXED_EVIDENCE_QUESTION_PRIORITY_UNEXPECTED',lensOrder:mixedEvidenceQuestion.adaptation?.lensOrder});
if(!hasAll(stanceSet(mixedEvidenceQuestion),['VERIFY','PROPOSE','HOLD_UNRESOLVED','REFRAME']))failures.push({type:'MIXED_EVIDENCE_QUESTION_STANCE_LOSS',stances:[...stanceSet(mixedEvidenceQuestion)]});
if(!coverage(mixedEvidenceQuestion).EVIDENCE?.includes('VERIFY')||!coverage(mixedEvidenceQuestion).QUESTION?.includes('PROPOSE')||!coverage(mixedEvidenceQuestion).QUESTION?.includes('REFRAME'))failures.push({type:'MIXED_EVIDENCE_QUESTION_COVERAGE_AUDIT_FAIL',coverage:coverage(mixedEvidenceQuestion)});

if(mixedContradictionQuestion.adaptation?.mode!=='MIXED_CONDITIONED')failures.push({type:'MIXED_CONTRADICTION_QUESTION_NOT_COMPOSED',adaptation:mixedContradictionQuestion.adaptation});
if(!mixedContradictionQuestion.adaptation?.activeSignalClasses?.includes('CONTRADICTION')||!mixedContradictionQuestion.adaptation?.activeSignalClasses?.includes('QUESTION'))failures.push({type:'MIXED_CONTRADICTION_QUESTION_SIGNAL_LOSS',classes:mixedContradictionQuestion.adaptation?.activeSignalClasses});
if(mixedContradictionQuestion.reactions?.[0]?.lens!=='counterexample'||mixedContradictionQuestion.adaptation?.lensOrder?.indexOf('position')<0)failures.push({type:'MIXED_CONTRADICTION_QUESTION_PRIORITY_UNEXPECTED',lensOrder:mixedContradictionQuestion.adaptation?.lensOrder});
if(!hasAll(stanceSet(mixedContradictionQuestion),['CHALLENGE','PROPOSE','HOLD_UNRESOLVED','REFRAME']))failures.push({type:'MIXED_CONTRADICTION_QUESTION_STANCE_LOSS',stances:[...stanceSet(mixedContradictionQuestion)]});
if(!coverage(mixedContradictionQuestion).CONTRADICTION?.includes('VERIFY')||!coverage(mixedContradictionQuestion).QUESTION?.includes('PROPOSE')||!coverage(mixedContradictionQuestion).QUESTION?.includes('REFRAME'))failures.push({type:'MIXED_CONTRADICTION_QUESTION_COVERAGE_AUDIT_FAIL',coverage:coverage(mixedContradictionQuestion)});

if(tripleMixed.adaptation?.mode!=='MIXED_CONDITIONED'||tripleMixed.adaptation?.activeSignalClasses?.length!==3)failures.push({type:'TRIPLE_MIXED_SIGNAL_LOSS',adaptation:tripleMixed.adaptation});
if(!hasAll(stanceSet(tripleMixed),['CHALLENGE','VERIFY','HOLD_UNRESOLVED','RECONSTRUCT','PROPOSE','REFRAME']))failures.push({type:'TRIPLE_MIXED_STANCE_COMPOSITION_FAIL',stances:[...stanceSet(tripleMixed)]});
if(!coverage(tripleMixed).CONTRADICTION||!coverage(tripleMixed).EVIDENCE||!coverage(tripleMixed).QUESTION)failures.push({type:'TRIPLE_MIXED_COVERAGE_AUDIT_FAIL',coverage:coverage(tripleMixed)});

for(const [name,sample] of Object.entries({external,contradiction,explicitQuestion,mixedEvidenceQuestion,mixedContradictionQuestion,tripleMixed})){
  const stances=stanceSet(sample);
  if(stances.size<3)failures.push({type:'CONDITIONED_STANCE_COLLAPSE',sample:name,stances:[...stances]});
  if(!stances.has('HOLD_UNRESOLVED'))failures.push({type:'UNRESOLVED_HOLD_MISSING',sample:name,stances:[...stances]});
  if(sample.adaptation?.disagreement?.enabled!==true||sample.adaptation?.disagreement?.preservesHold!==true)failures.push({type:'DISAGREEMENT_AUDIT_MISSING',sample:name,disagreement:sample.adaptation?.disagreement});
  if(!allNoClosure(sample))failures.push({type:'REACTION_GAINED_CLOSURE_AUTHORITY',sample:name});
}
if(JSON.stringify(external)!==JSON.stringify(externalReplay))failures.push({type:'DETERMINISTIC_REPLAY_FAIL'});
if(JSON.stringify(tripleMixed)!==JSON.stringify(tripleReplay))failures.push({type:'TRIPLE_MIXED_DETERMINISTIC_REPLAY_FAIL'});
if(external.adaptation?.feedbackFingerprint===baseline.adaptation?.feedbackFingerprint)failures.push({type:'FEEDBACK_FINGERPRINT_NOT_DISTINCT'});
if(external.adaptation?.conditioningBasis!=='STRUCTURED_FEEDBACK_LENS_AND_STANCE_COMPOSITION_WITH_BOUNDED_DISAGREEMENT')failures.push({type:'CONDITIONING_BASIS_NOT_EXPLICIT',basis:external.adaptation?.conditioningBasis});
if(!Array.isArray(tripleMixed.adaptation?.scoreContributions)||tripleMixed.adaptation.scoreContributions.length<6)failures.push({type:'MIXED_SCORE_PROVENANCE_MISSING'});

const summarize=x=>({mode:x.adaptation.mode,firstLens:x.reactions[0].lens,lensOrder:x.adaptation.lensOrder,stances:[...stanceSet(x)],stanceCounts:x.adaptation.disagreement?.stanceCounts,stancePool:x.adaptation.disagreement?.stancePool,signalCoverage:x.adaptation.disagreement?.signalCoverage,feedbackFingerprint:x.adaptation.feedbackFingerprint});
const result={
  schema:'nostromo-shroom-feedback-test/v0.5',
  completedAt:new Date().toISOString(),
  status:failures.length?'FAIL':'PASS',
  baseline:summarize(baseline),
  lexicalNoise:{mode:lexicalNoise.adaptation.mode,firstLens:lexicalNoise.reactions[0].lens,changedFromBaseline:lexicalNoise.adaptation.changedFromBaseline,ignoredLexicalMentions:lexicalNoise.adaptation.ignoredLexicalMentions,stances:[...stanceSet(lexicalNoise)]},
  external:summarize(external),
  contradiction:summarize(contradiction),
  explicitQuestion:summarize(explicitQuestion),
  mixedEvidenceQuestion:summarize(mixedEvidenceQuestion),
  mixedContradictionQuestion:summarize(mixedContradictionQuestion),
  tripleMixed:summarize(tripleMixed),
  deterministicReplay:JSON.stringify(external)===JSON.stringify(externalReplay),
  tripleMixedDeterministicReplay:JSON.stringify(tripleMixed)===JSON.stringify(tripleReplay),
  failures,
  boundary:'PASS demonstrates deterministic structured multi-signal conditioning in both lens ordering and bounded stance composition. Mixed evidence/question, contradiction/question, and triple-signal rounds preserve signal-specific audited positions instead of allowing the first-priority signal to silently erase another signal class; HOLD_UNRESOLVED remains present and every reaction keeps closureAuthority NONE. Ordinary lexical mentions still cannot hijack conditioning. This does not demonstrate semantic learning, belief revision, independent agents, or real social emergence.'
};
await fs.writeFile(resultPath,JSON.stringify(result,null,2)+'\n','utf8');
console.log(JSON.stringify(result,null,2));
if(result.status!=='PASS')process.exitCode=1;
