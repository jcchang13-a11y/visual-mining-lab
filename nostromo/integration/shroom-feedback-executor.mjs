// NOSTROMO SHROOMING feedback-conditioned reader v0.5
// Deterministic thickening: explicit structured upstream signals compose in both lens priority and stance coverage, while conditioned rounds preserve bounded disagreement instead of collapsing every reader into one stance.
import crypto from 'node:crypto';

const compact=(s,n=600)=>String(s??'').replace(/\s+/g,' ').trim().slice(0,n);
const hash=s=>crypto.createHash('sha256').update(String(s)).digest('hex').slice(0,16);
const BASELINE=['structure','counterexample','position','otherness','evidence','language','boundary','memory','use','anomaly'];
const SIGNAL_STANCES={
  CONTRADICTION:['CHALLENGE','VERIFY','HOLD_UNRESOLVED','RECONSTRUCT'],
  EVIDENCE:['VERIFY','CHALLENGE','HOLD_UNRESOLVED','RECONSTRUCT'],
  QUESTION:['PROPOSE','CHALLENGE','HOLD_UNRESOLVED','REFRAME']
};

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

function activeClasses(signals){
  return [signals.contradiction?'CONTRADICTION':null,(signals.external||signals.evidence)?'EVIDENCE':null,signals.question?'QUESTION':null].filter(Boolean);
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
  const classes=activeClasses(signals);
  if(classes.length>1)return 'MIXED_CONDITIONED';
  if(classes[0]==='CONTRADICTION')return 'CONTRADICTION_CONDITIONED';
  if(classes[0]==='EVIDENCE')return 'EVIDENCE_CONDITIONED';
  if(classes[0]==='QUESTION')return 'QUESTION_CONDITIONED';
  return 'BASELINE';
}

function stancePlan(signals,count){
  const classes=activeClasses(signals);
  if(!classes.length){
    return {stances:Array.from({length:count},()=>({stance:'OBSERVE',closureAuthority:'NONE'})),pool:['OBSERVE'],signalCoverage:{}};
  }
  const pool=[];
  const seen=new Set();
  const coverage=Object.fromEntries(classes.map(c=>[c,[]]));
  const depth=Math.max(...classes.map(c=>SIGNAL_STANCES[c].length));
  for(let i=0;i<depth;i++){
    for(const signalClass of classes){
      const stance=SIGNAL_STANCES[signalClass][i];
      if(!stance)continue;
      coverage[signalClass].push(stance);
      if(!seen.has(stance)){seen.add(stance);pool.push(stance);}
    }
  }
  const stances=Array.from({length:count},(_,i)=>({stance:pool[i%pool.length],closureAuthority:'NONE'}));
  return {stances,pool,signalCoverage:coverage};
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
  const activeSignalClasses=activeClasses(signals);
  const signalFingerprintInput={external:signals.external,contradiction:signals.contradiction,evidence:signals.evidence,question:signals.question,activeSignalClasses};
  const planned=stancePlan(signals,count);
  const stances=planned.stances;
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
      conditioningBasis:'STRUCTURED_FEEDBACK_LENS_AND_STANCE_COMPOSITION_WITH_BOUNDED_DISAGREEMENT',
      lensOrder:lenses,
      lensScores:selected.scores,
      scoreContributions:selected.contributions,
      changedFromBaseline,
      disagreement:{
        enabled:mode!=='BASELINE',
        stanceCounts,
        stancePool:planned.pool,
        signalCoverage:planned.signalCoverage,
        preservesHold:mode==='BASELINE'||Boolean(stanceCounts.HOLD_UNRESOLVED),
        closureAuthority:'NONE',
        basis:'DETERMINISTIC_SIGNAL_AWARE_STANCE_COMPOSITION'
      },
      feedbackFingerprint:hash(JSON.stringify({...signalFingerprintInput,stanceCounts,stancePool:planned.pool,signalCoverage:planned.signalCoverage}))
    },
    reactions,
    boundary:'LOCAL DETERMINISTIC HEURISTIC READER. ONLY EXPLICIT STRUCTURED UPSTREAM MARKERS MAY CONDITION READING. WHEN MULTIPLE STRUCTURED SIGNAL CLASSES CO-OCCUR, BOTH LENS PRIORITIES AND A BOUNDED SIGNAL-AWARE STANCE POOL COMPOSE, SO CONTRADICTION CANNOT SILENTLY ERASE QUESTION-SPECIFIC PROPOSE/REFRAME POSITIONS AND QUESTION CANNOT ERASE EVIDENCE-SPECIFIC VERIFY. CONDITIONED ROUNDS PRESERVE HOLD_UNRESOLVED AND EVERY REACTION KEEPS CLOSURE AUTHORITY NONE. ORDINARY PROSE MENTIONS STILL CANNOT HIJACK CONDITIONING. THIS IS DETERMINISTIC STRUCTURAL DIVERSIFICATION, NOT SEMANTIC UNDERSTANDING, LEARNED BELIEF CHANGE, INDEPENDENT AGENTS, OR REAL SOCIAL EMERGENCE.'
  };
}
