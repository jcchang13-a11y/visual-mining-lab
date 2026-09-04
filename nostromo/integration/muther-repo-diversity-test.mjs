import fs from 'node:fs/promises';
import path from 'node:path';
import {mutherMineRepo,mutherCandidateSimilarity,mutherVeinAffinity} from './repo-executors.mjs';

const ROOT=process.cwd();
const query=['MUTHER_NEAR','DUP_GUARD_X9'].join('_');
const multiQuery=['MUTHER_MULTI','WINDOW_X7'].join('_');
const exactQuery=['MUTHER_EXACT','REPLAY_P9'].join('_');
const veinQuery=['MUTHER_LEXICAL','VEIN_Q5'].join('_');
const fixtureDirs=['tmp-muther-near-a','tmp-muther-near-b','tmp-muther-near-c','tmp-muther-multi','tmp-muther-exact-a','tmp-muther-exact-b','tmp-muther-vein-a','tmp-muther-vein-b','tmp-muther-vein-c'];
const failures=[];
const assert=(condition,message)=>{if(!condition)failures.push(message);};

const base=`${query} evidence bundle records a bounded repository observation, preserves provenance, routes contradictory material to review, and never upgrades absence of counterevidence into truth. The candidate is intentionally long enough to exercise lexical overlap containment. Timestamp 2026-09-02T12:00:00Z fingerprint abcdef1234567890.`;
const near=`${query} — evidence bundle records a strictly bounded repository observation; preserves provenance; routes contradictory material to review; and never upgrades absence of counterevidence into truth. The candidate is intentionally long enough to exercise lexical overlap containment. Timestamp 2026-09-02T12:45:00Z fingerprint fedcba0987654321.`;
const distinct=`${query} describes a separate mining result about image grammar extraction, source-family coverage, and unresolved visual anomalies. It shares the probe token only so the repository miner must retain materially different lexical content instead of collapsing every query hit into one candidate.`;
const spacer='\n'+('bounded filler context without the probe token '.repeat(18))+'\n';
const multi=[
  `${multiQuery} first vein records an archival provenance problem involving document lineage, extraction boundaries, and unresolved authorship metadata.`,
  `${multiQuery} nearby echo is deliberately too close to the first occurrence to earn its own extraction window, but it still counts as the second true occurrence in source provenance.`,
  `${multiQuery} third vein records a contradictory methodological note about sampling bias, negative cases, and a failed classification rule that needs separate review.`,
  `${multiQuery} fourth vein records a visual-material observation about recurring spatial composition, media residue, and an anomaly cluster unrelated to the first two retained veins.`
].map((x,i)=>i===0||i===1?x:(spacer+x)).join('\n');
const exact=`${exactQuery} exact replay fixture records one bounded observation about duplicated repository material, source-family provenance, and the rule that copied text must not be counted twice as independent evidence. The text is intentionally identical across two distinct source families.`;
const veinA=`${veinQuery} archive lineage memory network provenance boundary unresolved branch contradiction review signal. This note examines how inherited evidence moves across a repository while retaining source context and contested status.`;
const veinB=`${veinQuery} archive lineage memory network provenance boundary contested branch contradiction inspection signal. This record follows inherited evidence across another repository family while preserving source context and unresolved review.`;
const veinC=`${veinQuery} ceramic orchard monsoon copper geometry pigment footfall harbor logistics. This unrelated note concerns material textures, seasonal circulation, and spatial composition rather than provenance lineage.`;

