// VAJRA experimental bracket-scope guard v0.1
// Bounded structural containment for directional support/refute wording that appears
// only inside square/editorial bracket asides. This module is intentionally additive:
// it wraps the verified v0.5.15 ambiguity guard without changing the formal baseline.
// It preserves raw relation text/provenance in audit output while using a masked copy
// only for polarity classification. Parser-limit cases remain visible rather than
// being silently hidden.

import {auditReceiptAmbiguity,applyGuardedHandoffResults} from './vajra-ambiguity-guard.mjs';

const clean=v=>String(v??'').replace(/\s+/g,' ').trim();
const SUPPORT=/(?:\bsupport(?:s|ed|ing)?\b|\bconfirm(?:s|ed|ing)?\b|\bcorroborat(?:e|es|ed|ing)\b|\bconsistent\s+with\b|支持|佐證|印證|吻合|一致)/gi;
const REFUTE=/(?:\brefut(?:e|es|ed|ing)?\b|\bcontradict(?:s|ed|ing)?\b|\boppose(?:s|d)?\b|\bcounterexample\b|\bfalsif(?:y|ies|ied|ying)\b|反駁|反證|否證|矛盾|相反)/gi;
const PAIRS=new Map([['[',']'],['【','】'],['〔','〕']]);
const CLOSE=new Set([...PAIRS.values()]);

function receiptKey(r){return [clean(r?.targetRef),clean(r?.clauseRef),clean(r?.lens),clean(r?.organ||r?.sourceOrgan),clean(r?.provenance||r?.provenanceFingerprint||r?.sourceFingerprint||r?.fingerprint)].join('|');}
function relationOf(r){return clean(r?.relation||r?.relationToTarget||r?.assessment);}
function maskDirectional(segment){return segment.replace(SUPPORT,' <bracket-pos> ').replace(REFUTE,' <bracket-neg> ');}

