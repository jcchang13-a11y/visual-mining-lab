import fs from 'node:fs';
import { runHeldoutCrossOrganStress, heldoutStressBoundary } from '../gut/capability-heldout-stress.mjs';
const failures=[]; const expect=(ok,msg)=>{if(!ok)failures.push(msg);};
const candidate={kind:'capability',adapterName:'Bounded Counter Adapter',adapterId:'bounded-counter-v1',source:'controlled-fixture-provider',provenanceFingerprint:'heldout-prov-001',permissions:['read:fixture-only'],contract:{inputType:'object',outputType:'object'}};
const capabilityRegistry={'bounded-counter-v1':input=>({count:Array.isArray(input?.items)?input.items.length:0})};
const organRegistry={
  'vajra-heldout-v1':({foreignSignal})=>({route:Number(foreignSignal?.count||0)>=3?'SPLIT':'HOLD'}),
  'insensitive-v1':()=>({route:'HOLD'})
};
const input={items:['unseen-a','unseen-b','unseen-c','unseen-d']};
const pass=runHeldoutCrossOrganStress(candidate,input,{capabilityRegistry,organRegistry,downstreamOrganId:'vajra-heldout-v1',baselineSignal:null,context:{provenanceFingerprint:'heldout-prov-001'}});
expect(pass.status==='PASS','held-out foreign signal should change downstream decision');
expect(pass.behaviorChanged===true,'behaviorChanged must be true');
expect(pass.baselineDecision?.route==='HOLD'&&pass.augmentedDecision?.route==='SPLIT','baseline HOLD should become SPLIT only with foreign signal');
expect(pass.bodyAdmission===false&&pass.installed===false&&pass.persistentMutation===false,'held-out PASS must not admit/install/mutate body');
expect(pass.provenanceFingerprint==='heldout-prov-001','provenance must survive cross-organ stress');
const noChange=runHeldoutCrossOrganStress(candidate,input,{capabilityRegistry,organRegistry,downstreamOrganId:'insensitive-v1',context:{provenanceFingerprint:'heldout-prov-001'}});
expect(noChange.status==='HOLD'&&noChange.behaviorChanged===false,'no downstream behavior change must remain HOLD');
const missingOrgan=runHeldoutCrossOrganStress(candidate,input,{capabilityRegistry,organRegistry,downstreamOrganId:'missing-v1'});
expect(missingOrgan.status==='BLOCKED'&&missingOrgan.downstreamExecuted===false,'unregistered downstream organ must be blocked');
const badCandidate=runHeldoutCrossOrganStress({...candidate,command:'execute-me'},input,{capabilityRegistry,organRegistry,downstreamOrganId:'vajra-heldout-v1'});
expect(badCandidate.status==='BLOCKED'&&badCandidate.downstreamExecuted===false,'candidate blocked by isolated gate must never reach downstream organ');
const result={schema:'zenomorph-capability-heldout-stress-test/v0.1',completedAt:new Date().toISOString(),status:failures.length?'FAIL':'PASS',capability:'EPHEMERAL_FOREIGN_CAPABILITY_DOWNSTREAM_BEHAVIOR_CHANGE',cases:{pass,noChange,missingOrgan,badCandidate},boundary:heldoutStressBoundary,failures};
fs.writeFileSync(new URL('./gut-capability-heldout-stress-last-result.json',import.meta.url),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2)); if(failures.length)process.exit(1);
