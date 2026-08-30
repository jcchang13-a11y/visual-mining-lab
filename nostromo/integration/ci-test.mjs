// NOSTROMO repository-native integration CI v1.3
import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import {shroomSandboxReadingRound,shroomGreenhousePoseQuestion,mutherMineRepo,dropletVerifyUrl} from './repo-executors.mjs';
import {runActiveExecutorLoop} from './active-orchestrator.mjs';
import {loadConnectorEvidence} from './connector-evidence.mjs';

const root=process.cwd();
const integrationBase=path.join(root,'nostromo','integration');
const resultPath=path.join(integrationBase,'ci-last-result.json');
const formalResultPath=path.join(integrationBase,'formal-round-last-result.json');
function resolveRequest(input){const s=String(input);if(/^https?:/i.test(s))throw new Error('NETWORK_FORBIDDEN_IN_CORE_CI_FETCH');return path.resolve(integrationBase,s);}
globalThis.fetch=async function(input){const p=resolveRequest(input);try{const text=await fs.readFile(p,'utf8');return {ok:true,status:200,json:async()=>JSON.parse(text),text:async()=>text};}catch(error){if(error?.code==='ENOENT')return {ok:false,status:404,json:async()=>{throw error},text:async()=>''};throw error;}};
async function loadScript(rel){const code=await fs.readFile(path.join(root,rel),'utf8');vm.runInThisContext(code,{filename:rel});}
async function writeResult(result){await fs.writeFile(resultPath,JSON.stringify(result,null,2)+'\n','utf8');console.log(JSON.stringify(result,null,2));}

