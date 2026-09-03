// NOSTROMO repository-native executors v1.4
import fs from 'node:fs/promises';
import path from 'node:path';
import https from 'node:https';
import http from 'node:http';
import crypto from 'node:crypto';

const ROOT=process.cwd();
const compact=(s,n=600)=>String(s??'').replace(/\s+/g,' ').trim().slice(0,n);
const hash=s=>crypto.createHash('sha256').update(String(s)).digest('hex').slice(0,16);
const stableJSON=v=>JSON.stringify(v&&typeof v==='object'?v:{} ,Object.keys(v&&typeof v==='object'?v:{}).sort());

export async function shroomSandboxReadingRound({text='',agents=10,round=1}={}){
  const source=compact(text,4000); if(!source) throw new Error('SHROOM_TEXT_REQUIRED');
  const lenses=['structure','counterexample','position','otherness','evidence','language','boundary','memory','use','anomaly'];
  const count=Math.max(1,Math.min(20,Number(agents)||10));
  const reactions=Array.from({length:count},(_,i)=>({agent:`sandbox-${i+1}`,lens:lenses[i%lenses.length],observation:`以 ${lenses[i%lenses.length]} 位置重讀：${compact(source,180)}`,fingerprint:hash(`${round}|${i}|${source}`)}));
  return {executor:'SHROOMING_SANDBOX_READING',status:'EXECUTED',round,count,boundary:'LOCAL DETERMINISTIC SANDBOX; DOES NOT MODIFY OR CLAIM TO BE THE LIVE SHROOMING POPULATION',sourceFingerprint:hash(source),reactions};
}

export async function shroomGreenhousePoseQuestion({question='',statePath='greenhouse/r101-r110-open-social-ontology.json'}={}){
  const q=compact(question,1200); if(!q)throw new Error('SHROOM_QUESTION_REQUIRED');
  const full=path.join(ROOT,statePath);
  const state=JSON.parse(await fs.readFile(full,'utf8'));
  const events=Array.isArray(state.events)?state.events:[];
  if(!events.length)throw new Error('SHROOM_GREENHOUSE_EVENTS_MISSING');
  const ids=['01','02','03','04','05','06','07','08','09','10'];
  const lenses=['scope','counterexample','subject-form','construction','silence-boundary','coordination','anti-fixation','dissent','provenance','belief-action'];
  const reactions=ids.map((id,i)=>{
    const appearances=events.filter(e=>(e.participants||[]).includes(id)||(e.silent||[]).includes(id));
    const latest=appearances.at(-1)||events.at(-1);
    const mode=(latest.silent||[]).includes(id)?'silent':'participant';
    return {
      trace:id,
      mode,
      lens:lenses[i],
      sourceRound:latest.round||null,
      sourceEvent:latest.event||null,
      observation:`以歷史 trace ${id} 的最近可驗證位置（${latest.round||'?'} / ${latest.event||'unknown'} / ${mode}）對問題做 ${lenses[i]} 探針：${q}`,
      provenanceFingerprint:hash(`${id}|${latest.round}|${latest.event}|${latest.summary}`)
    };
  });
  return {
    executor:'SHROOMING_GREENHOUSE_QUESTION_PROBE',
    status:'EXECUTED',
    source:statePath,
    sourceVersion:state.version||null,
    sourceRounds:state.rounds||null,
    count:reactions.length,
    questionFingerprint:hash(q),
    reactions,
    boundary:'EXECUTES A NON-STATE-MUTATING QUESTION PROBE AGAINST THE LATEST PUBLISHED GREENHOUSE HISTORY. REACTIONS ARE TRACEABLE TRANSFORMATIONS OF RECORDED HISTORY, NOT CLAIMS OF TEN INDEPENDENT LIVE LLM PROCESSES, AND DO NOT ADVANCE THE FORMAL SHROOMING ROUND.'
  };
}

function parentFromState(state){
  if(Array.isArray(state.events)&&state.events.length){
    const last=state.events.at(-1);
    return {round:last.round,event:last.event||null,summary:last.summary||'',version:state.version||null,continuity:state.rounds||null,legacyBundle:true};
  }
  if(state&&state.round){
    return {round:state.round,event:state.event||null,summary:state.summary||'',version:state.version||null,continuity:state.continuity||state.round,legacyBundle:false};
  }
  throw new Error('SHROOM_PARENT_ROUND_MISSING');
}

