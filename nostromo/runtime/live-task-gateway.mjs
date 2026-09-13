// ZENOMORPH live task gateway v0.1.0
// Stable body performs the official task. Growing/shadow may compare, never control official output.
import {createRuntimeState,runTask} from './body-router.mjs';
import {runActiveExecutorLoop} from '../integration/active-orchestrator.mjs';

function normalizeTask(task={}){
  const input=String(task.input??task.text??task.prompt??'').trim();
  if(!input) throw new Error('LIVE_TASK_INPUT_REQUIRED');
  return {
    id:String(task.id||'live-task'),
    input,
    kind:String(task.kind||'general'),
    mineQuery:String(task.mineQuery||'ZENOMORPH'),
    verifyUrl:String(task.verifyUrl||'https://github.com/jcchang13-a11y/visual-mining-lab'),
    rounds:Math.max(1,Math.min(10,Number(task.rounds)||3)),
    provenance:task.provenance||null
  };
}

async function activeExecutor({task,mode}){
  const t=normalizeTask(task);
  const seed=[
    `LIVE_TASK_ID=${t.id}`,
    `LIVE_TASK_KIND=${t.kind}`,
    `RUNTIME_MODE=${mode}`,
    t.provenance?`TASK_PROVENANCE=${JSON.stringify(t.provenance)}`:'TASK_PROVENANCE=UNDECLARED',
    'TASK_INPUT:',
    t.input
  ].join('\n');
  const result=await runActiveExecutorLoop({
    rounds:t.rounds,
    seed,
    mineQuery:t.mineQuery,
    verifyUrl:t.verifyUrl
  });
  return {
    schema:'zenomorph-live-work-result/v0.1.0',
    taskId:t.id,
    kind:t.kind,
    mode,
    result,
    authority:mode==='stable'?'OFFICIAL_STABLE_OUTPUT':'SHADOW_ONLY_NO_OUTPUT_AUTHORITY'
  };
}

export async function runLiveTask({task,state}={}){
  const runtimeState=state||createRuntimeState({
    stableCapabilities:[{id:'five-organ-active-loop',kind:'orchestration'}]
  });
  return runTask({
    task:normalizeTask(task),
    state:runtimeState,
    stableExecutor:activeExecutor,
    growingExecutor:activeExecutor
  });
}

export {normalizeTask};
