import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {acquireBigMeal,verifyBigMealManifest} from './big-meal-acquire.mjs';

const manifest={
  schema:'zenomorph-big-meal/v1.0',
  id:'meal-test',
  title:'Machine, organism and language: a comparative epistemology of AI models',
  author:'Matteo Pasquinelli',
  doi:'10.1007/s00146-026-03094-7',
  license:'CC BY 4.0',
  versionOfRecordDate:'2026-06-05',
  source:{primaryHtml:'https://example.invalid/article'},
  ingestionLaw:'WHOLE_ARTICLE_IS_ONE_FOOD_BODY',
  humanPreselection:false,
  humanSummaryBeforeIngestion:false,
  humanThemeHints:false
};

test('manifest rejects human preselection',()=>{
  const bad={...manifest,humanThemeHints:true};
  const gate=verifyBigMealManifest(bad);
  assert.equal(gate.ok,false);
  assert.ok(gate.failures.includes('HUMAN_PRESELECTION_BOUNDARY'));
});

test('acquisition hashes whole representation and chunks mechanically',async()=>{
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'zenomorph-meal-'));
  const manifestPath=path.join(dir,'meal.json');
  await fs.writeFile(manifestPath,JSON.stringify(manifest));
  const html=`<html><body><main><h1>${manifest.title}</h1><p>${manifest.author}</p><p>doi ${manifest.doi}</p><p>Open Access CC BY 4.0</p><p>${'material '.repeat(1200)}</p></main></body></html>`;
  const fetchImpl=async()=>({ok:true,status:200,headers:{get:()=> 'text/html; charset=utf-8'},text:async()=>html});
  const result=await acquireBigMeal({manifestPath,fetchImpl,maxChunkChars:2000});
  assert.equal(result.status,'ACQUIRED_VERIFIED_NOT_YET_ABSORBED');
  assert.equal(result.provenanceChecks.doiPresent,true);
  assert.equal(result.provenanceChecks.titlePresent,true);
  assert.ok(result.mechanicalChunkCount>1);
  assert.match(result.wholeFoodIdentity,/^sha256:[0-9a-f]{64}$/);
  assert.match(result.boundary,/ACQUISITION ONLY/);
});
