// ZENOMORPH whole-food acquisition gate v0.1
// Acquisition verifies provenance and preserves the entire fetched representation as one food identity.
// Chunking is mechanical only; it must not preselect themes or decide what the organs should learn.
import fs from 'node:fs/promises';
import crypto from 'node:crypto';

const sha256=value=>crypto.createHash('sha256').update(value).digest('hex');
const compact=value=>String(value??'').replace(/\s+/g,' ').trim();

function mechanicalChunks(text,maxChars=12000){
  const source=String(text??'');
  const width=Math.max(2000,Math.min(50000,Number(maxChars)||12000));
  const chunks=[];
  for(let offset=0;offset<source.length;offset+=width){
    const body=source.slice(offset,offset+width);
    chunks.push({index:chunks.length,offsetStart:offset,offsetEnd:offset+body.length,chars:body.length,sha256:sha256(body)});
  }
  return chunks;
}

export function verifyBigMealManifest(manifest){
  const failures=[];
  if(manifest?.schema!=='zenomorph-big-meal/v1.0') failures.push('SCHEMA');
  if(!manifest?.id) failures.push('ID');
  if(!manifest?.doi) failures.push('DOI');
  if(!manifest?.source?.primaryHtml) failures.push('PRIMARY_HTML');
  if(manifest?.ingestionLaw!=='WHOLE_ARTICLE_IS_ONE_FOOD_BODY') failures.push('WHOLE_FOOD_LAW');
  if(manifest?.humanPreselection!==false||manifest?.humanSummaryBeforeIngestion!==false||manifest?.humanThemeHints!==false) failures.push('HUMAN_PRESELECTION_BOUNDARY');
  return {ok:failures.length===0,failures};
}

function visibleTextFromHtml(html){
  // No semantic extraction: remove executable/style markup and tags, preserve document order.
  return String(html??'')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ')
    .replace(/<!--([\s\S]*?)-->/g,' ')
    .replace(/<[^>]+>/g,' ')
    .replace(/&nbsp;/g,' ')
    .replace(/&amp;/g,'&')
    .replace(/&lt;/g,'<')
    .replace(/&gt;/g,'>')
    .replace(/&#39;|&apos;/g,"'")
    .replace(/&quot;/g,'"')
    .replace(/\s+/g,' ')
    .trim();
}

export async function acquireBigMeal({manifestPath,fetchImpl=globalThis.fetch,maxChunkChars=12000}={}){
  if(!manifestPath) throw new Error('BIG_MEAL_MANIFEST_REQUIRED');
  if(typeof fetchImpl!=='function') throw new Error('FETCH_REQUIRED');
  const manifest=JSON.parse(await fs.readFile(manifestPath,'utf8'));
  const gate=verifyBigMealManifest(manifest);
  if(!gate.ok) throw new Error(`BIG_MEAL_MANIFEST_REJECTED:${gate.failures.join(',')}`);

  const response=await fetchImpl(manifest.source.primaryHtml,{headers:{'user-agent':'ZENOMORPH-research-ingestion/0.1'}});
  if(!response?.ok) throw new Error(`BIG_MEAL_FETCH_FAILED:${response?.status||'UNKNOWN'}`);
  const raw=await response.text();
  const rawHash=sha256(raw);
  const visible=visibleTextFromHtml(raw);
  const normalizedFingerprint=sha256(visible);
  const doiNeedle=compact(manifest.doi).toLowerCase();
  const titleNeedle=compact(manifest.title).toLowerCase();
  const visibleLower=visible.toLowerCase();
  const provenanceChecks={
    doiPresent:visibleLower.includes(doiNeedle),
    titlePresent:visibleLower.includes(titleNeedle),
    authorPresent:visibleLower.includes(compact(manifest.author).toLowerCase()),
    openAccessSignal:/open access|creative commons|cc by/i.test(visible)
  };
  if(!provenanceChecks.doiPresent||!provenanceChecks.titlePresent||!provenanceChecks.authorPresent){
    throw new Error(`BIG_MEAL_PROVENANCE_MISMATCH:${JSON.stringify(provenanceChecks)}`);
  }
  const chunks=mechanicalChunks(visible,maxChunkChars);
  return {
    schema:'zenomorph-big-meal-acquisition/v0.1',
    mealId:manifest.id,
    status:'ACQUIRED_VERIFIED_NOT_YET_ABSORBED',
    sourceUrl:manifest.source.primaryHtml,
    sourceDoi:manifest.doi,
    sourceLicense:manifest.license,
    versionOfRecordDate:manifest.versionOfRecordDate,
    fetchedContentType:response.headers?.get?.('content-type')||null,
    rawBytes:Buffer.byteLength(raw,'utf8'),
    visibleChars:visible.length,
    rawSha256:rawHash,
    visibleSha256:normalizedFingerprint,
    mechanicalChunkCount:chunks.length,
    chunks,
    provenanceChecks,
    wholeFoodIdentity:`sha256:${normalizedFingerprint}`,
    boundary:'ACQUISITION ONLY. THE COMPLETE FETCHED ARTICLE REPRESENTATION HAS ONE FOOD IDENTITY. CHUNKS ARE MECHANICAL TRANSPORT UNITS, NOT HUMAN-SELECTED THEMES. THIS RESULT DOES NOT CLAIM MUTHER/GUT/VAJRA/SHROOMING DIGESTION OR ANY PROMOTION.'
  };
}

if(import.meta.url===`file://${process.argv[1]}`){
  const manifestPath=process.argv[2]||'nostromo/research/big-meals/pasquinelli-2026.json';
  const result=await acquireBigMeal({manifestPath});
  process.stdout.write(`${JSON.stringify(result,null,2)}\n`);
}
