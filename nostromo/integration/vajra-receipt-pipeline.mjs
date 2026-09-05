// VAJRA canonical receipt pipeline v0.1.2
// Production-facing composition layer for receipt adjudication. It adds bounded
// editorial-bracket and explicit hypothetical/thought-experiment scope containment
// before the verified main ambiguity guard, while restoring raw relation text and
// provenance in every audit/result surface. Parser-limit cases remain visible rather
// than silently masked and are explicitly audited.

import {auditReceiptAmbiguity,applyGuardedHandoffResults} from './vajra-ambiguity-guard.mjs';

const clean=v=>String(v??'').replace(/\s+/g,' ').trim();
const SUPPORT=/(?:\bsupport(?:s|ed|ing)?\b|\bconfirm(?:s|ed|ing)?\b|\bcorroborat(?:e|es|ed|ing)\b|\bconsistent\s+with\b|支持|佐證|印證|吻合|一致)/gi;
const REFUTE=/(?:\brefut(?:e|es|ed|ing)?\b|\bcontradict(?:s|ed|ing)?\b|\boppose(?:s|d)?\b|\bcounterexample\b|\bfalsif(?:y|ies|ied|ying)\b|反駁|反證|否證|矛盾|相反)/gi;
const PAIRS=new Map([['[',']'],['【','】'],['〔','〕']]);
const CLOSE=new Set([...PAIRS.values()]);
const HYPOTHETICAL_MARKER=/\b(?:suppose|assume|assuming|imagine|hypothetically|for\s+the\s+sake\s+of\s+argument|in\s+a\s+thought\s+experiment)\b|(?:假設|假定|姑且假定|設想|假想|思想實驗)/gi;
const SENTENCE_END=/[.!?;；。！？]/;

function receiptKey(r){
  return [clean(r?.targetRef),clean(r?.clauseRef),clean(r?.lens),clean(r?.organ||r?.sourceOrgan),clean(r?.provenance||r?.provenanceFingerprint||r?.sourceFingerprint||r?.fingerprint)].join('|');
}
function relationOf(r){return String(r?.relation||r?.relationToTarget||r?.assessment||'').normalize('NFKC').replace(/\r\n?/g,'\n').trim();}
function maskDirectional(segment,pos='<bracket-pos>',neg='<bracket-neg>'){return segment.replace(SUPPORT,` ${pos} `).replace(REFUTE,` ${neg} `);}

export function maskEditorialBracketPolarity(text,{maxDepth=3,maxSpan=362}={}){
  const input=String(text??'').normalize('NFKC').replace(/\r\n?/g,'\n');
  const ranges=[];
  const stack=[];
  let topStart=-1,topMaxDepth=0,topInvalid=false,parserLimited=false;
  for(let i=0;i<input.length;i++){
    const ch=input[i];
    if(PAIRS.has(ch)){
      if(stack.length===0){topStart=i;topMaxDepth=1;topInvalid=false;}
      stack.push({close:PAIRS.get(ch)});
      topMaxDepth=Math.max(topMaxDepth,stack.length);
      if(topMaxDepth>maxDepth){topInvalid=true;parserLimited=true;}
      continue;
    }
    if(!CLOSE.has(ch))continue;
    if(!stack.length){parserLimited=true;continue;}
    if(ch!==stack[stack.length-1].close){topInvalid=true;parserLimited=true;continue;}
    stack.pop();
    if(stack.length===0&&topStart>=0){
      const segment=input.slice(topStart,i+1);
      const withinBounds=!topInvalid&&segment.length<=maxSpan&&!segment.includes('\n');
      if(withinBounds)ranges.push([topStart,i+1]);
      else parserLimited=true;
      topStart=-1;topMaxDepth=0;topInvalid=false;
    }
  }
  if(stack.length||topStart>=0)parserLimited=true;
  if(!ranges.length)return {text:input,maskedRanges:0,parserLimited};
  let out='',cursor=0;
  for(const [start,end] of ranges){out+=input.slice(cursor,start);out+=maskDirectional(input.slice(start,end));cursor=end;}
  out+=input.slice(cursor);
  return {text:out,maskedRanges:ranges.length,parserLimited};
}

