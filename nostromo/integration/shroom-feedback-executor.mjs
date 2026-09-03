// NOSTROMO SHROOMING feedback-conditioned reader v0.4
// Deterministic thickening: explicit structured upstream signals compose, while conditioned rounds preserve bounded disagreement instead of collapsing every reader into one stance.
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

function stancePlan(signals,count){
  const conditioned=Boolean(signals.contradiction||signals.external||signals.evidence||signals.question);
  if(!conditioned)return Array.from({length:count},()=>({stance:'OBSERVE',closureAuthority:'NONE'}));
  const cycle=signals.contradiction
    ? ['CHALLENGE','VERIFY','HOLD_UNRESOLVED','RECONSTRUCT']
    : signals.question
      ? ['PROPOSE','CHALLENGE','HOLD_UNRESOLVED','REFRAME']
      : ['VERIFY','CHALLENGE','HOLD_UNRESOLVED','RECONSTRUCT'];
  return Array.from({length:count},(_,i)=>({stance:cycle[i%cycle.length],closureAuthority:'NONE'}));
}

function stanceInstruction(stance){
  if(stance==='CHALLENGE')return '優先找能破壞目前讀法的條件，不把上游訊號當結論。';
  if(stance==='VERIFY')return '優先核對支持鏈與來源邊界，不把重複材料當新增證據。';
  if(stance==='HOLD_UNRESOLVED')return '保留尚未解決的衝突，不替系統提前收束。';
  if(stance==='RECONSTRUCT')return '在保留來源與反例後，嘗試重組一個可再檢驗的版本。';
  if(stance==='PROPOSE')return '提出一個可被其他位置反駁或修正的暫定回答。';
  if(stance==='REFRAME')return '改變問題切面，但不取消原問題與其來源。';
  return '只觀察材料結構，不增加額外結論。';
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
  const stances=stancePlan(signals,count);
  const stanceCounts={};
  for(const item of stances)stanceCounts[item.stance]=(stanceCounts[item.stance]||0)+1;
  const reactions=Array.from({length:count},(_,i)=>({
    agent:`sandbox-${i+1}`,
    lens:lenses[i%lenses.length],
    stance:stances[i].stance,
    closureAuthority:stances[i].closureAuthority,
    observation:`以 ${lenses[i%lenses.length]} 位置重讀；${stanceInstruction(stances[i].stance)} 材料：${compact(source,180)}`,
    fingerprint:hash(`${round}|${i}|${lenses[i%lenses.length]}|${stances[i].stance}|${source}`)
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
      conditioningBasis:'STRUCTURED_FEEDBACK_COMPOSITION_WITH_BOUNDED_DISAGREEMENT',
      lensOrder:lenses,
      lensScores:selected.scores,
      scoreContributions:selected.contributions,
      changedFromBaseline,
      disagreement:{
        enabled:mode!=='BASELINE',
        stanceCounts,
        preservesHold:mode==='BASELINE'||Boolean(stanceCounts.HOLD_UNRESOLVED),
        closureAuthority:'NONE',
        basis:'DETERMINISTIC_STANCE_DIVERSIFICATION'
      },
      feedbackFingerprint:hash(JSON.stringify({...signalFingerprintInput,stanceCounts}))
    },
    reactions,
    boundary:'LOCAL DETERMINISTIC HEURISTIC READER. ONLY EXPLICIT STRUCTURED UPSTREAM MARKERS MAY CONDITION READING. WHEN MULTIPLE STRUCTURED SIGNAL CLASSES CO-OCCUR, THEIR BOUNDED LENS PRIORITIES COMPOSE. CONDITIONED ROUNDS ALSO PRESERVE A BOUNDED MIX OF VERIFY/CHALLENGE/HOLD/RECONSTRUCT OR PROPOSE/REFRAME STANCES SO ONE UPSTREAM SIGNAL CANNOT TURN ALL TEN TRACES INTO THE SAME CLOSURE-SEEKING REACTION. HOLD_UNRESOLVED HAS NO CLOSURE AUTHORITY AND ORDINARY PROSE MENTIONS STILL CANNOT HIJACK CONDITIONING. THIS IS DETERMINISTIC STRUCTURAL DIVERSIFICATION, NOT SEMANTIC UNDERSTANDING, LEARNED BELIEF CHANGE, INDEPENDENT AGENTS, OR REAL SOCIAL EMERGENCE.'
  };
}
