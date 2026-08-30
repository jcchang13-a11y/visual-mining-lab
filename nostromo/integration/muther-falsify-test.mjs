// MU/TH/UR falsification executor CI v0.1
import fs from 'node:fs/promises';
import {mutherFalsifyRepo} from './muther-falsify-executor.mjs';

const resultPath='nostromo/integration/muther-falsify-last-result.json';
const completedAt=new Date().toISOString();
const failures=[];
try{
  const registry=JSON.parse(await fs.readFile('nostromo/integration/organ-registry.json','utf8'));
  const probe=await mutherFalsifyRepo({
    claim:'All NOSTROMO organ actions are executable.',
    contradictionMarkers:['REQUEST_ONLY'],
    scopePaths:['nostromo/integration/organ-registry.json']
  });
  if(registry.truthRule!=='DISPLAYED STATE MUST FOLLOW EVIDENCE') failures.push({type:'TRUTH_RULE_CHANGED'});
  if(probe.status!=='EXECUTED') failures.push({type:'EXECUTOR_NOT_EXECUTED'});
  if(probe.classification!=='COUNTEREVIDENCE_FOUND'||probe.evidenceCount<1) failures.push({type:'COUNTEREVIDENCE_NOT_FOUND',classification:probe.classification,evidenceCount:probe.evidenceCount});
  if(!probe.evidence.some(e=>e.marker==='REQUEST_ONLY'&&e.occurrenceCount>0)) failures.push({type:'MARKER_EVIDENCE_MISSING'});
  const result={schema:'muther-falsify-ci/v0.1',completedAt,status:failures.length?'FAIL':'PASS',executor:probe.executor,claimFingerprint:probe.claimFingerprint,classification:probe.classification,evidenceCount:probe.evidenceCount,evidence:probe.evidence.map(e=>({path:e.path,marker:e.marker,occurrenceCount:e.occurrenceCount,contentFingerprint:e.contentFingerprint})),failures,boundary:probe.boundary};
  await fs.writeFile(resultPath,JSON.stringify(result,null,2)+'\n','utf8');
  console.log(JSON.stringify(result,null,2));
  if(failures.length) process.exitCode=1;
}catch(error){
  const result={schema:'muther-falsify-ci/v0.1',completedAt,status:'FAIL',failures:[{type:'UNCAUGHT_EXECUTION_ERROR',message:String(error?.message||error)}],boundary:'Failure evidence persisted. No uncompleted falsification probe is counted as PASS.'};
  await fs.writeFile(resultPath,JSON.stringify(result,null,2)+'\n','utf8');
  console.log(JSON.stringify(result,null,2));
  process.exitCode=1;
}
