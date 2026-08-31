// NOSTROMO SHROOMING feedback-conditioned reader v0.1
// Deterministic thickening: upstream metabolic/external feedback can change which lenses are applied first.
import crypto from 'node:crypto';

const compact=(s,n=600)=>String(s??'').replace(/\s+/g,' ').trim().slice(0,n);
const hash=s=>crypto.createHash('sha256').update(String(s)).digest('hex').slice(0,16);
const BASELINE=['structure','counterexample','position','otherness','evidence','language','boundary','memory','use','anomaly'];

function feedbackSignals(text){
  const s=String(text??'');
  return {
    external:/EXTERNAL_CONNECTOR_FEEDBACK|public_web_finding=|drive_hits=|internal_hits=/i.test(s),
    contradiction:/\brefut(?:e|ed|es|ing)\b|contradiction|counterevidence|\[CONTRADICTION->/i.test(s),
    evidence:/\bevidence\b|provenance|source|來源|證據|claim_relations=/i.test(s),
    question:/\?|？|\[QUESTION->SHROOMING\]/i.test(s)
  };
}

function chooseLenses(signals){
  if(signals.contradiction)return ['counterexample','evidence','boundary','structure','position','memory','otherness','language','use','anomaly'];
  if(signals.external||signals.evidence)return ['evidence','boundary','counterexample','structure','memory','position','otherness','language','use','anomaly'];
  if(signals.question)return ['position','boundary','structure','counterexample','evidence','otherness','memory','language','use','anomaly'];
  return [...BASELINE];
}

export async function shroomFeedbackReadingRound({text='',agents=10,round=1}={}){
  const source=compact(text,4000); if(!source)throw new Error('SHROOM_TEXT_REQUIRED');
  const count=Math.max(1,Math.min(20,Number(agents)||10));
  const signals=feedbackSignals(source);
  const lenses=chooseLenses(signals);
  const changedFromBaseline=lenses.some((lens,i)=>lens!==BASELINE[i]);
  const mode=signals.contradiction?'CONTRADICTION_CONDITIONED':(signals.external||signals.evidence)?'EVIDENCE_CONDITIONED':signals.question?'QUESTION_CONDITIONED':'BASELINE';
  const reactions=Array.from({length:count},(_,i)=>({
    agent:`sandbox-${i+1}`,
    lens:lenses[i%lenses.length],
    observation:`以 ${lenses[i%lenses.length]} 位置重讀：${compact(source,180)}`,
    fingerprint:hash(`${round}|${i}|${lenses[i%lenses.length]}|${source}`)
  }));
  return {
    executor:'SHROOMING_FEEDBACK_CONDITIONED_READING',status:'EXECUTED',round,count,
    sourceFingerprint:hash(source),
    adaptation:{mode,signals,lensOrder:lenses,changedFromBaseline,feedbackFingerprint:hash(JSON.stringify(signals))},
    reactions,
    boundary:'LOCAL DETERMINISTIC HEURISTIC READER. UPSTREAM FEEDBACK TAGS/WORDS MAY REORDER INSPECTION LENSES, SO THE SAME READER IS NO LONGER BEHAVIORALLY BLIND TO METABOLIC/EXTERNAL FEEDBACK. THIS IS STRUCTURAL CONDITIONING, NOT SEMANTIC UNDERSTANDING, LEARNED BELIEF CHANGE, OR TEN INDEPENDENT PERSISTENT LLM PROCESSES.'
  };
}
