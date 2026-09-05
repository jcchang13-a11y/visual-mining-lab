// VAJRA canonical receipt pipeline v0.1.0
// Production-facing composition layer for receipt adjudication. It adds bounded
// square/editorial-bracket scope containment before the verified main ambiguity guard,
// while restoring raw relation text and provenance in every audit/result surface.
// Parser-limit cases remain visible rather than silently masked.

import {auditReceiptAmbiguity,applyGuardedHandoffResults} from './vajra-ambiguity-guard.mjs';

const clean=v=>String(v??'').replace(/\s+/g,' ').trim();
const SUPPORT=/(?:\bsupport(?:s|ed|ing)?\b|\bconfirm(?:s|ed|ing)?\b|\bcorroborat(?:e|es|ed|ing)\b|\bconsistent\s+with\b|支持|佐證|印證|吻合|一致)/gi;
const REFUTE=/(?:\brefut(?:e|es|ed|ing)?\b|\bcontradict(?:s|ed|ing)?\b|\boppose(?:s|d)?\b|\bcounterexample\b|\bfalsif(?:y|ies|ied|ying)\b|反駁|反證|否證|矛盾|相反)/gi;
const PAIRS=new Map([['[',']'],['【','】'],['〔','〕']]);
const CLOSE=new Set([...PAIRS.values()]);

function receiptKey(r){
  return [clean(r?.targetRef),clean(r?.clauseRef),clean(r?.lens),clean(r?.organ||r?.sourceOrgan),clean(r?.provenance||r?.provenanceFingerprint||r?.sourceFingerprint||r?.fingerprint)].join('|');
}
function relationOf(r){return String(r?.relation||r?.relationToTarget||r?.assessment||'').normalize('NFKC').replace(/\r\n?/g,'\n').trim();}
function maskDirectional(segment){return segment.replace(SUPPORT,' <bracket-pos> ').replace(REFUTE,' <bracket-neg> ');}

export function maskEditorialBracketPolarity(text,{maxDepth=3,maxSpan=362}={}){
  const input=String(text??'').normalize('NFKC').replace(/\r\n?/g,'\n');
  const ranges=[];
  const stack=[];
  let topStart=-1,topMaxDepth=0,topInvalid=false;
  for(let i=0;i<input.length;i++){
    const ch=input[i];
    if(PAIRS.has(ch)){
      if(stack.length===0){topStart=i;topMaxDepth=1;topInvalid=false;}
      stack.push({close:PAIRS.get(ch)});
      topMaxDepth=Math.max(topMaxDepth,stack.length);
      if(topMaxDepth>maxDepth)topInvalid=true;
      continue;
    }
    if(!CLOSE.has(ch))continue;
    if(!stack.length)continue;
    if(ch!==stack[stack.length-1].close){topInvalid=true;continue;}
    stack.pop();
    if(stack.length===0&&topStart>=0){
      const segment=input.slice(topStart,i+1);
      if(!topInvalid&&segment.length<=maxSpan&&!segment.includes('\n'))ranges.push([topStart,i+1]);
      topStart=-1;topMaxDepth=0;topInvalid=false;
    }
  }
  if(!ranges.length)return {text:input,maskedRanges:0,parserLimited:Boolean(stack.length||topInvalid)};
  let out='',cursor=0;
  for(const [start,end] of ranges){out+=input.slice(cursor,start);out+=maskDirectional(input.slice(start,end));cursor=end;}
  out+=input.slice(cursor);
  return {text:out,maskedRanges:ranges.length,parserLimited:Boolean(stack.length||topInvalid)};
}

function prepare(receipts=[]){
  const originals=new Map();
  const scope=[];
  const prepared=(Array.isArray(receipts)?receipts:[]).map(raw=>{
    const relation=relationOf(raw);
    const masked=maskEditorialBracketPolarity(relation);
    const key=receiptKey(raw);
    if(key)originals.set(key,relation);
    scope.push({key,maskedRanges:masked.maskedRanges,parserLimited:masked.parserLimited,relationChanged:masked.text!==relation});
    return {...raw,relation:masked.text,relationToTarget:undefined,assessment:undefined};
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
  return {...audit,receiptPipeline:{version:'0.1.0',status:'CANONICAL_EXEC',scope,closureAuthority:'NONE',boundary:'Bounded balanced single-line [] / 【】 / 〔〕 editorial-bracket spans are masked only for lexical polarity classification when nesting depth <=3 and span length <=362. Raw relation text and provenance are restored. Unbalanced, mismatched, too-deep, overlong or multiline spans remain visible. This is deterministic structural containment, not semantic scope parsing, citation ownership inference, source-independence proof or truth judgment.'}};
}

export function applyVajraReceiptPipeline(vajraResult,receipts=[],engine=globalThis.VajraEngine){
  const {prepared,originals,scope}=prepare(receipts);
  const guarded=restoreRawRelations(applyGuardedHandoffResults(vajraResult,prepared,engine),originals);
  return {...guarded,version:`${guarded.version||'unknown'}+receipt-pipeline-v0.1.0`,receiptPipeline:{version:'0.1.0',status:'CANONICAL_EXEC',scope,closureAuthority:'NONE',boundary:'Canonical VAJRA receipt pathway: bracket classification containment composes with the verified branch-scoped ambiguity/conflict guard. Raw relations and provenance remain auditable. It cannot certify truth or source independence.'}};
}