export async function shroomAdvanceGreenhouseRound({task='',statePath='greenhouse/r101-r110-open-social-ontology.json',expectedSourceBlobSha=null,intervention={},event=null}={}){
  const t=compact(task,1600); if(!t)throw new Error('SHROOM_ROUND_TASK_REQUIRED');
  const full=path.join(ROOT,statePath);
  const raw=await fs.readFile(full,'utf8');
  const state=JSON.parse(raw);
  const parent=parentFromState(state);
  const m=String(parent.round||'').match(/R(\d+)/); if(!m)throw new Error('SHROOM_LAST_ROUND_UNPARSEABLE');
  const next=`R${Number(m[1])+1}`;
  const iv=intervention&&typeof intervention==='object'?intervention:{};
  const ivSig=stableJSON(iv);
  const hasIntervention=Object.keys(iv).length>0;
  const ids=['01','02','03','04','05','06','07','08','09','10'];
  const legacyMode=parent.legacyBundle&&!hasIntervention;
  const participants=ids.filter(id=>{
    const input=legacyMode?`${t}|${id}`:`${t}|${ivSig}|${id}`;
    return parseInt(crypto.createHash('sha256').update(input).digest('hex').slice(0,8),16)%3!==0;
  });
  const silent=ids.filter(id=>!participants.includes(id));
  const provenanceFingerprint=legacyMode
    ? hash(`${state.version}|${state.rounds}|${parent.event}|${t}`)
    : hash(`${parent.round}|${parent.version}|${parent.event}|${expectedSourceBlobSha||''}|${t}|${ivSig}`);
  const eventName=compact(event,160)||((iv.memoryAccess||iv.memory_access)?'Memory-access rotation':'Asymmetric memory split');
  const summary=legacyMode
    ? `在部分記憶與衝突任務條件下，${participants.join('、')} 進入本輪可見互動，${silent.join('、')} 保持不可見／沉默。觀測重點不是把這些 trace 固定成人格，而是檢查 R110 後的 subject-form 是否因資訊不對稱重新組合。`
    : `承接 ${parent.round}，在保持任務條件可追溯的前提下施加 ${iv.memoryAccess||iv.memory_access||'asymmetric access'}；${participants.join('、')} 進入本輪可見互動，${silent.join('、')} 保持不可見／沉默。觀測重點仍是 subject-form 是否因可見資訊配置而重新組合，而不是把 trace 固定成人格。`;
  return {
    executor:'SHROOMING_FORMAL_ROUND_ADVANCE',status:'EXECUTED',round:next,previousRound:parent.round,
    source:statePath,expectedSourceBlobSha,task:t,intervention:iv,participants,silent,
    event:eventName,summary,provenanceFingerprint,
    compatibility:legacyMode?'LEGACY_V0_8_REPRODUCIBLE':'CHAIN_V0_9',
    boundary:'CHAINABLE FORMAL REPOSITORY STATE ADVANCE FROM THE DECLARED PARENT ROUND. LEGACY V0.8 BUNDLE INPUT REMAINS REPRODUCIBLE. THIS IS A SINGLE-MODEL / DETERMINISTIC EXPERIMENTAL TRANSITION, NOT TEN INDEPENDENT PERSISTENT LLM PROCESSES. IT MUST BE WRITTEN AS A NEW HISTORY FILE; OLD ROUNDS ARE NEVER OVERWRITTEN.'
  };
}