try{
  for(const dir of fixtureDirs)await fs.mkdir(path.join(ROOT,dir),{recursive:true});
  await fs.writeFile(path.join(ROOT,fixtureDirs[0],'a.md'),base,'utf8');
  await fs.writeFile(path.join(ROOT,fixtureDirs[1],'b.md'),near,'utf8');
  await fs.writeFile(path.join(ROOT,fixtureDirs[2],'c.md'),distinct,'utf8');
  await fs.writeFile(path.join(ROOT,fixtureDirs[3],'multi.md'),multi,'utf8');
  await fs.writeFile(path.join(ROOT,fixtureDirs[4],'copy-a.md'),exact,'utf8');
  await fs.writeFile(path.join(ROOT,fixtureDirs[5],'copy-b.md'),exact,'utf8');
  await fs.writeFile(path.join(ROOT,fixtureDirs[6],'vein-a.md'),veinA,'utf8');
  await fs.writeFile(path.join(ROOT,fixtureDirs[7],'vein-b.md'),veinB,'utf8');
  await fs.writeFile(path.join(ROOT,fixtureDirs[8],'vein-c.md'),veinC,'utf8');

  const nearSimilarity=mutherCandidateSimilarity(base,near);
  const distinctSimilarity=mutherCandidateSimilarity(base,distinct);
  const result=await mutherMineRepo({query,limit:10,nearDuplicateThreshold:0.88});

  const fixtureCandidates=(result.candidateHitCount||0);
  assert(nearSimilarity>=0.88,`near mutation similarity too low: ${nearSimilarity}`);
  assert(distinctSimilarity<0.88,`distinct fixture similarity unexpectedly high: ${distinctSimilarity}`);
  assert(fixtureCandidates===3,`expected exactly 3 fixture candidates, got ${fixtureCandidates}`);
  assert(result.duplicateSuppressedCount===0,`exact duplicate suppression should remain 0, got ${result.duplicateSuppressedCount}`);
  assert((result.exactDuplicateAudit||[]).length===0,'near-duplicate fixture should not manufacture an exact-duplicate audit');
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
  assert(multiResult.totalQueryOccurrences===4,`expected four true query occurrences including the skipped nearby occurrence, got ${multiResult.totalQueryOccurrences}`);
  assert(multiResult.occurrenceWindowCandidateCount===3,`expected three bounded occurrence windows after gap suppression, got ${multiResult.occurrenceWindowCandidateCount}`);
  assert(multiHits.length===3,`expected three retained distinct veins from one file, got ${multiHits.length}`);
  assert(JSON.stringify(multiOrdinals)===JSON.stringify([1,3,4]),`expected true source occurrence ordinals 1,3,4 after skipping nearby occurrence 2, got ${JSON.stringify(multiOrdinals)}`);
  assert(multiResult.selectedDistinctFileCount===1,`expected one selected file carrying multiple veins, got ${multiResult.selectedDistinctFileCount}`);
  assert(/FIRST-HIT BLINDNESS/.test(multiResult.boundary||''),'boundary must declare bounded first-hit-blindness mitigation');
  assert(/TRUE QUERY OCCURRENCE/.test(multiResult.boundary||''),'boundary must state that occurrence ordinals refer to true source occurrences');

  const exactResult=await mutherMineRepo({query:exactQuery,limit:10,nearDuplicateThreshold:0.88});
  const exactAudit=exactResult.exactDuplicateAudit||[];
  assert(exactResult.candidateHitCount===2,`expected two exact-replay candidates before suppression, got ${exactResult.candidateHitCount}`);
  assert(exactResult.duplicateSuppressedCount===1,`expected one exact duplicate suppression, got ${exactResult.duplicateSuppressedCount}`);
  assert(exactResult.hitCount===1,`exact replay must remain one material hit after suppression, got ${exactResult.hitCount}`);
  assert(exactAudit.length===1,`expected one exact-duplicate provenance audit record, got ${exactAudit.length}`);
  assert(exactResult.exactDuplicateCrossFamilyCount===1,`expected one cross-family exact replay record, got ${exactResult.exactDuplicateCrossFamilyCount}`);
  const exactRecord=exactAudit[0]||{};
  assert(Boolean(exactRecord.keptPath&&exactRecord.suppressedPath),'exact duplicate audit must retain kept and suppressed paths');
  assert(Boolean(exactRecord.keptSourceFamily&&exactRecord.suppressedSourceFamily),'exact duplicate audit must retain both source families');
  assert(exactRecord.keptSourceFamily!==exactRecord.suppressedSourceFamily,'exact replay fixture should span two source families');
  assert(exactRecord.crossFamily===true,'cross-family exact replay must be explicitly marked');
  assert(exactRecord.keptOccurrenceOrdinal===1&&exactRecord.suppressedOccurrenceOrdinal===1,'exact duplicate audit must retain true occurrence ordinals');
  assert(/SUPPRESSED COPIES NOW RETAIN A BOUNDED SOURCE-PATH/.test(exactResult.boundary||''),'boundary must state exact-replay provenance retention');
  assert(/NOT UPGRADED TO INDEPENDENT EVIDENCE/.test(exactResult.boundary||''),'boundary must deny independence inference from cross-family copies');

  const veinAB=mutherVeinAffinity(veinA,veinB,veinQuery);
  const veinAC=mutherVeinAffinity(veinA,veinC,veinQuery);
  const veinBC=mutherVeinAffinity(veinB,veinC,veinQuery);
  const noiseMax=Math.max(veinAC,veinBC);
  const veinThreshold=Math.max(0.08,Math.min(0.6,(veinAB+noiseMax)/2));
  const veinResult=await mutherMineRepo({query:veinQuery,limit:10,nearDuplicateThreshold:0.95,veinThreshold});
  const veinPaths=(veinResult.hits||[]).map(x=>x.path);
  const mapped=(veinResult.lexicalVeins||[]).find(v=>v.paths.some(p=>p.startsWith('tmp-muther-vein-a/'))&&v.paths.some(p=>p.startsWith('tmp-muther-vein-b/')));
  assert(veinAB>noiseMax,`related vein affinity must exceed unrelated controls: ab=${veinAB}, noise=${noiseMax}`);
  assert(veinResult.candidateHitCount===3,`expected three vein candidates, got ${veinResult.candidateHitCount}`);
  assert(veinResult.hitCount===3,`vein mapping must not merge or suppress the three retained materials, got ${veinResult.hitCount}`);
  assert(Boolean(mapped),'expected lexical vein map to connect related A/B fixtures');
  assert(mapped?.crossFamily===true,'related A/B lexical vein should preserve cross-family provenance');
  assert(!(mapped?.paths||[]).some(p=>p.startsWith('tmp-muther-vein-c/')),'unrelated C fixture must not be pulled into the A/B lexical vein at the calibrated threshold');
  assert(veinResult.lexicalVeinUnclusteredCount>=1,'unrelated retained material should remain visibly unclustered');
  assert(veinPaths.some(p=>p.startsWith('tmp-muther-vein-c/')),'unclustered material must remain a retained hit rather than disappearing');
  assert(/QUERY-REMOVED LEXICAL CO-CONTEXT GRAPH/.test(veinResult.boundary||''),'boundary must disclose query-removed lexical co-context mapping');
  assert(/WITHOUT MERGING OR AMPLIFYING THE MATERIAL/.test(veinResult.boundary||''),'boundary must state that lexical vein mapping does not merge/amplify materials');
  assert(/NOT SEMANTIC VEIN DETECTION/.test(veinResult.boundary||''),'boundary must deny semantic vein inference');

  const output={
    schema:'muther-repo-diversity-test/v0.2.3',
    completedAt:new Date().toISOString(),
    status:failures.length?'FAIL':'PASS',
    capability:'LEXICAL_NEAR_DUPLICATE_CONTAINMENT_PLUS_BOUNDED_MULTI_WINDOW_COVERAGE_PLUS_EXACT_REPLAY_PROVENANCE_RETENTION_PLUS_QUERY_REMOVED_LEXICAL_VEIN_MAPPING',
    unit:{nearSimilarity:Number(nearSimilarity.toFixed(4)),distinctSimilarity:Number(distinctSimilarity.toFixed(4)),threshold:result.nearDuplicateThreshold},
    adversarial:{candidateHitCount:result.candidateHitCount,exactDuplicateSuppressedCount:result.duplicateSuppressedCount,nearDuplicateSuppressedCount:result.nearDuplicateSuppressedCount,lexicallyDistinctCandidateCount:result.lexicallyDistinctCandidateCount,retainedPaths,nearDuplicateAudit:result.nearDuplicateAudit},
    multiWindow:{filesWithMultipleOccurrences:multiResult.filesWithMultipleOccurrences,totalQueryOccurrences:multiResult.totalQueryOccurrences,occurrenceWindowCandidateCount:multiResult.occurrenceWindowCandidateCount,retainedVeinCount:multiHits.length,occurrenceOrdinals:multiOrdinals,skippedTrueOccurrenceOrdinal:2,selectedDistinctFileCount:multiResult.selectedDistinctFileCount,maxWindowsPerFile:multiResult.maxWindowsPerFile,minWindowGap:multiResult.minWindowGap},
    exactReplay:{candidateHitCount:exactResult.candidateHitCount,retainedHitCount:exactResult.hitCount,duplicateSuppressedCount:exactResult.duplicateSuppressedCount,crossFamilyCount:exactResult.exactDuplicateCrossFamilyCount,audit:exactAudit,contentCountedOnce:exactResult.hitCount===1,provenanceRetained:exactAudit.length===1&&Boolean(exactRecord.keptPath&&exactRecord.suppressedPath&&exactRecord.keptSourceFamily&&exactRecord.suppressedSourceFamily)},
    lexicalVeinMap:{veinAB:Number(veinAB.toFixed(4)),veinAC:Number(veinAC.toFixed(4)),veinBC:Number(veinBC.toFixed(4)),threshold:Number(veinThreshold.toFixed(4)),retainedHitCount:veinResult.hitCount,veinCount:veinResult.lexicalVeinCount,crossFamilyVeinCount:veinResult.crossFamilyLexicalVeinCount,unclusteredCount:veinResult.lexicalVeinUnclusteredCount,veins:veinResult.lexicalVeins,edgeAudit:veinResult.lexicalVeinEdges},
    provenance:{selectedSourceFamilies:result.selectedSourceFamilies,sourceFamilyCount:result.sourceFamilyCount,trueOccurrenceOrdinalPreserved:JSON.stringify(multiOrdinals)===JSON.stringify([1,3,4]),exactReplayCrossFamilyProvenanceRetained:exactAudit.length===1&&exactRecord.crossFamily===true,lexicalVeinCrossFamilyProvenanceRetained:Boolean(mapped?.crossFamily)},
    crossOrganRegression:'The main NOSTROMO integration test runs separately in the same workflow and must remain PASS before public promotion. Because the full MUTHER executor object is handed to GUT, lexicalVeins and their source-family/path audit can travel downstream as bounded structural metadata while the original retained hits remain separate nutrients; a lexical vein is not closure authority and does not create extra evidence weight.',
    boundary:'PASS certifies conservative lexical near-duplicate containment, bounded extraction of separated query windows, preservation of each selected window’s true query-occurrence ordinal, bounded provenance retention for exact content copies suppressed from material amplification, and a bounded query-removed lexical co-context graph over retained hits. The vein graph does not merge hits, amplify evidence weight, or certify semantic vein detection, semantic equivalence, exhaustive within-file coverage, source independence, source quality, novelty, factual truth, or Google Drive coverage.',
    failures
  };
  await fs.writeFile(path.join(ROOT,'nostromo/integration/muther-repo-diversity-last-result.json'),JSON.stringify(output,null,2)+'\n','utf8');
  console.log(JSON.stringify(output,null,2));
  if(failures.length)process.exitCode=1;
} finally {
  for(const dir of fixtureDirs)await fs.rm(path.join(ROOT,dir),{recursive:true,force:true});
}
