import assert from 'node:assert/strict';
import {normalizeTask} from './live-task-gateway.mjs';

const task=normalizeTask({id:'probe',kind:'research',input:'analyze this material',rounds:99,provenance:{source:'test'}});
assert.equal(task.id,'probe');
assert.equal(task.kind,'research');
assert.equal(task.input,'analyze this material');
assert.equal(task.rounds,10);
assert.deepEqual(task.provenance,{source:'test'});
assert.throws(()=>normalizeTask({input:'   '}),/LIVE_TASK_INPUT_REQUIRED/);
console.log('live task gateway boundary: PASS');
