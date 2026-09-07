import fs from 'node:fs';
import { runRepeatedHeldoutStress, repeatedHeldoutBoundary } from '../gut/capability-repeated-stress.mjs';

const failures=[];
const expect=(ok,msg)=>{if(!ok)failures.push(msg);};

const candidate={
  kind:'capability',
  adapterName:'Bounded Counter Adapter',
  adapterId:'bounded-counter-v1',
  source:'controlled-fixture-provider',
  provenanceFingerprint:'repeated-heldout-prov-001',
  permissions:['read:fixture-only'],
  contract:{inputType:'object',outputType:'object'}
};
const capabilityRegistry={
  'bounded-counter-v1':input=>({count:Array.isArray(input?.items)?input.items.length:0})
};
const organRegistry={
  'vajra-profile-v1':({foreignSignal})=>({route:Number(foreignSignal?.count||0)>=3?'SPLIT':'HOLD'})
};
const cases=[
  {id:'positive-four',input:{items:['a','b','c','d']},expectedChange:true},
  {id:'negative-one',input:{items:['x']},expectedChange:false},
  {id:'positive-three',input:{items:['m','n','o']},expectedChange:true}
];
const options={capabilityRegistry,organRegistry,downstreamOrganId:'vajra-profile-v1',context:{provenanceFingerprint:'repeated-heldout-prov-001'}};

const pass=runRepeatedHeldoutStress(candidate,cases,options);
expect(pass.status==='PASS','mixed positive/negative repeated held-out profile should pass');
expect(pass.assimilationStage==='REPEATED_HELDOUT_PROFILE_VERIFIED','pass must reach repeated held-out profile stage');
expect(pass.executedCases===3&&pass.distinctInputs===true,'all three held-out inputs must be independently fingerprinted');
expect(pass.hasPositive===true&&pass.hasNegative===true,'suite must contain positive and negative cases');
expect(pass.expectationMatches===true,'observed behavior profile must match declared held-out expectations');
expect(pass.provenanceStable===true&&pass.provenanceFingerprint==='repeated-heldout-prov-001','provenance must remain stable across cases');
expect(pass.bodyAdmission===false&&pass.installed===false&&pass.persistentMutation===false,'repeated stress PASS must not install or mutate body');

const duplicate=runRepeatedHeldoutStress(candidate,[cases[0],{...cases[0],id:'duplicate-four'},cases[1]],options);
expect(duplicate.status==='HOLD'&&duplicate.distinctInputs===false,'duplicate held-out input fingerprints must prevent promotion');

const allPositive=runRepeatedHeldoutStress(candidate,[
  {id:'p1',input:{items:['1','2','3']},expectedChange:true},
  {id:'p2',input:{items:['1','2','3','4']},expectedChange:true},
  {id:'p3',input:{items:['1','2','3','4','5']},expectedChange:true}
],options);
expect(allPositive.status==='HOLD'&&allPositive.hasNegative===false,'one-sided positive-only suite must not count as a selective profile');

const wrongExpectation=runRepeatedHeldoutStress(candidate,[cases[0],{...cases[1],expectedChange:true},cases[2]],options);
expect(wrongExpectation.status==='HOLD'&&wrongExpectation.expectationMatches===false,'mismatched held-out expectation must remain HOLD');

const tooFew=runRepeatedHeldoutStress(candidate,cases.slice(0,2),options);
expect(tooFew.status==='BLOCKED'&&tooFew.executedCases===0,'fewer than three cases must be blocked before execution');

const result={
  schema:'zenomorph-capability-repeated-heldout-stress-test/v0.1',
  completedAt:new Date().toISOString(),
  status:failures.length?'FAIL':'PASS',
  capability:'REPEATED_SELECTIVE_FOREIGN_CAPABILITY_BEHAVIOR_PROFILE',
  cases:{pass,duplicate,allPositive,wrongExpectation,tooFew},
  boundary:repeatedHeldoutBoundary,
  failures
};
fs.writeFileSync(new URL('./gut-capability-repeated-stress-last-result.json',import.meta.url),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));
if(failures.length)process.exit(1);
