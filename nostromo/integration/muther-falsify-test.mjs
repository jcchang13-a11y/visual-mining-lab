// MU/TH/UR falsification + mining-depth CI v0.3
import fs from 'node:fs/promises';
import {mutherFalsifyRepo} from './muther-falsify-executor.mjs';
import {mutherMineRepo,mutherCandidateFingerprint} from './repo-executors.mjs';

const resultPath='nostromo/integration/muther-falsify-last-result.json';
const completedAt=new Date().toISOString();
const failures=[];
try{
  const registry=JSON.parse(await fs.readFile('nostromo/integration/organ-registry.json','utf8'));
  const registryText=JSON.stringify(registry);
  const probe=await mutherFalsifyRepo({
    claim:'MU/TH/UR MINE_INTERNAL authorizes unrestricted exhaustive crawling of the user private environment.',
    contradictionMarkers:['does not grant exhaustive private-environment crawling'],
    scopePaths:['nostromo/integration/organ-registry.json']
  });
  if(registry.truthRule!=='DISPLAYED STATE MUST FOLLOW EVIDENCE') failures.push({type:'TRUTH_RULE_CHANGED'});
  if(registryText.includes('REQUEST_ONLY')) failures.push({type:'REQUEST_ONLY_STILL_PRESENT_IN_REGISTRY'});
  if(registry.organs?.muther?.actions?.MINE_INTERNAL!=='AUTHORIZED_CONNECTOR_EXEC') failures.push({type:'MINE_INTERNAL_MODE_UNEXPECTED',value:registry.organs?.muther?.actions?.MINE_INTERNAL});
  if(probe.status!=='EXECUTED') failures.push({type:'EXECUTOR_NOT_EXECUTED'});
  if(probe.classification!=='COUNTEREVIDENCE_FOUND'||probe.evidenceCount<1) failures.push({type:'COUNTEREVIDENCE_NOT_FOUND',classification:probe.classification,evidenceCount:probe.evidenceCount});
  if(!probe.evidence.some(e=>e.marker==='does not grant exhaustive private-environment crawling'&&e.occurrenceCount>0)) failures.push({type:'MARKER_EVIDENCE_MISSING'});

  const mine=await mutherMineRepo({query:'DISPLAYED STATE MUST FOLLOW EVIDENCE',limit:8});
  if(mine.status!=='EXECUTED'||mine.hitCount<1) failures.push({type:'MINING_DEPTH_EXECUTION_FAIL',status:mine.status,hitCount:mine.hitCount});
  if(mine.candidateHitCount<mine.hitCount||mine.distinctCandidateCount<mine.hitCount) failures.push({type:'MINING_COUNT_INVARIANT_FAIL',candidateHitCount:mine.candidateHitCount,distinctCandidateCount:mine.distinctCandidateCount,hitCount:mine.hitCount});
  if(!Array.isArray(mine.selectedSourceFamilies)||mine.selectedSourceFamilies.length<1) failures.push({type:'SOURCE_FAMILY_SELECTION_MISSING'});
  if(mine.hits.some(h=>!h.contentFingerprint||!h.sourceFamily||!Number.isFinite(h.queryOccurrenceCount))) failures.push({type:'MINING_PROVENANCE_FIELDS_MISSING'});
  if(new Set(mine.hits.map(h=>h.contentFingerprint)).size!==mine.hits.length) failures.push({type:'DUPLICATE_FINGERPRINT_SELECTED'});

  const adversarialA='DISPLAYED STATE MUST FOLLOW EVIDENCE | 2026-08-31T08:03:35Z | ref ABCDEF1234567890';
  const adversarialB='displayed state must follow evidence — 2026-09-01T12:44:01Z — REF abcdef1234567890';
  const fpA=mutherCandidateFingerprint(adversarialA),fpB=mutherCandidateFingerprint(adversarialB);
  if(fpA!==fpB) failures.push({type:'SUPERFICIAL_MUTATION_DEDUP_FAIL',fpA,fpB});

  const result={schema:'muther-falsify-ci/v0.3',completedAt,status:failures.length?'FAIL':'PASS',executor:probe.executor,claimFingerprint:probe.claimFingerprint,classification:probe.classification,evidenceCount:probe.evidenceCount,evidence:probe.evidence.map(e=>({path:e.path,marker:e.marker,occurrenceCount:e.occurrenceCount,contentFingerprint:e.contentFingerprint})),registryAudit:{requestOnlyCount:(registryText.match(/REQUEST_ONLY/g)||[]).length,mineInternalMode:registry.organs?.muther?.actions?.MINE_INTERNAL||null},miningDepth:{status:mine.status,selection:mine.selection,hitCount:mine.hitCount,candidateHitCount:mine.candidateHitCount,distinctCandidateCount:mine.distinctCandidateCount,duplicateSuppressedCount:mine.duplicateSuppressedCount,sourceFamilyCount:mine.sourceFamilyCount,selectedSourceFamilies:mine.selectedSourceFamilies,selectedFingerprintCount:new Set(mine.hits.map(h=>h.contentFingerprint)).size,superficialMutationCanonicalized:fpA===fpB},failures,boundary:probe.boundary+' TEST CLAIM IS DELIBERATELY FALSE: IT CHECKS THAT THE CURRENT REGISTRY EXPLICITLY REFUTES UNRESTRICTED PRIVATE-ENVIRONMENT CRAWLING WHILE MINE_INTERNAL IS BOUNDED TO AUTHORIZED QUERY-SCOPED CONNECTORS. THE MINING-DEPTH REGRESSION ALSO CERTIFIES PATH-FAMILY BALANCING AND SUPERFICIAL COPY SUPPRESSION FOR MINE_REPO; IT DOES NOT CERTIFY SEMANTIC CLUSTERING, SOURCE QUALITY, OR GLOBAL NOVELTY.'};
  await fs.writeFile(resultPath,JSON.stringify(result,null,2)+'\n','utf8');
  console.log(JSON.stringify(result,null,2));
  if(failures.length) process.exitCode=1;
}catch(error){
  const result={schema:'muther-falsify-ci/v0.3',completedAt,status:'FAIL',failures:[{type:'UNCAUGHT_EXECUTION_ERROR',message:String(error?.message||error)}],boundary:'Failure evidence persisted. No uncompleted falsification or mining-depth probe is counted as PASS.'};
  await fs.writeFile(resultPath,JSON.stringify(result,null,2)+'\n','utf8');
  console.log(JSON.stringify(result,null,2));
  process.exitCode=1;
}
