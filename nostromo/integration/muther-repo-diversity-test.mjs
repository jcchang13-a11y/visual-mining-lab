import fs from 'node:fs/promises';
import path from 'node:path';
import {mutherMineRepo,mutherCandidateSimilarity} from './repo-executors.mjs';

const ROOT=process.cwd();
const query=['MUTHER_NEAR','DUP_GUARD_X9'].join('_');
const multiQuery=['MUTHER_MULTI','WINDOW_X7'].join('_');
const fixtureDirs=['tmp-muther-near-a','tmp-muther-near-b','tmp-muther-near-c','tmp-muther-multi'];
const failures=[];
const assert=(condition,message)=>{if(!condition)failures.push(message);};

const base=`${query} evidence bundle records a bounded repository observation, preserves provenance, routes contradictory material to review, and never upgrades absence of counterevidence into truth. The candidate is intentionally long enough to exercise lexical overlap containment. Timestamp 2026-09-02T12:00:00Z fingerprint abcdef1234567890.`;
const near=`${query} — evidence bundle records a strictly bounded repository observation; preserves provenance; routes contradictory material to review; and never upgrades absence of counterevidence into truth. The candidate is intentionally long enough to exercise lexical overlap containment. Timestamp 2026-09-02T12:45:00Z fingerprint fedcba0987654321.`;
const distinct=`${query} describes a separate mining result about image grammar extraction, source-family coverage, and unresolved visual anomalies. It shares the probe token only so the repository miner must retain materially different lexical content instead of collapsing every query hit into one candidate.`;
const spacer='\n'+('bounded filler context without the probe token '.repeat(18))+'\n';
const multi=[
  `${multiQuery} first vein records an archival provenance problem involving document lineage, extraction boundaries, and unresolved authorship metadata.`,
  `${multiQuery} second vein records a contradictory methodological note about sampling bias, negative cases, and a failed classification rule that needs separate review.`,
  `${multiQuery} third vein records a visual-material observation about recurring spatial composition, media residue, and an anomaly cluster unrelated to the first two veins.`
].join(spacer);

try{
  for(const dir of fixtureDirs)await fs.mkdir(path.join(ROOT,dir),{recursive:true});
  await fs.writeFile(path.join(ROOT,fixtureDirs[0],'a.md'),base,'utf8');
  await fs.writeFile(path.join(ROOT,fixtureDirs[1],'b.md'),near,'utf8');
  await fs.writeFile(path.join(ROOT,fixtureDirs[2],'c.md'),distinct,'utf8');
  await fs.writeFile(path.join(ROOT,fixtureDirs[3],'multi.md'),multi,'utf8');

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
  assert(/SEMANTIC IDENTITY/.test(result.boundary||'') && /NOT SEMANTIC VEIN DETECTION/.test(result.boundary||''),'boundary must explicitly deny semantic identity / semantic vein inference');

  const multiResult=await mutherMineRepo({query:multiQuery,limit:10,nearDuplicateThreshold:0.88,maxWindowsPerFile:4,minWindowGap:320});
  const multiHits=(multiResult.hits||[]).filter(x=>x.path.startsWith('tmp-muther-multi/'));
  const multiOrdinals=[...new Set(multiHits.map(x=>x.occurrenceOrdinal).filter(Boolean))].sort((a,b)=>a-b);
  assert(multiResult.filesWithMultipleOccurrences===1,`expected one multi-occurrence file, got ${multiResult.filesWithMultipleOccurrences}`);
  assert(multiResult.occurrenceWindowCandidateCount===3,`expected three bounded occurrence windows, got ${multiResult.occurrenceWindowCandidateCount}`);
  assert(multiHits.length===3,`expected three retained distinct veins from one file, got ${multiHits.length}`);
  assert(JSON.stringify(multiOrdinals)===JSON.stringify([1,2,3]),`expected occurrence ordinals 1,2,3, got ${JSON.stringify(multiOrdinals)}`);
  assert(multiResult.selectedDistinctFileCount===1,`expected one selected file carrying multiple veins, got ${multiResult.selectedDistinctFileCount}`);
  assert(/FIRST-HIT BLINDNESS/.test(multiResult.boundary||''),'boundary must declare bounded first-hit-blindness mitigation');

  const output={
    schema:'muther-repo-diversity-test/v0.2.0',
    completedAt:new Date().toISOString(),
    status:failures.length?'FAIL':'PASS',
    capability:'LEXICAL_NEAR_DUPLICATE_POLLUTION_CONTAINMENT_PLUS_BOUNDED_MULTI_WINDOW_VEIN_COVERAGE',
    unit:{nearSimilarity:Number(nearSimilarity.toFixed(4)),distinctSimilarity:Number(distinctSimilarity.toFixed(4)),threshold:result.nearDuplicateThreshold},
    adversarial:{candidateHitCount:result.candidateHitCount,exactDuplicateSuppressedCount:result.duplicateSuppressedCount,nearDuplicateSuppressedCount:result.nearDuplicateSuppressedCount,lexicallyDistinctCandidateCount:result.lexicallyDistinctCandidateCount,retainedPaths,nearDuplicateAudit:result.nearDuplicateAudit},
    multiWindow:{filesWithMultipleOccurrences:multiResult.filesWithMultipleOccurrences,occurrenceWindowCandidateCount:multiResult.occurrenceWindowCandidateCount,retainedVeinCount:multiHits.length,occurrenceOrdinals:multiOrdinals,selectedDistinctFileCount:multiResult.selectedDistinctFileCount,maxWindowsPerFile:multiResult.maxWindowsPerFile,minWindowGap:multiResult.minWindowGap},
    provenance:{selectedSourceFamilies:result.selectedSourceFamilies,sourceFamilyCount:result.sourceFamilyCount},
    crossOrganRegression:'The main NOSTROMO integration test runs separately in the same workflow and must remain PASS before public promotion.',
    boundary:'PASS certifies conservative lexical near-duplicate containment plus bounded extraction of multiple separated query windows from one repository file under controlled fixtures. It reduces first-hit blindness but does not certify semantic vein detection, semantic equivalence, exhaustive within-file coverage, source independence, source quality, novelty, factual truth, or Google Drive coverage.',
    failures
  };
  await fs.writeFile(path.join(ROOT,'nostromo/integration/muther-repo-diversity-last-result.json'),JSON.stringify(output,null,2)+'\n','utf8');
  console.log(JSON.stringify(output,null,2));
  if(failures.length)process.exitCode=1;
} finally {
  for(const dir of fixtureDirs)await fs.rm(path.join(ROOT,dir),{recursive:true,force:true});
}