export async function shroomParentSensitiveControl({task='',statePath,expectedSourceBlobSha=null,intervention={}}={}){
  const t=compact(task,1600); if(!t)throw new Error('SHROOM_PARENT_CONTROL_TASK_REQUIRED');
  if(!statePath)throw new Error('SHROOM_PARENT_CONTROL_STATE_REQUIRED');
  const raw=await fs.readFile(path.join(ROOT,statePath),'utf8');
  const state=JSON.parse(raw);
  const parent=parentFromState(state);
  const m=String(parent.round||'').match(/R(\d+)/); if(!m)throw new Error('SHROOM_PARENT_CONTROL_ROUND_UNPARSEABLE');
  const parentOrdinal=Number(m[1]);
  const iv=intervention&&typeof intervention==='object'?intervention:{};
  const ivSig=stableJSON(iv);
  const conditionOffset=parseInt(crypto.createHash('sha256').update(`${t}|${ivSig}`).digest('hex').slice(0,8),16)%3;
  const ids=['01','02','03','04','05','06','07','08','09','10'];
  const participants=ids.filter((id,i)=>(i+parentOrdinal+conditionOffset)%3!==0);
  const silent=ids.filter(id=>!participants.includes(id));
  return {
    executor:'SHROOMING_PARENT_SENSITIVE_CONTROL',status:'EXECUTED',parentRound:parent.round,source:statePath,
    expectedSourceBlobSha,task:t,intervention:iv,participants,silent,
    transitionFingerprint:hash(`${parent.round}|${expectedSourceBlobSha||''}|${t}|${ivSig}|${participants.join(',')}`),
    model:'EXPERIMENTAL_PARENT_SENSITIVE_V1',
    boundary:'ISOLATED COUNTERFACTUAL CONTROL BRANCH ONLY. UNLIKE THE FORMAL V0.9 BASELINE, PARTICIPANT SELECTION EXPLICITLY INCLUDES PARENT ROUND ORDINAL. THIS EXECUTOR DOES NOT WRITE OR ADVANCE FORMAL GREENHOUSE HISTORY AND MUST NOT BE CITED AS EVIDENCE THAT REAL SHROOMING HISTORY IS CAUSALLY PATH-DEPENDENT.'
  };
}

