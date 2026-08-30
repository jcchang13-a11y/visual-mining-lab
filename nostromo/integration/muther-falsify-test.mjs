// MU/TH/UR falsification executor CI v0.2
import fs from 'node:fs/promises';
import {mutherFalsifyRepo} from './muther-falsify-executor.mjs';

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
  const result={schema:'muther-falsify-ci/v0.2',completedAt,status:failures.length?'FAIL':'PASS',executor:probe.executor,claimFingerprint:probe.claimFingerprint,classification:probe.classification,evidenceCount:probe.evidenceCount,evidence:probe.evidence.map(e=>({path:e.path,marker:e.marker,occurrenceCount:e.occurrenceCount,contentFingerprint:e.contentFingerprint})),registryAudit:{requestOnlyCount:(registryText.match(/REQUEST_ONLY/g)||[]).length,mineInternalMode:registry.organs?.muther?.actions?.MINE_INTERNAL||null},failures,boundary:probe.boundary+' TEST CLAIM IS DELIBERATELY FALSE: IT CHECKS THAT THE CURRENT REGISTRY EXPLICITLY REFUTES UNRESTRICTED PRIVATE-ENVIRONMENT CRAWLING WHILE MINE_INTERNAL IS BOUNDED TO AUTHORIZED QUERY-SCOPED CONNECTORS.'};
  await fs.writeFile(resultPath,JSON.stringify(result,null,2)+'\n','utf8');
  console.log(JSON.stringify(result,null,2));
  if(failures.length) process.exitCode=1;
}catch(error){
  const result={schema:'muther-falsify-ci/v0.2',completedAt,status:'FAIL',failures:[{type:'UNCAUGHT_EXECUTION_ERROR',message:String(error?.message||error)}],boundary:'Failure evidence persisted. No uncompleted falsification probe is counted as PASS.'};
  await fs.writeFile(resultPath,JSON.stringify(result,null,2)+'\n','utf8');
  console.log(JSON.stringify(result,null,2));
  process.exitCode=1;
}
