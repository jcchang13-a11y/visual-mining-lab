import assert from 'node:assert/strict';
import {normalizeTask,stableCapabilityDirective} from './live-task-gateway.mjs';

const task=normalizeTask({id:'probe',kind:'research',input:'analyze this material',rounds:99,provenance:{source:'test'}});
assert.equal(task.id,'probe');
assert.equal(task.kind,'research');
assert.equal(task.input,'analyze this material');
assert.equal(task.rounds,10);
assert.deepEqual(task.provenance,{source:'test'});
assert.throws(()=>normalizeTask({input:'   '}),/LIVE_TASK_INPUT_REQUIRED/);

const directive=stableCapabilityDirective({capabilities:[{
  id:'secret-source-derived-id',
  kind:'MUTHER_AFFINITY_TOPOLOGY_ROUTING_PRIOR',
  parameters:{similarityMedian:0.1508,spanMedian:4,affinityCount:40,pressureScale:0.5},
  sourceMealId:'must-not-leak',
  sourceSha256:'must-not-leak',
  authority:'STABLE'
},{kind:'SHADOW_ONLY',parameters:{x:1},authority:'SHADOW'}]});
assert.match(directive,/MUTHER_AFFINITY_TOPOLOGY_ROUTING_PRIOR/);
assert.match(directive,/"pressureScale":0.5/);
assert.doesNotMatch(directive,/secret-source-derived-id|must-not-leak|SHADOW_ONLY/);
assert.match(directive,/CONTENT_AGNOSTIC_ROUTING_PRIOR_ONLY/);
assert.equal(stableCapabilityDirective({capabilities:[]}), 'STABLE_STRUCTURAL_CAPABILITIES=[]');
console.log('live task gateway boundary: PASS');
