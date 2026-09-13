// ZENOMORPH big-meal runner v0.1.1
// Whole-source ingestion without human semantic preselection.
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import {shroomFeedbackReadingRound} from './shroom-feedback-executor.mjs';
import {mutherCandidateFingerprint,mutherCandidateSimilarity} from './repo-executors.mjs';

const sha256=value=>crypto.createHash('sha256').update(value).digest('hex');
const compact=(s,n=2000)=>String(s??'').replace(/\s+/g,' ').trim().slice(0,n);

function decodeEntities(s){
  const map={amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:' '};
  return String(s).replace(/&(#x?[0-9a-f]+|[a-z]+);/gi,(m,k)=>{
    if(k[0]==='#'){
      const hex=/^#x/i.test(k);const n=parseInt(k.slice(hex?2:1),hex?16:10);
      return Number.isFinite(n)?String.fromCodePoint(n):m;
    }
    return map[k.toLowerCase()]??m;
  });
}

function htmlToText(html){
  let x=String(html);
  x=x.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ')
     .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ')
     .replace(/<(?:p|div|section|article|h1|h2|h3|h4|li|br|blockquote|table|tr)\b[^>]*>/gi,'\n')
     .replace(/<[^>]+>/g,' ');
  x=decodeEntities(x).replace(/\r/g,'').replace(/[ \t]+/g,' ').replace(/\n{3,}/g,'\n\n');
  return x.trim();
}

function neutralChunks(text,{target=3200,min=900}={}){
  const paras=String(text).split(/\n{2,}/).map(x=>x.trim()).filter(Boolean);
  const chunks=[];let buf=[];let size=0;
  for(const p of paras){
    if(size+p.length>target&&size>=min){chunks.push(buf.join('\n\n'));buf=[];size=0;}
    buf.push(p);size+=p.length+2;
  }
  if(buf.length)chunks.push(buf.join('\n\n'));
  return chunks;
}

function mutherWholeText(chunks){
  const nodes=chunks.map((text,index)=>({index,charCount:text.length,fingerprint:mutherCandidateFingerprint(text),head:compact(text,240)}));
  const affinities=[];
  for(let i=0;i<chunks.length;i++)for(let j=i+2;j<chunks.length;j++){
    const similarity=mutherCandidateSimilarity(chunks[i],chunks[j]);
    if(similarity>=0.08)affinities.push({a:i,b:j,similarity:Number(similarity.toFixed(4))});
  }
  affinities.sort((a,b)=>b.similarity-a.similarity);
  const recombinations=affinities.slice(0,12).map((edge,k)=>({
    id:`meal-recombination-${k+1}`,parents:[edge.a,edge.b],affinity:edge.similarity,
    mutation:`[A${edge.a}] ${compact(chunks[edge.a],700)}\n[B${edge.b}] ${compact(chunks[edge.b],700)}`,
    boundary:'STRUCTURAL RECOMBINATION CANDIDATE ONLY; NOT A CLAIM, SUMMARY, OR INCORPORATED CAPABILITY'
  }));
  return {executor:'MUTHER_WHOLE_TEXT_DIGEST',status:'EXECUTED',chunkCount:chunks.length,nodes,affinities:affinities.slice(0,40),recombinations,boundary:'Whole text was decomposed by neutral size/paragraph boundaries. No human topic selection or prior summary was used. Recombination is candidate material only.'};
}

async function loadEngines(){
  await import('../gut/gut-engine.js');
  await import('../vajra/vajra-engine.js');
  if(!globalThis.GutEngine) throw new Error('GUT_UNAVAILABLE');
  if(!globalThis.VajraEngine) throw new Error('VAJRA_UNAVAILABLE');
}