export function maskBracketScopedPolarity(text,{maxDepth=3,maxSpan=362}={}){
  const input=String(text??'').normalize('NFKC');
  const ranges=[];
  const stack=[];
  let topStart=-1;
  let topMaxDepth=0;
  let topInvalid=false;
  for(let i=0;i<input.length;i++){
    const ch=input[i];
    if(PAIRS.has(ch)){
      if(stack.length===0){topStart=i;topMaxDepth=1;topInvalid=false;}
      stack.push({open:ch,close:PAIRS.get(ch),index:i});
      topMaxDepth=Math.max(topMaxDepth,stack.length);
      if(topMaxDepth>maxDepth)topInvalid=true;
      continue;
    }
    if(!CLOSE.has(ch))continue;
    if(!stack.length){continue;}
    const expected=stack[stack.length-1].close;
    if(ch!==expected){topInvalid=true;continue;}
    stack.pop();
    if(stack.length===0&&topStart>=0){
      const segment=input.slice(topStart,i+1);
      if(!topInvalid&&segment.length<=maxSpan&&!segment.includes('\n'))ranges.push([topStart,i+1]);
      topStart=-1;topMaxDepth=0;topInvalid=false;
    }
  }
  // An unbalanced top-level span is deliberately not masked.
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
    const masked=maskBracketScopedPolarity(relation);
    const key=receiptKey(raw);
    if(key)originals.set(key,relation);
    scope.push({key,maskedRanges:masked.maskedRanges,parserLimited:masked.parserLimited,relationChanged:masked.text!==relation.normalize('NFKC')});
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

export function auditBracketScopedReceipts(receipts=[]){
  const {prepared,originals,scope}=prepare(receipts);
  const audit=restoreRawRelations(auditReceiptAmbiguity(prepared),originals);
  return {...audit,bracketScopeGuard:{version:'0.1',status:'EXPERIMENTAL',scope,boundary:'Directional vocabulary inside balanced single-line [] / 【】 / 〔〕 spans is masked only for lexical polarity classification when nesting depth <=3 and span length <=362. Raw relation text and provenance are restored in the audit. Unbalanced, mismatched, too-deep, overlong or multiline spans remain visible. This is deterministic structural containment, not semantic scope parsing, citation ownership inference or truth judgment.'}};
}

export function applyBracketScopedHandoffResults(vajraResult,receipts=[],engine=globalThis.VajraEngine){
  const {prepared,originals,scope}=prepare(receipts);
  const guarded=restoreRawRelations(applyGuardedHandoffResults(vajraResult,prepared,engine),originals);
  return {...guarded,version:`${guarded.version||'unknown'}+bracket-scope-experimental-v0.1`,bracketScopeGuard:{version:'0.1',status:'EXPERIMENTAL',scope,closureAuthority:'NONE',boundary:'Classification-only bracket masking with raw relation/provenance restoration. No truth or closure authority is added.'}};
}

// Direct execution provides a focused adversarial result without mutating formal state.
if(import.meta.url===new URL(`file://${process.argv[1]}`).href){
  const fs=await import('node:fs/promises');
  const path=await import('node:path');
  const failures=[];
  const common={targetRef:'vajra:bracket:test',clauseRef:'clause:1',lens:'evidence',status:'EXECUTED'};
  const directSupport={...common,organ:'DROPLET',provenance:'direct-support',material:'A direct bounded assessment exists.',relation:'This evidence supports the target claim within the tested scope.'};
  const directRefute={...common,organ:'DROPLET',provenance:'direct-refute',material:'A direct bounded counter-assessment exists.',relation:'This evidence refutes the target claim within the tested scope.'};
  const bracketOnly={...common,organ:'MU/TH/UR',provenance:'bracket-only',material:'The return quotes an editorial note only.',relation:'Background note [a prior report refutes the target claim] without independent endorsement.'};
  const zhBracketOnly={...common,organ:'SHROOMING',provenance:'zh-bracket-only',material:'回傳只保留編輯註記。',relation:'背景註記【舊報告支持目標命題】但本回傳沒有自行背書。'};
  const directOutside={...common,organ:'MU/TH/UR',provenance:'outside-direct',material:'Background plus direct assessment.',relation:'Background [a prior report refutes the target claim]. This evidence supports the target claim within the tested scope.'};
  const nested={...common,organ:'SHROOMING',provenance:'nested',material:'Nested editorial aside.',relation:'Background [reviewer notes [a prior report supports the target claim] without endorsement] only.'};
  const unbalanced={...common,organ:'MU/TH/UR',provenance:'unbalanced',material:'Parser-limit control.',relation:'Background [a prior report refutes the target claim without a closing bracket.'};

  const a=auditBracketScopedReceipts([directSupport,bracketOnly]);
  const af=a.ambiguous?.[0]?.receipts?.find(x=>x.provenance==='bracket-only');
  if(a.status!=='AMBIGUITY_FOUND')failures.push({type:'BRACKET_ONLY_NOT_AMBIGUOUS',actual:a.status});
  if(af?.polarity!=='UNSPECIFIED')failures.push({type:'BRACKET_POLARITY_LEAK',actual:af?.polarity});
  if(af?.relation!==bracketOnly.relation)failures.push({type:'RAW_RELATION_NOT_RESTORED'});

  const z=auditBracketScopedReceipts([directRefute,zhBracketOnly]);
  const zf=z.ambiguous?.[0]?.receipts?.find(x=>x.provenance==='zh-bracket-only');
  if(z.status!=='AMBIGUITY_FOUND'||zf?.polarity!=='UNSPECIFIED')failures.push({type:'ZH_BRACKET_POLARITY_LEAK',status:z.status,polarity:zf?.polarity});

  const d=auditBracketScopedReceipts([directRefute,directOutside]);
  const df=d.contested?.[0]?.receipts?.find(x=>x.provenance==='outside-direct');
  if(d.status!=='CONFLICT_FOUND'||df?.polarity!=='SUPPORTS')failures.push({type:'DIRECT_OUTSIDE_HIDDEN',status:d.status,polarity:df?.polarity});

  const n=auditBracketScopedReceipts([directRefute,nested]);
  const nf=n.ambiguous?.[0]?.receipts?.find(x=>x.provenance==='nested');
  if(n.status!=='AMBIGUITY_FOUND'||nf?.polarity!=='UNSPECIFIED')failures.push({type:'NESTED_BRACKET_LEAK',status:n.status,polarity:nf?.polarity});

  const u=auditBracketScopedReceipts([directSupport,unbalanced]);
  const uf=u.contested?.[0]?.receipts?.find(x=>x.provenance==='unbalanced');
  if(u.status!=='CONFLICT_FOUND'||uf?.polarity!=='REFUTES')failures.push({type:'UNBALANCED_NOT_CONSERVATIVE',status:u.status,polarity:uf?.polarity});

  const result={schema:'nostromo-vajra-bracket-scope-experimental/v0.1',completedAt:new Date().toISOString(),status:failures.length?'FAIL':'PASS',finding:{bracketOnlyStatus:a.status,bracketOnlyPolarity:af?.polarity||null,chineseBracketStatus:z.status,chineseBracketPolarity:zf?.polarity||null,directOutsideStatus:d.status,directOutsidePolarity:df?.polarity||null,nestedStatus:n.status,nestedPolarity:nf?.polarity||null,unbalancedStatus:u.status,unbalancedPolarity:uf?.polarity||null,rawRelationPreserved:af?.relation===bracketOnly.relation,crossOrganCovered:true},failures,boundary:'Experimental VAJRA sub-guard only. It demonstrates bounded square/editorial-bracket scope containment with conservative parser limits and raw-provenance preservation; it is not yet promoted into the verified main ambiguity guard or formal public organ status.'};
  const out=path.join(process.cwd(),'nostromo','integration','vajra-bracket-scope-last-result.json');
  await fs.writeFile(out,JSON.stringify(result,null,2)+'\n','utf8');
  console.log(JSON.stringify(result,null,2));
  if(failures.length)process.exitCode=1;
}