try{
  await loadScript('nostromo/gut/gut-engine.js');
  await loadScript('nostromo/vajra/vajra-engine.js');
  await loadScript('nostromo/integration/state-executors.js');
  await loadScript('nostromo/integration/action-adapters.js');
  await loadScript('nostromo/integration/orchestrator.js');
  const out=await globalThis.NostromoOrchestrator.run(50,'NOSTROMO CI organ integration');
  const failures=[];
  for(const r of out.trace){
    if(r.status!=='PASS')failures.push({round:r.round,type:'ROUND_FAIL'});
    if((r.actions?.summary?.EXECUTED||0)!==3)failures.push({round:r.round,type:'EXEC_COUNT',value:r.actions?.summary?.EXECUTED||0});
    if((r.actions?.summary?.QUEUED_UNEXECUTABLE||0)!==3)failures.push({round:r.round,type:'BLOCKED_COUNT',value:r.actions?.summary?.QUEUED_UNEXECUTABLE||0});
    if(!r.sources?.shroomingUpdated)failures.push({round:r.round,type:'SHROOM_SOURCE_MISSING'});
    if(!r.sources?.mutherUpdated)failures.push({round:r.round,type:'MUTHER_SOURCE_MISSING'});
    if(!r.sources?.dropletUpdated)failures.push({round:r.round,type:'DROPLET_SOURCE_MISSING'});
  }

  const formal=JSON.parse(await fs.readFile(formalResultPath,'utf8'));
  if(formal.status!=='PASS')failures.push({type:'FORMAL_CHAIN_REJECTED',detail:formal.failures||[]});
  const expectedFormalChain=['R111','R112','R113'];
  if(JSON.stringify(formal.chain)!==JSON.stringify(expectedFormalChain))failures.push({type:'FORMAL_CHAIN_UNEXPECTED',expected:expectedFormalChain,chain:formal.chain});
  if(formal.reversibility?.classification!=='PARTIAL_RETURN'||formal.reversibility?.exactReturn!==false||Number(formal.reversibility?.jaccard)!==0.5)failures.push({type:'FORMAL_REVERSIBILITY_UNEXPECTED',reversibility:formal.reversibility||null});
  if(formal.parentControl?.status!=='PASS'||formal.parentControl?.classification!=='PARENT_INVARIANT_UNDER_CURRENT_VISIBILITY_RULE'||formal.parentControl?.sameParticipants!==true||formal.parentControl?.provenanceDiffers!==true)failures.push({type:'FORMAL_PARENT_CONTROL_UNEXPECTED',parentControl:formal.parentControl||null});

  const sandbox=await shroomSandboxReadingRound({text:'若見諸相非相，即見如來。',agents:10,round:1});
  const greenhouseProbe=await shroomGreenhousePoseQuestion({question:'「我們」在這裡指的是誰？'});
  const mine=await mutherMineRepo({query:'DISPLAYED STATE MUST FOLLOW EVIDENCE',limit:8});
  let verify=null; try{verify=await dropletVerifyUrl({url:'https://github.com/jcchang13-a11y/visual-mining-lab'});}catch(error){verify={status:'FAILED',error:String(error?.message||error)};}
  if(sandbox.status!=='EXECUTED'||sandbox.count!==10)failures.push({type:'SHROOM_SANDBOX_EXECUTOR_FAIL'});
  if(greenhouseProbe.status!=='EXECUTED'||greenhouseProbe.count!==10||greenhouseProbe.sourceRounds!=='R101-R110')failures.push({type:'SHROOM_GREENHOUSE_PROBE_FAIL',count:greenhouseProbe.count,sourceRounds:greenhouseProbe.sourceRounds});
  if(mine.status!=='EXECUTED'||mine.hitCount<1)failures.push({type:'MUTHER_REPO_EXECUTOR_FAIL',hitCount:mine.hitCount});
  if(verify.status!=='EXECUTED')failures.push({type:'DROPLET_URL_EXECUTOR_FAIL',detail:verify});

  const connector=await loadConnectorEvidence();
  if(connector.status!=='ACCEPTED')failures.push({type:'CONNECTOR_EVIDENCE_REJECTED',detail:connector.failures});
  if(connector.actions?.muther?.status!=='EXECUTED')failures.push({type:'MUTHER_DRIVE_CONNECTOR_EVIDENCE_FAIL'});
  if(connector.actions?.mutherInternal?.status!=='EXECUTED'||connector.actions?.mutherInternal?.sourceClass!=='GOOGLE_DRIVE_AUTHORIZED'||connector.actions?.mutherInternal?.returnedCount<1)failures.push({type:'MUTHER_INTERNAL_CONNECTOR_EVIDENCE_FAIL',detail:connector.actions?.mutherInternal||null});
  if(connector.actions?.droplet?.status!=='EXECUTED')failures.push({type:'DROPLET_WEB_CONNECTOR_EVIDENCE_FAIL'});
  if(connector.actions?.dropletVerify?.status!=='EXECUTED')failures.push({type:'DROPLET_VERIFY_CONNECTOR_EVIDENCE_FAIL'});

  const active=await runActiveExecutorLoop({rounds:10,seed:'NOSTROMO active executor integration',mineQuery:'NOSTROMO',verifyUrl:'https://github.com/jcchang13-a11y/visual-mining-lab'});
  if(active.status!=='PASS'||active.completedRounds!==10)failures.push({type:'ACTIVE_EXECUTOR_LOOP_FAIL',status:active.status,completedRounds:active.completedRounds});
  if(active.connectorHandoff?.status!=='ACCEPTED'||active.connectorHandoff?.actionsAccepted!==4)failures.push({type:'CONNECTOR_HANDOFF_FAIL',detail:active.connectorHandoff});
  for(const r of active.trace){
    if(r.executors?.shrooming?.status!=='EXECUTED')failures.push({round:r.round,type:'ACTIVE_SHROOMING_FAIL'});
    if(r.executors?.greenhouseProbe?.status!=='EXECUTED'||r.executors?.greenhouseProbe?.count!==10)failures.push({round:r.round,type:'ACTIVE_GREENHOUSE_PROBE_FAIL'});
    if(r.executors?.muther?.status!=='EXECUTED')failures.push({round:r.round,type:'ACTIVE_MUTHER_FAIL'});
    if(r.executors?.droplet?.status!=='EXECUTED')failures.push({round:r.round,type:'ACTIVE_DROPLET_FAIL'});
    if(!r.gut?.absorbed)failures.push({round:r.round,type:'ACTIVE_GUT_EMPTY'});
  }

  const result={
    schema:'nostromo-integration-ci/v1.3',completedAt:new Date().toISOString(),status:out.status==='PASS'&&active.status==='PASS'&&connector.status==='ACCEPTED'&&formal.status==='PASS'&&failures.length===0?'PASS':'FAIL',rounds:out.rounds,
    expectedPerRound:{executedStateActions:3,blockedRemoteActions:3},
    totals:{executedStateActions:out.trace.reduce((n,r)=>n+(r.actions?.summary?.EXECUTED||0),0),blockedRemoteActions:out.trace.reduce((n,r)=>n+(r.actions?.summary?.QUEUED_UNEXECUTABLE||0),0)},
    formalRoundChain:{status:formal.status,chain:formal.chain,reversibility:formal.reversibility||null,parentControl:formal.parentControl||null,rounds:formal.rounds?.map(r=>({round:r.round,previousRound:r.previousRound,parentBlobSha:r.parentBlobSha,provenanceFingerprint:r.provenanceFingerprint,executorCompatibility:r.executorCompatibility,status:r.status}))||[],boundary:formal.boundary},
    repositoryNativeExecutors:{shrooming:{status:sandbox.status,count:sandbox.count,boundary:sandbox.boundary},greenhouseProbe:{status:greenhouseProbe.status,count:greenhouseProbe.count,sourceRounds:greenhouseProbe.sourceRounds,boundary:greenhouseProbe.boundary},muther:{status:mine.status,hitCount:mine.hitCount,boundary:mine.boundary},droplet:{status:verify.status,statusCode:verify.statusCode||null,boundary:verify.boundary||null}},
    connectorExecutors:{status:connector.status,completedAt:connector.completedAt,mutherDrive:{status:connector.actions?.muther?.status,returnedCount:connector.actions?.muther?.returnedCount,boundary:connector.actions?.muther?.boundary},mutherInternal:{status:connector.actions?.mutherInternal?.status,sourceClass:connector.actions?.mutherInternal?.sourceClass,returnedCount:connector.actions?.mutherInternal?.returnedCount,boundary:connector.actions?.mutherInternal?.boundary},dropletWeb:{status:connector.actions?.droplet?.status,evidenceCount:connector.actions?.droplet?.evidenceCount,boundary:connector.actions?.droplet?.boundary},dropletVerify:{status:connector.actions?.dropletVerify?.status,evidenceCount:connector.actions?.dropletVerify?.evidenceCount,claim:connector.actions?.dropletVerify?.claim,boundary:connector.actions?.dropletVerify?.boundary},boundary:connector.boundary},
    activeExecutorLoop:{status:active.status,requestedRounds:active.requestedRounds,completedRounds:active.completedRounds,roundsWithAllFourRepoExecutors:active.trace.filter(r=>r.executors.shrooming.status==='EXECUTED'&&r.executors.greenhouseProbe.status==='EXECUTED'&&r.executors.muther.status==='EXECUTED'&&r.executors.droplet.status==='EXECUTED').length,gutAbsorbedTotal:active.trace.reduce((n,r)=>n+(r.gut?.absorbed||0),0),connectorHandoff:active.connectorHandoff,lastCarry:active.trace.at(-1)?.carryOut||null,boundary:active.boundary},
    sources:out.trace[0]?.sources||null,paths:globalThis.NostromoOrchestrator.paths,failures,
    boundary:'PASS certifies 50-round published-state integration, deterministic reproducibility and parent-blob continuity for R111→R112→R113, the R111↔R113 PARTIAL_RETURN measurement, a matched-parent audit showing that repo-executors v0.9 participant selection is parent-invariant when task and intervention are held constant, a 10-round closed loop of repository-native executors, and successful handoff into GUT of persisted Google Drive query evidence for MINE_DRIVE_QUERY, bounded authorized-source MINE_INTERNAL, public-web search, and claim-specific DROPLET verification. MINE_INTERNAL is certified only for explicit query-scoped authorized connector sources; the current verified source is Google Drive. It does not certify exhaustive private-environment mining, cross-source crawling, ten independent live LLM processes, causal reversibility outside this deterministic model, or that GitHub Actions itself can invoke private connectors or search engines.'
  };
  await writeResult(result); if(result.status!=='PASS')process.exitCode=1;
}catch(error){const result={schema:'nostromo-integration-ci/v1.3',completedAt:new Date().toISOString(),status:'FAIL',rounds:0,failures:[{type:'UNCAUGHT_EXECUTION_ERROR',message:String(error?.message||error),stack:String(error?.stack||'').slice(0,4000)}],boundary:'Failure evidence was persisted before exiting. No uncompleted execution is counted as PASS.'};await writeResult(result);process.exitCode=1;}