export async function runBigMeal({manifestPath='nostromo/research/big-meals/pasquinelli-2026.json',outputPath=null}={}){
  const manifest=JSON.parse(await fs.readFile(manifestPath,'utf8'));
  const url=manifest.source?.primary;if(!url)throw new Error('MEAL_SOURCE_REQUIRED');
  const response=await fetch(url,{headers:{'user-agent':'Mozilla/5.0 ZENOMORPH-DROPLET/1.0','accept':'text/html,application/xhtml+xml'}});
  if(!response.ok)throw new Error(`DROPLET_FETCH_FAILED:${response.status}`);
  const html=await response.text();
  const sourceHash=sha256(html);
  const text=htmlToText(html);
  const titleNeedle=String(manifest.title||'').toLowerCase();
  const doiNeedle=String(manifest.doi||'').toLowerCase();
  const lower=text.toLowerCase(),rawLower=html.toLowerCase();
  const titleVerified=lower.includes(titleNeedle)||rawLower.includes(titleNeedle);
  const doiVerified=lower.includes(doiNeedle)||rawLower.includes(doiNeedle);
  const bodyLargeEnough=text.length>12000;
  const droplet={executor:'DROPLET_BIG_MEAL_ACQUIRE',status:(titleVerified&&doiVerified&&bodyLargeEnough)?'EXECUTED':'FAILED',url,responseStatus:response.status,contentType:response.headers.get('content-type'),bytes:Buffer.byteLength(html),sourceSha256:sourceHash,textCharCount:text.length,titleVerified,doiVerified,bodyLargeEnough,license:manifest.license,versionOfRecordDate:manifest.versionOfRecordDate};
  if(droplet.status!=='EXECUTED'){
    const failure={schema:'zenomorph-big-meal-failure/v0.1',mealId:manifest.id,status:'ACQUISITION_REJECTED',droplet,reason:'IDENTITY_OR_BODY_CHECK_FAILED'};
    if(outputPath)await fs.writeFile(outputPath,JSON.stringify(failure,null,2)+'\n','utf8');
    throw new Error(`DROPLET_IDENTITY_OR_SIZE_CHECK_FAILED:${JSON.stringify({titleVerified,doiVerified,textCharCount:text.length,bytes:Buffer.byteLength(html),contentType:droplet.contentType})}`);
  }
  const chunks=neutralChunks(text);
  const muther=mutherWholeText(chunks);
  await loadEngines();
  const gutInput={mealId:manifest.id,sourceSha256:sourceHash,muther};
  const gut=globalThis.GutEngine.digest(gutInput,{source:`BIG_MEAL:${manifest.id}`,inheritedSubstrates:chunks});
  const vajraTarget=compact(gut.summary||JSON.stringify(gut),7000);
  const vajra=globalThis.VajraEngine.run(vajraTarget,8);
  const shrooming=await shroomFeedbackReadingRound({text:vajraTarget,agents:10,round:1});
  const result={schema:'zenomorph-big-meal-result/v0.1',mealId:manifest.id,status:'INGESTED_NOT_PROMOTED',acquiredAt:new Date().toISOString(),provenance:{doi:manifest.doi,url,license:manifest.license,versionOfRecordDate:manifest.versionOfRecordDate,sourceSha256:sourceHash},droplet,muther,gut:{status:gut?.status||'EXECUTED',summaryFingerprint:sha256(String(gut?.summary||'')),nutrientCount:Array.isArray(gut?.nutrients)?gut.nutrients.length:null,wasteCount:Array.isArray(gut?.waste)?gut.waste.length:null},vajra:{status:vajra?.status||'EXECUTED',targetRef:vajra?.targetRef||null,traceLength:Array.isArray(vajra?.trace)?vajra.trace.length:null},shrooming:{status:shrooming?.status||'EXECUTED',count:shrooming?.count||null,sourceFingerprint:shrooming?.sourceFingerprint||null},promotion:{allowed:false,reason:'ONE_MEAL_CANNOT_ESTABLISH_CROSS_FOOD_OR_DELAYED_TRANSFER'},nextTests:['held_out_non_ai_non_life_non_philosophy_food','cross_food_transfer','delayed_retest']};
  if(outputPath)await fs.writeFile(outputPath,JSON.stringify(result,null,2)+'\n','utf8');
  return result;
}

if(import.meta.url===`file://${process.argv[1]}`){const outputArg=process.argv.find(x=>x.startsWith('--output='));const result=await runBigMeal({outputPath:outputArg?outputArg.slice(9):null});console.log(JSON.stringify(result,null,2));}
