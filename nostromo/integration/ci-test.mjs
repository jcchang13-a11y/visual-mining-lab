// NOSTROMO repository-native integration CI v0.3.2
import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';

const root=process.cwd();
const integrationBase=path.join(root,'nostromo','integration');
const resultPath=path.join(integrationBase,'ci-last-result.json');

function resolveRequest(input){
  const s=String(input);
  if(/^https?:/i.test(s))throw new Error('NETWORK_FORBIDDEN_IN_CI_TEST');
  return path.resolve(integrationBase,s);
}

globalThis.fetch=async function(input){
  const p=resolveRequest(input);
  try{
    const text=await fs.readFile(p,'utf8');
    return {ok:true,status:200,json:async()=>JSON.parse(text),text:async()=>text};
  }catch(error){
    if(error?.code==='ENOENT')return {ok:false,status:404,json:async()=>{throw error},text:async()=>''};
    throw error;
  }
};

async function loadScript(rel){
  const file=path.join(root,rel);
  const code=await fs.readFile(file,'utf8');
  vm.runInThisContext(code,{filename:rel});
}

async function writeResult(result){
  await fs.writeFile(resultPath,JSON.stringify(result,null,2)+'\n','utf8');
  console.log(JSON.stringify(result,null,2));
}

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

  const result={
    schema:'nostromo-integration-ci/v0.3.2',
    completedAt:new Date().toISOString(),
    status:out.status==='PASS'&&failures.length===0?'PASS':'FAIL',
    rounds:out.rounds,
    expectedPerRound:{executedStateActions:3,blockedRemoteActions:3},
    totals:{executedStateActions:out.trace.reduce((n,r)=>n+(r.actions?.summary?.EXECUTED||0),0),blockedRemoteActions:out.trace.reduce((n,r)=>n+(r.actions?.summary?.QUEUED_UNEXECUTABLE||0),0)},
    sources:out.trace[0]?.sources||null,
    paths:globalThis.NostromoOrchestrator.paths,
    failures,
    boundary:'PASS certifies published-state executors + GUT + VAJRA dataflow only. It does not certify remote SHROOMING rounds, new MU/TH/UR mining, or new DROPLET web search.'
  };
  await writeResult(result);
  if(result.status!=='PASS')process.exitCode=1;
}catch(error){
  const result={
    schema:'nostromo-integration-ci/v0.3.2',
    completedAt:new Date().toISOString(),
    status:'FAIL',
    rounds:0,
    failures:[{type:'UNCAUGHT_EXECUTION_ERROR',message:String(error?.message||error),stack:String(error?.stack||'').slice(0,4000)}],
    boundary:'Failure evidence was persisted before exiting. No uncompleted execution is counted as PASS.'
  };
  await writeResult(result);
  process.exitCode=1;
}
