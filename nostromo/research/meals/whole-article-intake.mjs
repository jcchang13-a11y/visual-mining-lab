// ZENOMORPH whole-article intake v0.1.0
// Treats one article as one food identity while allowing technical chunking.
// It does not summarize, rank sections, or suggest what the article should teach the organism.
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import {runLiveTask} from '../../runtime/live-task-gateway.mjs';

const sha256 = value => crypto.createHash('sha256').update(value).digest('hex');

function decodeEntities(text='') {
  return text
    .replace(/&nbsp;/g,' ')
    .replace(/&amp;/g,'&')
    .replace(/&lt;/g,'<')
    .replace(/&gt;/g,'>')
    .replace(/&#39;/g,"'")
    .replace(/&quot;/g,'"')
    .replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(Number(n)));
}

export function extractArticleText(html='') {
  const body = String(html)
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ')
    .replace(/<nav\b[^>]*>[\s\S]*?<\/nav>/gi,' ')
    .replace(/<footer\b[^>]*>[\s\S]*?<\/footer>/gi,' ')
    .replace(/<figure\b[^>]*>[\s\S]*?<\/figure>/gi,' ')
    .replace(/<sup\b[^>]*>[\s\S]*?<\/sup>/gi,' ')
    .replace(/<br\s*\/?\s*>/gi,'\n')
    .replace(/<\/(p|h1|h2|h3|h4|li|section|div)>/gi,'\n')
    .replace(/<[^>]+>/g,' ');
  return decodeEntities(body)
    .replace(/\r/g,'')
    .replace(/[ \t]+/g,' ')
    .replace(/\n{3,}/g,'\n\n')
    .trim();
}

export function chunkWholeFood(text,{maxChars=12000}={}) {
  const paragraphs=String(text).split(/\n\s*\n/).map(x=>x.trim()).filter(Boolean);
  const chunks=[]; let current='';
  for(const paragraph of paragraphs){
    if(current && current.length + paragraph.length + 2 > maxChars){ chunks.push(current); current=''; }
    if(paragraph.length > maxChars){
      if(current){chunks.push(current);current='';}
      for(let i=0;i<paragraph.length;i+=maxChars) chunks.push(paragraph.slice(i,i+maxChars));
    } else current += (current?'\n\n':'') + paragraph;
  }
  if(current) chunks.push(current);
  return chunks;
}

export async function acquireWholeArticle(manifest){
  const url=manifest?.source?.canonicalUrl;
  if(!url) throw new Error('MEAL_CANONICAL_URL_REQUIRED');
  const response=await fetch(url,{headers:{'user-agent':'ZENOMORPH research intake/0.1 (+public provenance experiment)'}});
  if(!response.ok) throw new Error(`MEAL_FETCH_FAILED:${response.status}`);
  const html=await response.text();
  const text=extractArticleText(html);
  if(text.length < 15000) throw new Error(`MEAL_TEXT_TOO_SHORT:${text.length}`);
  return {
    url:response.url,
    fetchedAt:new Date().toISOString(),
    contentType:response.headers.get('content-type'),
    htmlSha256:sha256(html),
    textSha256:sha256(text),
    chars:text.length,
    text
  };
}

export async function ingestWholeArticle({manifestPath=new URL('./pasquinelli-2026-machine-organism-language.json',import.meta.url), roundsPerChunk=1}={}){
  const manifest=JSON.parse(await fs.readFile(manifestPath,'utf8'));
  const acquired=await acquireWholeArticle(manifest);
  const chunks=chunkWholeFood(acquired.text);
  const mealIdentity={
    mealId:manifest.mealId,
    doi:manifest.citation.doi,
    versionOfRecordDate:manifest.citation.versionOfRecordDate,
    license:manifest.source.license,
    sourceUrl:acquired.url,
    textSha256:acquired.textSha256,
    wholeFood:true,
    chunkCount:chunks.length,
    chars:acquired.chars
  };
  let state;
  const trace=[];
  for(let i=0;i<chunks.length;i++){
    const result=await runLiveTask({
      state,
      task:{
        id:`${manifest.mealId}:chunk-${String(i+1).padStart(3,'0')}-of-${String(chunks.length).padStart(3,'0')}`,
        kind:'whole-article-meal',
        rounds:roundsPerChunk,
        mineQuery:'ZENOMORPH',
        verifyUrl:manifest.source.canonicalUrl,
        provenance:{...mealIdentity,chunkIndex:i+1},
        input:[
          'WHOLE_FOOD_CONTINUATION. Do not summarize for a human. Do not infer a lesson from the title. Preserve provenance.',
          `MEAL=${manifest.mealId}`,
          `CHUNK=${i+1}/${chunks.length}`,
          chunks[i]
        ].join('\n\n')
      }
    });
    state=result.state;
    trace.push({
      chunk:i+1,
      comparison:result.comparison,
      officialFingerprint:sha256(JSON.stringify(result.official)),
      shadowFingerprint:sha256(JSON.stringify(result.shadow))
    });
  }
  return {
    schema:'zenomorph-whole-meal-run/v0.1.0',
    meal:mealIdentity,
    completedAt:new Date().toISOString(),
    chunksProcessed:chunks.length,
    runtimeState:state,
    trace,
    boundary:'Completion means the whole source traversed the live gateway. It does NOT mean any mutation is admitted; cross-food and delayed evidence are still required.'
  };
}

if(import.meta.url===`file://${process.argv[1]}`){
  const result=await ingestWholeArticle();
  process.stdout.write(JSON.stringify(result,null,2));
}
