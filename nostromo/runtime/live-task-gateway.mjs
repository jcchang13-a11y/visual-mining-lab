// ZENOMORPH live task gateway v0.1.1
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

// Convert only canonical Stable structural capability fields into a runtime directive.
// Source meal identity/text, topic labels, claims, summaries and connector payloads are deliberately excluded.
export function stableCapabilityDirective(body={}){
  const caps=(Array.isArray(body?.capabilities)?body.capabilities:[])
    .filter(cap=>cap&&cap.authority==='STABLE')
    .map(cap=>({kind:String(cap.kind||'unknown'),parameters:cap.parameters&&typeof cap.parameters==='object'?cap.parameters:{}}));
  if(!caps.length) return 'STABLE_STRUCTURAL_CAPABILITIES=[]';
  return [
    `STABLE_STRUCTURAL_CAPABILITIES=${JSON.stringify(caps)}`,
    'STABLE_STRUCTURAL_POLICY=APPLY_AS_CONTENT_AGNOSTIC_ROUTING_PRIOR_ONLY; DO_NOT INTERPRET AS SOURCE CONTENT, TOPIC, CLAIM, SUMMARY, OR CONNECTOR EVIDENCE.'
  ].join('\n');
}

async function activeExecutor({task,mode,body}){
  const t=normalizeTask(task);
  const seed=[
    `LIVE_TASK_ID=${t.id}`,
    `LIVE_TASK_KIND=${t.kind}`,
    `RUNTIME_MODE=${mode}`,
    stableCapabilityDirective(body),
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
    schema:'zenomorph-live-work-result/v0.1.1',
    taskId:t.id,
    kind:t.kind,
    mode,
    stableStructuralCapabilityCount:Array.isArray(body?.capabilities)?body.capabilities.filter(x=>x?.authority==='STABLE').length:0,
    result,
    authority:mode==='stable'?'OFFICIAL_STABLE_OUTPUT':'SHADOW_ONLY_NO_OUTPUT_AUTHORITY'
  };
}

export async function runLiveTask({task,state}={}){
  // With no explicit test state, load the canonical Stable registry from body-router.
  // Do not replace it with a hard-coded legacy capability list.
  const runtimeState=state||createRuntimeState();
  return runTask({
    task:normalizeTask(task),
    state:runtimeState,
    stableExecutor:activeExecutor,
    growingExecutor:activeExecutor
  });
}

export {normalizeTask};
