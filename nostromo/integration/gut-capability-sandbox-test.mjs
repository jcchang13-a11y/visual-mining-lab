import fs from 'node:fs';
import { runIsolatedCapabilityTrial, capabilitySandboxBoundary } from '../gut/capability-sandbox.mjs';

const failures=[];
const expect=(ok,msg)=>{if(!ok)failures.push(msg);};
const baseCandidate={
  kind:'capability',
  adapterName:'Bounded Counter Adapter',
  adapterId:'bounded-counter-v1',
  source:'controlled-fixture-provider',
  provenanceFingerprint:'sandbox-fixture-prov-001',
  permissions:['read:fixture-only'],
  contract:{inputType:'object',outputType:'object'}
};
const registry={
  'bounded-counter-v1': input=>({count:Array.isArray(input?.items)?input.items.length:0}),
  'nondeterministic-v1': ()=>({nonce:Math.random()}),
  'async-v1': async input=>({seen:!!input}),
  'mutator-v1': input=>{input.changed=true;return {changed:true};}
};
const input={items:['a','b','c']};
const pass=runIsolatedCapabilityTrial(baseCandidate,input,{registry,context:{provenanceFingerprint:'sandbox-fixture-prov-001'}});
expect(pass.status==='PASS','complete host-registered candidate should PASS isolated trial');
expect(pass.assimilationStage==='ISOLATED_TEST_PASSED','PASS should reach ISOLATED_TEST_PASSED');
expect(pass.bodyAdmission===false&&pass.installed===false,'isolated PASS must not install/admit body capability');
expect(pass.deterministic===true,'bounded adapter should replay deterministically');
expect(pass.inputStable===true&&input.changed===undefined,'sandbox must not mutate caller input');
expect(pass.contractCheck?.ok===true,'declared output contract should pass');
expect(pass.provenanceFingerprint==='sandbox-fixture-prov-001','provenance fingerprint should survive trial');

const missing=runIsolatedCapabilityTrial({...baseCandidate,adapterId:'missing-v1'},input,{registry});
expect(missing.status==='BLOCKED'&&missing.executed===false,'unregistered adapter must be blocked without execution');

const nondeterministic=runIsolatedCapabilityTrial({...baseCandidate,adapterId:'nondeterministic-v1',adapterName:'Nondeterministic Adapter'},input,{registry});
expect(nondeterministic.status==='HOLD'&&nondeterministic.deterministic===false,'non-deterministic replay must not pass');
expect(nondeterministic.bodyAdmission===false,'non-deterministic candidate must not enter body');

const asyncTrial=runIsolatedCapabilityTrial({...baseCandidate,adapterId:'async-v1',adapterName:'Async Adapter'},input,{registry});
expect(asyncTrial.status==='QUARANTINE','async adapter must be quarantined by v0.1 sandbox');

const mutator=runIsolatedCapabilityTrial({...baseCandidate,adapterId:'mutator-v1',adapterName:'Mutating Adapter'},input,{registry});
expect(mutator.status==='FAILED','adapter attempting to mutate frozen input must fail');
expect(input.changed===undefined,'mutation attempt must not escape sandbox clone');

const executableDescriptor=runIsolatedCapabilityTrial({...baseCandidate,command:'rm -rf /'},input,{registry});
expect(executableDescriptor.status==='BLOCKED'&&executableDescriptor.executed===false,'candidate carrying executable payload must be blocked before sandbox execution');

const result={
  schema:'zenomorph-gut-capability-sandbox-test/v0.1',
  completedAt:new Date().toISOString(),
  status:failures.length?'FAIL':'PASS',
  capability:'CONTROLLED_HOST_REGISTERED_FOREIGN_CAPABILITY_ISOLATED_TRIAL',
  cases:{pass,missing,nondeterministic,asyncTrial,mutator,executableDescriptor},
  boundary:capabilitySandboxBoundary,
  failures
};
fs.writeFileSync(new URL('./gut-capability-sandbox-last-result.json',import.meta.url),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));
if(failures.length)process.exit(1);
