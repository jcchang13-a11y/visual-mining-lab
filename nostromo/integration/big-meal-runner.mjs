// ZENOMORPH big-meal runner v0.2.0
// Whole-source ingestion without human semantic preselection.
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {shroomFeedbackReadingRound} from './shroom-feedback-executor.mjs';
import {mutherCandidateFingerprint,mutherCandidateSimilarity} from './repo-executors.mjs';

const execFileAsync=promisify(execFile);
const sha256=value=>crypto.createHash('sha256').update(value).digest('hex');
const compact=(s,n=2000)=>String(s??'').replace(/\s+/g,' ').trim().slice(0,n);
const normalizedIdentity=s=>String(s??'').normalize('NFKC').toLowerCase().replace(/[\p{P}\p{S}\s]+/gu,'');

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

async function pdfToText(buffer){
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'zenomorph-meal-'));
  const pdfPath=path.join(dir,'food.pdf');
  const txtPath=path.join(dir,'food.txt');
  try{
    await fs.writeFile(pdfPath,buffer);
    await execFileAsync('pdftotext',['-layout',pdfPath,txtPath],{timeout:120000,maxBuffer:8*1024*1024});
    return (await fs.readFile(txtPath,'utf8')).replace(/\r/g,'').trim();
  } finally {
    await fs.rm(dir,{recursive:true,force:true});
  }
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

async function tryAcquire(url,manifest){
  const response=await fetch(url,{redirect:'follow',headers:{'user-agent':'Mozilla/5.0 ZENOMORPH-DROPLET/1.1','accept':'text/html,application/xhtml+xml,application/pdf;q=0.9,*/*;q=0.5'}});
  const contentType=String(response.headers.get('content-type')||'').toLowerCase();
  if(!response.ok)return {ok:false,url,responseStatus:response.status,contentType,reason:'HTTP'};
  const bytes=Buffer.from(await response.arrayBuffer());
  const isPdf=contentType.includes('pdf')||bytes.subarray(0,5).toString()==='%PDF-';
  let text;
  try{text=isPdf?await pdfToText(bytes):htmlToText(bytes.toString('utf8'));}
  catch(error){return {ok:false,url,responseStatus:response.status,contentType,bytes:bytes.length,reason:`EXTRACT:${String(error?.message||error).slice(0,240)}`};}
  const textIdentity=normalizedIdentity(text);
  const titleVerified=textIdentity.includes(normalizedIdentity(manifest.title));
  const authorVerified=textIdentity.includes(normalizedIdentity(manifest.author));
  const doiVerified=text.toLowerCase().replace(/\s+/g,'').includes(String(manifest.doi||'').toLowerCase().replace(/\s+/g,''));
  const bodyLargeEnough=text.length>12000;
  return {ok:titleVerified&&authorVerified&&doiVerified&&bodyLargeEnough,url,responseStatus:response.status,contentType,format:isPdf?'pdf':'html',bytes:bytes.length,sourceSha256:sha256(bytes),text,textCharCount:text.length,titleVerified,authorVerified,doiVerified,bodyLargeEnough,reason:(titleVerified&&authorVerified&&doiVerified&&bodyLargeEnough)?null:'IDENTITY_OR_BODY'};
}

async function dropletAcquire(manifest){
  const candidates=[manifest.source?.primaryHtml,manifest.source?.primary,manifest.source?.repositoryPdf,manifest.source?.publisherPdf].filter(Boolean);
  if(!candidates.length)throw new Error('MEAL_SOURCE_REQUIRED');
  const attempts=[];
  for(const url of [...new Set(candidates)]){
    try{
      const result=await tryAcquire(url,manifest);
      const {text,...audit}=result;attempts.push(audit);
      if(result.ok)return {...result,attempts};
    }catch(error){attempts.push({url,ok:false,reason:`FETCH:${String(error?.message||error).slice(0,240)}`});}
  }
  throw new Error(`DROPLET_ALL_SOURCES_REJECTED:${JSON.stringify(attempts)}`);
}

async function loadEngines(){
  await import('../gut/gut-engine.js');
  await import('../vajra/vajra-engine.js');
  if(!globalThis.GutEngine) throw new Error('GUT_UNAVAILABLE');
  if(!globalThis.VajraEngine) throw new Error('VAJRA_UNAVAILABLE');
}