export function maskHypotheticalPolarity(text,{maxSpan=220}={}){
  const input=String(text??'').normalize('NFKC').replace(/\r\n?/g,'\n');
  const ranges=[];
  let parserLimited=false;
  HYPOTHETICAL_MARKER.lastIndex=0;
  for(let match=HYPOTHETICAL_MARKER.exec(input);match;match=HYPOTHETICAL_MARKER.exec(input)){
    const start=match.index;
    if(ranges.some(([a,b])=>start>=a&&start<b))continue;
    let end=input.length;
    for(let i=start;i<input.length;i++){
      if(SENTENCE_END.test(input[i])){end=i+1;break;}
    }
    const segment=input.slice(start,end);
    if(segment.length<=maxSpan&&!segment.includes('\n'))ranges.push([start,end]);
    else parserLimited=true;
  }
  if(!ranges.length)return {text:input,maskedRanges:0,parserLimited};
  let out='',cursor=0;
  for(const [start,end] of ranges){out+=input.slice(cursor,start);out+=maskDirectional(input.slice(start,end),'<hypothetical-pos>','<hypothetical-neg>');cursor=end;}
  out+=input.slice(cursor);
  return {text:out,maskedRanges:ranges.length,parserLimited};
}

function prepare(receipts=[]){
  const originals=new Map();
  const scope=[];
  const prepared=(Array.isArray(receipts)?receipts:[]).map(raw=>{
    const relation=relationOf(raw);
    const bracket=maskEditorialBracketPolarity(relation);
    const hypothetical=maskHypotheticalPolarity(bracket.text);
    const key=receiptKey(raw);
    if(key)originals.set(key,relation);
    scope.push({key,bracketMaskedRanges:bracket.maskedRanges,bracketParserLimited:bracket.parserLimited,hypotheticalMaskedRanges:hypothetical.maskedRanges,hypotheticalParserLimited:hypothetical.parserLimited,relationChanged:hypothetical.text!==relation});
    return {...raw,relation:hypothetical.text,relationToTarget:undefined,assessment:undefined};
  });
  return {prepared,originals,scope};
}

function restoreRawRelations(value,originals){
  if(Array.isArray(value))return value.map(v=>restoreRawRelations(v,originals));
  if(!value||typeof value!=='object')return value;
  const out={};
  for(const [k,v] of Object.entries(value))out[k]=restoreRawRelations(v,originals);
  const key=receiptKey(out);
  if(key&&originals.has(key)&&Object.prototype.hasOwnProperty.call(out,'relation'))out.relation=originals.get(key);
  return out;
}

export function auditVajraReceipts(receipts=[]){
  const {prepared,originals,scope}=prepare(receipts);
  const audit=restoreRawRelations(auditReceiptAmbiguity(prepared),originals);
  return {...audit,receiptPipeline:{version:'0.1.2',status:'CANONICAL_EXEC',scope,closureAuthority:'NONE',boundary:'Bounded balanced single-line [] / 【】 / 〔〕 editorial-bracket spans are masked for lexical polarity classification when nesting depth <=3 and span length <=362. Explicit English/Chinese hypothetical or thought-experiment markers are also sentence-bounded and masked when the span is single-line and <=220 characters, so assumed support/refute wording cannot manufacture unconditional certainty. Raw relation text and provenance are restored. Unsupported bracket or hypothetical parser-limit spans remain visible and are explicitly marked parserLimited. This is deterministic structural containment, not semantic scope parsing, counterfactual reasoning, citation ownership inference, source-independence proof or truth judgment.'}};
}

export function applyVajraReceiptPipeline(vajraResult,receipts=[],engine=globalThis.VajraEngine){
  const {prepared,originals,scope}=prepare(receipts);
  const guarded=restoreRawRelations(applyGuardedHandoffResults(vajraResult,prepared,engine),originals);
  return {...guarded,version:`${guarded.version||'unknown'}+receipt-pipeline-v0.1.2`,receiptPipeline:{version:'0.1.2',status:'CANONICAL_EXEC',scope,closureAuthority:'NONE',boundary:'Canonical VAJRA receipt pathway: editorial-bracket and explicit hypothetical/thought-experiment classification containment compose with the verified branch-scoped ambiguity/conflict guard. Raw relations and provenance remain auditable; parser-limit spans remain unmasked and are explicitly flagged. It cannot certify truth, perform semantic counterfactual reasoning or prove source independence.'}};
}
