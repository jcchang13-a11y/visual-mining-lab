// NOSTROMO SHROOMING feedback-conditioned reader v0.2
// Deterministic thickening: only explicit upstream feedback markers may reorder feedback-sensitive lenses.
import crypto from 'node:crypto';

const compact=(s,n=600)=>String(s??'').replace(/\s+/g,' ').trim().slice(0,n);
const hash=s=>crypto.createHash('sha256').update(String(s)).digest('hex').slice(0,16);
const BASELINE=['structure','counterexample','position','otherness','evidence','language','boundary','memory','use','anomaly'];

function feedbackSignals(text){
  const s=String(text??'');
  const structured={
    external:/EXTERNAL_CONNECTOR_FEEDBACK|public_web_finding\s*=|drive_hits\s*=|internal_hits\s*=|claim_relations\s*=/i.test(s),
    contradiction:/\[CONTRADICTION->[^\]]+\]|\bCONTRADICTION_CONDITIONED\b|claim_relations\s*=\s*[^|\n]*(?:refut|contradict|counter)/i.test(s),
    evidence:/\[EVIDENCE_OR_PROVENANCE->[^\]]+\]|EXTERNAL_CONNECTOR_FEEDBACK|public_web_finding\s*=|claim_relations\s*=/i.test(s),
    question:/\[QUESTION->SHROOMING\]/i.test(s)
  };
  const lexicalMentions={
    contradiction:/\brefut(?:e|ed|es|ing)\b|\bcontradiction\b|\bcounterevidence\b|矛盾|反證|反例/i.test(s),
    evidence:/\bevidence\b|\bprovenance\b|\bsource\b|來源|證據/i.test(s),
    question:/\?|？/.test(s)
  };
  return {
    ...structured,
    lexicalMentions,
    ignoredLexicalMentions:{
      contradiction:lexicalMentions.contradiction&&!structured.contradiction,
      evidence:lexicalMentions.evidence&&!structured.evidence,
      question:lexicalMentions.question&&!structured.question
    }
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
  const signalFingerprintInput={external:signals.external,contradiction:signals.contradiction,evidence:signals.evidence,question:signals.question};
  const reactions=Array.from({length:count},(_,i)=>({
    agent:`sandbox-${i+1}`,
    lens:lenses[i%lenses.length],
    observation:`以 ${lenses[i%lenses.length]} 位置重讀：${compact(source,180)}`,
    fingerprint:hash(`${round}|${i}|${lenses[i%lenses.length]}|${source}`)
  }));
  return {
    executor:'SHROOMING_FEEDBACK_CONDITIONED_READING',status:'EXECUTED',round,count,
    sourceFingerprint:hash(source),
    adaptation:{
      mode,
      signals:{external:signals.external,contradiction:signals.contradiction,evidence:signals.evidence,question:signals.question},
      lexicalMentions:signals.lexicalMentions,
      ignoredLexicalMentions:signals.ignoredLexicalMentions,
      conditioningBasis:'STRUCTURED_FEEDBACK_ONLY',
      lensOrder:lenses,
      changedFromBaseline,
      feedbackFingerprint:hash(JSON.stringify(signalFingerprintInput))
    },
    reactions,
    boundary:'LOCAL DETERMINISTIC HEURISTIC READER. ONLY EXPLICIT STRUCTURED UPSTREAM MARKERS MAY REORDER FEEDBACK-SENSITIVE LENSES; ORDINARY PROSE THAT MERELY MENTIONS EVIDENCE, SOURCE, CONTRADICTION OR COUNTEREVIDENCE IS AUDITED BUT CANNOT BY ITSELF HIJACK FEEDBACK CONDITIONING. THIS REDUCES LEXICAL FEEDBACK CONTAMINATION. IT IS STRUCTURAL CONDITIONING, NOT SEMANTIC UNDERSTANDING, LEARNED BELIEF CHANGE, OR TEN INDEPENDENT PERSISTENT LLM PROCESSES.'
  };
}