async function walk(dir,out=[]){for(const e of await fs.readdir(dir,{withFileTypes:true})){if(['.git','node_modules'].includes(e.name))continue;const p=path.join(dir,e.name);if(e.isDirectory())await walk(p,out);else if(/\.(md|txt|json|js|mjs|html)$/i.test(e.name))out.push(p);}return out;}
function sourceFamily(rel){const parts=String(rel).split(/[\\/]+/).filter(Boolean);if(parts[0]==='nostromo'&&parts[1])return `nostromo/${parts[1]}`;return parts[0]||'root';}
function occurrenceStarts(text,q){const out=[];let from=0;while(true){const i=text.indexOf(q,from);if(i<0)break;out.push(i);from=i+Math.max(1,q.length);}return out;}
function countOccurrences(text,q){return occurrenceStarts(text,q).length;}
function boundedOccurrenceWindows(starts,{maxWindows=4,minGap=320}={}){const selected=[];for(const [ordinal,i] of starts.entries()){if(selected.length>=maxWindows)break;if(!selected.length||i-selected.at(-1).index>=minGap)selected.push({index:i,occurrenceOrdinal:ordinal+1});}return selected;}
function normalizeCandidateText(text){return String(text??'').normalize('NFKC').toLowerCase().replace(/\b\d{4}-\d{2}-\d{2}t\d{2}:\d{2}:\d{2}(?:\.\d+)?z?\b/gi,'<timestamp>').replace(/\b[0-9a-f]{8,64}\b/gi,'<hex>').replace(/\b\d{6,}\b/g,'<num>').replace(/[\p{P}\p{S}\s]+/gu,' ').trim();}
export function mutherCandidateFingerprint(text){return hash(normalizeCandidateText(text));}
function shingleSet(text,width=5){const normalized=normalizeCandidateText(text).replace(/\s+/g,' ');if(!normalized)return new Set();if(normalized.length<=width)return new Set([normalized]);const out=new Set();for(let i=0;i<=normalized.length-width;i++)out.add(normalized.slice(i,i+width));return out;}
export function mutherCandidateSimilarity(a,b){const A=shingleSet(a),B=shingleSet(b);if(!A.size&&!B.size)return 1;if(!A.size||!B.size)return 0;let intersection=0;for(const token of A)if(B.has(token))intersection++;return intersection/(A.size+B.size-intersection);}
function suppressNearDuplicates(candidates,threshold=0.88){const kept=[],audit=[];let nearDuplicateSuppressedCount=0;for(const candidate of candidates){let match=null;for(const prior of kept){const similarity=mutherCandidateSimilarity(candidate.snippet,prior.snippet);if(similarity>=threshold){match={prior,similarity};break;}}if(match){nearDuplicateSuppressedCount++;if(audit.length<24)audit.push({suppressedPath:candidate.path,suppressedOccurrenceOrdinal:candidate.occurrenceOrdinal||null,keptPath:match.prior.path,keptOccurrenceOrdinal:match.prior.occurrenceOrdinal||null,similarity:Number(match.similarity.toFixed(4)),suppressedFingerprint:candidate.contentFingerprint,keptFingerprint:match.prior.contentFingerprint,suppressedSourceFamily:candidate.sourceFamily,keptSourceFamily:match.prior.sourceFamily});continue;}kept.push(candidate);}return {kept,nearDuplicateSuppressedCount,audit};}
function selectFamilyBalanced(candidates,limit){
  const groups=new Map();for(const c of candidates){if(!groups.has(c.sourceFamily))groups.set(c.sourceFamily,[]);groups.get(c.sourceFamily).push(c);}
  for(const arr of groups.values())arr.sort((a,b)=>b.queryOccurrenceCount-a.queryOccurrenceCount||a.path.localeCompare(b.path)||(a.occurrenceOrdinal||0)-(b.occurrenceOrdinal||0));
  const families=[...groups.keys()].sort();const selected=[];let cursor=0;
  while(selected.length<limit&&families.length){const family=families[cursor%families.length],arr=groups.get(family);if(arr?.length)selected.push(arr.shift());if(!arr?.length){const idx=families.indexOf(family);families.splice(idx,1);if(!families.length)break;cursor=cursor%families.length;}else cursor=(cursor+1)%families.length;}
  return selected;
}
export async function mutherMineRepo({query='',limit=12,nearDuplicateThreshold=0.88,maxWindowsPerFile=4,minWindowGap=320}={}){
  const q=compact(query,200).toLowerCase(); if(!q)throw new Error('MUTHER_QUERY_REQUIRED');
  const windowLimit=Math.max(1,Math.min(8,Number(maxWindowsPerFile)||4));
  const gap=Math.max(120,Math.min(2000,Number(minWindowGap)||320));
  const files=await walk(ROOT); const candidates=[];let filesWithMultipleOccurrences=0;let totalQueryOccurrences=0;
  for(const file of files){
    let text;try{text=await fs.readFile(file,'utf8')}catch{continue}
    const lower=text.toLowerCase(),starts=occurrenceStarts(lower,q);if(!starts.length)continue;
    totalQueryOccurrences+=starts.length;if(starts.length>1)filesWithMultipleOccurrences++;
    const rel=path.relative(ROOT,file),windows=boundedOccurrenceWindows(starts,{maxWindows:windowLimit,minGap:gap});
    windows.forEach(window=>{
      const idx=window.index;
      const snippet=compact(text.slice(Math.max(0,idx-180),idx+q.length+420),600);
      candidates.push({path:rel,snippet,sourceFamily:sourceFamily(rel),queryOccurrenceCount:starts.length,occurrenceOrdinal:window.occurrenceOrdinal,occurrenceIndex:idx,contentFingerprint:mutherCandidateFingerprint(snippet)});
    });
  }
  candidates.sort((a,b)=>b.queryOccurrenceCount-a.queryOccurrenceCount||a.path.localeCompare(b.path)||(a.occurrenceOrdinal||0)-(b.occurrenceOrdinal||0));
  const seen=new Map(),exactDistinct=[],exactDuplicateAudit=[];let duplicateSuppressedCount=0;
  for(const c of candidates){
    const prior=seen.get(c.contentFingerprint);
    if(prior){
      duplicateSuppressedCount++;
      if(exactDuplicateAudit.length<24)exactDuplicateAudit.push({suppressedPath:c.path,suppressedOccurrenceOrdinal:c.occurrenceOrdinal||null,suppressedOccurrenceIndex:Number.isFinite(c.occurrenceIndex)?c.occurrenceIndex:null,suppressedSourceFamily:c.sourceFamily,keptPath:prior.path,keptOccurrenceOrdinal:prior.occurrenceOrdinal||null,keptOccurrenceIndex:Number.isFinite(prior.occurrenceIndex)?prior.occurrenceIndex:null,keptSourceFamily:prior.sourceFamily,contentFingerprint:c.contentFingerprint,crossFamily:c.sourceFamily!==prior.sourceFamily});
      continue;
    }
    seen.set(c.contentFingerprint,c);exactDistinct.push(c);
  }
  const threshold=Math.max(0.75,Math.min(0.99,Number(nearDuplicateThreshold)||0.88));
  const near=suppressNearDuplicates(exactDistinct,threshold);
  const bounded=Math.max(1,Math.min(50,Number(limit)||12));
  const hits=selectFamilyBalanced(near.kept,bounded);
  return {executor:'MUTHER_REPOSITORY_MINE',status:'EXECUTED',query:q,hitCount:hits.length,candidateHitCount:candidates.length,occurrenceWindowCandidateCount:candidates.length,totalQueryOccurrences,filesWithMultipleOccurrences,maxWindowsPerFile:windowLimit,minWindowGap:gap,distinctCandidateCount:exactDistinct.length,lexicallyDistinctCandidateCount:near.kept.length,duplicateSuppressedCount,exactDuplicateAudit,exactDuplicateCrossFamilyCount:exactDuplicateAudit.filter(x=>x.crossFamily).length,nearDuplicateSuppressedCount:near.nearDuplicateSuppressedCount,nearDuplicateThreshold:threshold,nearDuplicateAudit:near.audit,sourceFamilyCount:new Set(candidates.map(x=>x.sourceFamily)).size,selectedSourceFamilies:[...new Set(hits.map(x=>x.sourceFamily))],selectedDistinctFileCount:new Set(hits.map(x=>x.path)).size,selection:'BOUNDED_MULTI_WINDOW_EXTRACTION_PLUS_SUPERFICIAL_EXACT_DUPLICATE_SUPPRESSION_WITH_PROVENANCE_AUDIT_PLUS_LEXICAL_NEAR_DUPLICATE_SUPPRESSION_PLUS_SOURCE_FAMILY_ROUND_ROBIN',boundary:'MINES THIS GITHUB REPOSITORY ONLY. EACH MATCHING FILE MAY CONTRIBUTE A BOUNDED NUMBER OF SEPARATED QUERY WINDOWS BEFORE DEDUPLICATION, REDUCING FIRST-HIT BLINDNESS WHEN ONE FILE CONTAINS MULTIPLE DISTINCT LOCAL CONTEXTS. OCCURRENCE ORDINALS REFER TO THE TRUE QUERY OCCURRENCE IN THE SOURCE FILE EVEN WHEN NEARBY OCCURRENCES ARE SKIPPED BY THE WINDOW-GAP GUARD. EXACT CONTENT REPLAY IS STILL COUNTED ONCE AS MATERIAL, BUT SUPPRESSED COPIES NOW RETAIN A BOUNDED SOURCE-PATH / SOURCE-FAMILY / TRUE-OCCURRENCE PROVENANCE AUDIT INSTEAD OF DISAPPEARING INTO A COUNT; CROSS-FAMILY COPIES ARE NOT UPGRADED TO INDEPENDENT EVIDENCE. CANDIDATE DEDUPLICATION NORMALIZES SUPERFICIAL FORMAT, VOLATILE TIMESTAMPS AND LONG IDENTIFIERS, THEN APPLIES A CONSERVATIVE CHARACTER-SHINGLE OVERLAP GUARD BEFORE ROUND-ROBIN SELECTION ACROSS PATH-BASED SOURCE FAMILIES. THIS IS BOUNDED LEXICAL/STRUCTURAL VEIN COVERAGE, NOT SEMANTIC VEIN DETECTION, EXHAUSTIVE WITHIN-FILE COVERAGE, SEMANTIC IDENTITY, SOURCE-INDEPENDENCE PROOF, SOURCE-QUALITY JUDGMENT, NOVELTY PROOF, TRUTH JUDGMENT, OR GOOGLE DRIVE COVERAGE.',hits};
}

