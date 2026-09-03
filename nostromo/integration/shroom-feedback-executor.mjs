// NOSTROMO SHROOMING feedback-conditioned reader v0.3
// Deterministic thickening: explicit structured upstream signals compose instead of collapsing to one precedence branch.
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
  const scores=new Map(BASELINE.map((lens,i)=>[lens,(BASELINE.length-i)/100]));
  const contributions=[];
  const add=(signal,lens,weight)=>{scores.set(lens,(scores.get(lens)||0)+weight);contributions.push({signal,lens,weight});};
  if(signals.contradiction){add('contradiction','counterexample',6);add('contradiction','evidence',3);add('contradiction','boundary',2);add('contradiction','structure',1);}
  if(signals.external||signals.evidence){add('evidence','evidence',6);add('evidence','boundary',3);add('evidence','counterexample',2);add('evidence','memory',1);}
  if(signals.question){add('question','position',5);add('question','boundary',3);add('question','structure',2);add('question','counterexample',1);}
  const order=[...BASELINE].sort((a,b)=>(scores.get(b)-scores.get(a))||(BASELINE.indexOf(a)-BASELINE.indexOf(b)));
  return {order,scores:Object.fromEntries(BASELINE.map(l=>[l,Number(scores.get(l).toFixed(2))])),contributions};
}

function adaptationMode(signals){
  const classes=[];
  if(signals.contradiction)classes.push('CONTRADICTION');
  if(signals.external||signals.evidence)classes.push('EVIDENCE');
  if(signals.question)classes.push('QUESTION');
  if(classes.length>1)return 'MIXED_CONDITIONED';
  if(classes[0]==='CONTRADICTION')return 'CONTRADICTION_CONDITIONED';
  if(classes[0]==='EVIDENCE')return 'EVIDENCE_CONDITIONED';
  if(classes[0]==='QUESTION')return 'QUESTION_CONDITIONED';
  return 'BASELINE';
}

export async function shroomFeedbackReadingRound({text='',agents=10,round=1}={}){
  const source=compact(text,4000); if(!source)throw new Error('SHROOM_TEXT_REQUIRED');
  const count=Math.max(1,Math.min(20,Number(agents)||10));
  const signals=feedbackSignals(source);
  const selected=chooseLenses(signals);
  const lenses=selected.order;
  const changedFromBaseline=lenses.some((lens,i)=>lens!==BASELINE[i]);
  const mode=adaptationMode(signals);
  const activeSignalClasses=[signals.contradiction?'CONTRADICTION':null,(signals.external||signals.evidence)?'EVIDENCE':null,signals.question?'QUESTION':null].filter(Boolean);
  const signalFingerprintInput={external:signals.external,contradiction:signals.contradiction,evidence:signals.evidence,question:signals.question,activeSignalClasses};
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
      activeSignalClasses,
      lexicalMentions:signals.lexicalMentions,
      ignoredLexicalMentions:signals.ignoredLexicalMentions,
      conditioningBasis:'STRUCTURED_FEEDBACK_COMPOSITION',
      lensOrder:lenses,
      lensScores:selected.scores,
      scoreContributions:selected.contributions,
      changedFromBaseline,
      feedbackFingerprint:hash(JSON.stringify(signalFingerprintInput))
    },
    reactions,
    boundary:'LOCAL DETERMINISTIC HEURISTIC READER. ONLY EXPLICIT STRUCTURED UPSTREAM MARKERS MAY CONDITION READING. WHEN MULTIPLE STRUCTURED SIGNAL CLASSES CO-OCCUR, THEIR BOUNDED LENS PRIORITIES COMPOSE INSTEAD OF ONE SIGNAL SILENTLY OVERRIDING THE OTHERS; ORDINARY PROSE MENTIONS REMAIN AUDITED BUT CANNOT HIJACK CONDITIONING. THIS IS STRUCTURAL MULTI-SIGNAL PRIORITIZATION, NOT SEMANTIC UNDERSTANDING, LEARNED BELIEF CHANGE, OR TEN INDEPENDENT PERSISTENT LLM PROCESSES.'
  };
}