export async function runBigMeal({manifestPath='nostromo/research/big-meals/pasquinelli-2026.json',outputPath=null}={}){
  const manifest=JSON.parse(await fs.readFile(manifestPath,'utf8'));
  if(manifest.ingestionLaw!=='WHOLE_ARTICLE_IS_ONE_FOOD_BODY')throw new Error('WHOLE_FOOD_LAW_REQUIRED');
  if(manifest.humanPreselection!==false||manifest.humanSummaryBeforeIngestion!==false||manifest.humanThemeHints!==false)throw new Error('HUMAN_PRESELECTION_BOUNDARY_VIOLATED');
  const acquired=await dropletAcquire(manifest);
  const text=acquired.text;
  const droplet={executor:'DROPLET_BIG_MEAL_ACQUIRE',status:'EXECUTED',url:acquired.url,responseStatus:acquired.responseStatus,contentType:acquired.contentType,format:acquired.format,bytes:acquired.bytes,sourceSha256:acquired.sourceSha256,textCharCount:acquired.textCharCount,titleVerified:acquired.titleVerified,authorVerified:acquired.authorVerified,doiVerified:acquired.doiVerified,bodyLargeEnough:acquired.bodyLargeEnough,attempts:acquired.attempts,license:manifest.license,versionOfRecordDate:manifest.versionOfRecordDate,boundary:'WHOLE SOURCE VERIFIED; FALLBACK SOURCES MAY BE USED ONLY WHEN IDENTITY MATCHES TITLE+AUTHOR+DOI AND BODY SIZE.'};
  const chunks=neutralChunks(text);
  const muther=mutherWholeText(chunks);
  await loadEngines();
  const gutInput={mealId:manifest.id,sourceSha256:acquired.sourceSha256,muther};
  const gut=globalThis.GutEngine.digest(gutInput,{source:`BIG_MEAL:${manifest.id}`,inheritedSubstrates:chunks});
  const vajraTarget=compact(gut.summary||JSON.stringify(gut),7000);
  const vajra=globalThis.VajraEngine.run(vajraTarget,8);
  const shrooming=await shroomFeedbackReadingRound({text:vajraTarget,agents:10,round:1});
  const result={schema:'zenomorph-big-meal-result/v0.2',mealId:manifest.id,status:'INGESTED_NOT_PROMOTED',acquiredAt:new Date().toISOString(),provenance:{doi:manifest.doi,url:acquired.url,format:acquired.format,license:manifest.license,versionOfRecordDate:manifest.versionOfRecordDate,sourceSha256:acquired.sourceSha256},droplet,muther,gut:{status:gut?.status||'EXECUTED',summaryFingerprint:sha256(String(gut?.summary||'')),nutrientCount:Array.isArray(gut?.nutrients)?gut.nutrients.length:null,wasteCount:Array.isArray(gut?.waste)?gut.waste.length:null},vajra:{status:vajra?.status||'EXECUTED',targetRef:vajra?.targetRef||null,traceLength:Array.isArray(vajra?.trace)?vajra.trace.length:null,boundary:'VAJRA OUTPUT IS ADVERSARIAL DIGESTION, NOT EVIDENCE THAT AN ORGANISM/MACHINE ANALOGY IS TRUE.'},shrooming:{status:shrooming?.status||'EXECUTED',count:shrooming?.count||null,sourceFingerprint:shrooming?.sourceFingerprint||null},promotion:{allowed:false,reason:'ONE_MEAL_CANNOT_ESTABLISH_CROSS_FOOD_OR_DELAYED_TRANSFER'},nextTests:['held_out_non_ai_non_life_non_philosophy_food','cross_food_transfer','delayed_retest']};
  if(outputPath)await fs.writeFile(outputPath,JSON.stringify(result,null,2)+'\n','utf8');
  return result;
}

if(import.meta.url===`file://${process.argv[1]}`){const outputArg=process.argv.find(x=>x.startsWith('--output='));const result=await runBigMeal({outputPath:outputArg?outputArg.slice(9):null});console.log(JSON.stringify(result,null,2));}
