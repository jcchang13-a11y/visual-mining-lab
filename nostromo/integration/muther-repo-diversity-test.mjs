import fs from 'node:fs/promises';
import path from 'node:path';
import {mutherMineRepo,mutherCandidateSimilarity} from './repo-executors.mjs';

const ROOT=process.cwd();
const query=['MUTHER_NEAR','DUP_GUARD_X9'].join('_');
const fixtureDirs=['tmp-muther-near-a','tmp-muther-near-b','tmp-muther-near-c'];
const failures=[];
const assert=(condition,message)=>{if(!condition)failures.push(message);};

const base=`${query} evidence bundle records a bounded repository observation, preserves provenance, routes contradictory material to review, and never upgrades absence of counterevidence into truth. The candidate is intentionally long enough to exercise lexical overlap containment. Timestamp 2026-09-02T12:00:00Z fingerprint abcdef1234567890.`;
const near=`${query} — evidence bundle records a strictly bounded repository observation; preserves provenance; routes contradictory material to review; and never upgrades absence of counterevidence into truth. The candidate is intentionally long enough to exercise lexical overlap containment. Timestamp 2026-09-02T12:45:00Z fingerprint fedcba0987654321.`;
const distinct=`${query} describes a separate mining result about image grammar extraction, source-family coverage, and unresolved visual anomalies. It shares the probe token only so the repository miner must retain materially different lexical content instead of collapsing every query hit into one candidate.`;

try{
  for(const dir of fixtureDirs)await fs.mkdir(path.join(ROOT,dir),{recursive:true});
  await fs.writeFile(path.join(ROOT,fixtureDirs[0],'a.md'),base,'utf8');
  await fs.writeFile(path.join(ROOT,fixtureDirs[1],'b.md'),near,'utf8');
  await fs.writeFile(path.join(ROOT,fixtureDirs[2],'c.md'),distinct,'utf8');

  const nearSimilarity=mutherCandidateSimilarity(base,near);
  const distinctSimilarity=mutherCandidateSimilarity(base,distinct);
  const result=await mutherMineRepo({query,limit:10,nearDuplicateThreshold:0.88});

  const fixtureCandidates=(result.candidateHitCount||0);
  assert(nearSimilarity>=0.88,`near mutation similarity too low: ${nearSimilarity}`);
  assert(distinctSimilarity<0.88,`distinct fixture similarity unexpectedly high: ${distinctSimilarity}`);
  assert(fixtureCandidates===3,`expected exactly 3 fixture candidates, got ${fixtureCandidates}`);
  assert(result.duplicateSuppressedCount===0,`exact duplicate suppression should remain 0, got ${result.duplicateSuppressedCount}`);
  assert(result.nearDuplicateSuppressedCount===1,`expected one lexical near-duplicate suppression, got ${result.nearDuplicateSuppressedCount}`);
  assert(result.lexicallyDistinctCandidateCount===2,`expected two lexically distinct candidates, got ${result.lexicallyDistinctCandidateCount}`);
  assert(result.hitCount===2,`expected two retained hits, got ${result.hitCount}`);
  assert((result.nearDuplicateAudit||[]).length===1,'expected one auditable near-duplicate record');
  const retainedPaths=(result.hits||[]).map(x=>x.path);
  assert(retainedPaths.some(x=>x.startsWith('tmp-muther-near-c/')),'materially distinct lexical candidate was incorrectly suppressed');
  assert(new Set(result.selectedSourceFamilies||[]).size===2,'family-balanced selection should retain two source families after suppression');
  assert(/NOT SEMANTIC IDENTITY/.test(result.boundary||''),'boundary must explicitly deny semantic-identity inference');

  const output={
    schema:'muther-repo-diversity-test/v0.1.1',
    completedAt:new Date().toISOString(),
    status:failures.length?'FAIL':'PASS',
    capability:'LEXICAL_NEAR_DUPLICATE_POLLUTION_CONTAINMENT',
    unit:{nearSimilarity:Number(nearSimilarity.toFixed(4)),distinctSimilarity:Number(distinctSimilarity.toFixed(4)),threshold:result.nearDuplicateThreshold},
    adversarial:{candidateHitCount:result.candidateHitCount,exactDuplicateSuppressedCount:result.duplicateSuppressedCount,nearDuplicateSuppressedCount:result.nearDuplicateSuppressedCount,lexicallyDistinctCandidateCount:result.lexicallyDistinctCandidateCount,retainedPaths,nearDuplicateAudit:result.nearDuplicateAudit},
    provenance:{selectedSourceFamilies:result.selectedSourceFamilies,sourceFamilyCount:result.sourceFamilyCount},
    crossOrganRegression:'The main NOSTROMO integration test runs separately in the same workflow and must remain PASS before public promotion.',
    boundary:'PASS certifies conservative lexical near-duplicate containment for repository-mining candidates under controlled lexical, formatting, timestamp and fingerprint mutation. It does not certify semantic equivalence, source independence, source quality, novelty, factual truth, or Google Drive coverage.',
    failures
  };
  await fs.writeFile(path.join(ROOT,'nostromo/integration/muther-repo-diversity-last-result.json'),JSON.stringify(output,null,2)+'\n','utf8');
  console.log(JSON.stringify(output,null,2));
  if(failures.length)process.exitCode=1;
} finally {
  for(const dir of fixtureDirs)await fs.rm(path.join(ROOT,dir),{recursive:true,force:true});
}