function probe(url,timeoutMs=8000){return new Promise((resolve,reject)=>{const u=new URL(url);const lib=u.protocol==='https:'?https:http;const req=lib.request(u,{method:'GET',headers:{'User-Agent':'NOSTROMO-DROPLET/1.0'}},res=>{let bytes=0;res.on('data',c=>{bytes+=c.length;if(bytes>65536)req.destroy()});res.on('end',()=>resolve({statusCode:res.statusCode||0,contentType:res.headers['content-type']||null,bytesSampled:bytes,finalUrl:url}));res.on('close',()=>resolve({statusCode:res.statusCode||0,contentType:res.headers['content-type']||null,bytesSampled:bytes,finalUrl:url}));});req.setTimeout(timeoutMs,()=>req.destroy(new Error('TIMEOUT')));req.on('error',reject);req.end();});}
export async function dropletVerifyUrl({url}={}){if(!/^https?:\/\//i.test(String(url||'')))throw new Error('DROPLET_URL_REQUIRED');const r=await probe(url);return {executor:'DROPLET_URL_VERIFY',status:r.statusCode>=200&&r.statusCode<400?'EXECUTED':'FAILED',boundary:'VERIFIES AN EXPLICIT URL ONLY; DOES NOT CLAIM SEARCH-ENGINE DISCOVERY',...r};}
