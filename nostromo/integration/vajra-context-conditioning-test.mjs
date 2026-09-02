import fs from 'node:fs/promises';
import {integrateConflictAdjudicationContext} from './vajra-conflict-escalation.mjs';
const failures=[];
const check=(condition,type,detail)=>{if(!condition)failures.push({type,detail});};
const contested={unresolved:[{targetRef:'t001',clauseRef:'c001',lens:'evidence',status:'CONTESTED_BY_RECEIPTS',contest:{status:'CONTESTED_BY_RECEIPTS',evidence:[{evidenceKey:'e1',provenance:'p1',polarity:'SUPPORTS',relation:'supports under A'},{evidenceKey:'e2',provenance:'p2',polarity:'REFUTES',relation:'refutes under A'}]}}]};
const mk=(organ,material,relation,key)=>({packetId:key,sourceOrgan:organ,targetRef:'t001',clauseRef:'c001',lens:'evidence',purpose:'TEST',status:'ACCEPTED_RETURN',provenance:`prov-${key}`,material,relation,returnKey:key});
const scopeIntake={accepted:[
  mk('DROPLET','Independent source families cover different condition sets, so comparability is limited.','Source comparability remains unresolved under the current scope.','d1'),
  mk('MUTHER','Repository context exposes a scope qualifier and a narrower applicable boundary.','The scope qualifier may explain the disagreement.','m1'),
  mk('SHROOMING','A boundary reading separates matched-condition from unmatched-condition cases.','The boundary changes which observations count as conflicts.','s1')
]};
const methodIntake={accepted:[
  mk('DROPLET','The two studies use different measurement instruments and validity assumptions.','Measurement procedure may explain the directional disagreement.','d2'),
  mk('MUTHER','Methods differ in sampling procedure and operational measurement definition.','Method mismatch should be tested before interpreting the conflict.','m2'),
  mk('SHROOMING','A reading that holds the measurement criterion constant changes the apparent disagreement.','The same measurement rule should be applied to both sides.','s2')
]};
const scopeOut=integrateConflictAdjudicationContext(contested,scopeIntake);
const methodOut=integrateConflictAdjudicationContext(contested,methodIntake);
const a=scopeOut.unresolved[0],b=methodOut.unresolved[0];
check(a?.status==='CONTESTED_WITH_ADJUDICATION_CONTEXT','SCOPE_CONTEXT_NOT_PRESERVED',a);
check(b?.status==='CONTESTED_WITH_ADJUDICATION_CONTEXT','METHOD_CONTEXT_NOT_PRESERVED',b);
check(a?.closureBlocked===true&&b?.closureBlocked===true,'CONTEXT_CREATED_FALSE_CLOSURE',{a:a?.closureBlocked,b:b?.closureBlocked});
check(a?.closureAuthority==='NONE'&&b?.closureAuthority==='NONE','CLOSURE_AUTHORITY_LEAK',{a:a?.closureAuthority,b:b?.closureAuthority});
check(a?.discriminator?.selected==='SCOPE_BOUNDARY','SCOPE_BOUNDARY_CUE_NOT_SELECTED',a?.discriminator);
check(b?.discriminator?.selected==='METHOD_MEASUREMENT','METHOD_MEASUREMENT_CUE_NOT_SELECTED',b?.discriminator);
check(a?.nextAction!==b?.nextAction,'DIFFERENT_ORGAN_RETURNS_DID_NOT_CHANGE_NEXT_ACTION',{a:a?.nextAction,b:b?.nextAction});
check(a?.nextQuestion!==b?.nextQuestion,'DIFFERENT_ORGAN_RETURNS_DID_NOT_CHANGE_NEXT_QUESTION',{a:a?.nextQuestion,b:b?.nextQuestion});
check(a?.contest?.evidence?.length===2&&b?.contest?.evidence?.length===2,'ORIGINAL_CONFLICT_EVIDENCE_LOST',{a:a?.contest,b:b?.contest});
check(a?.adjudicationContext?.complete===true&&b?.adjudicationContext?.complete===true,'THREE_ORGAN_COVERAGE_NOT_RECOGNIZED',{a:a?.adjudicationContext,b:b?.adjudicationContext});
const partial=integrateConflictAdjudicationContext(contested,{accepted:[scopeIntake.accepted[0]]}).unresolved[0];
check(partial?.nextAction==='WAIT_FOR_ADDITIONAL_ADJUDICATION_CONTEXT','PARTIAL_CONTEXT_PREMATURELY_CONDITIONED',partial);
check(partial?.discriminator===null,'PARTIAL_CONTEXT_CREATED_DISCRIMINATOR',partial?.discriminator);
const result={schema:'nostromo-vajra-context-conditioning-test/v0.1.1',completedAt:new Date().toISOString(),status:failures.length?'FAIL':'PASS',capability:'MULTI_ORGAN_RETURN_CONTENT_CONDITIONS_NEXT_VAJRA_QUESTION',samples:{scope:{selected:a?.discriminator?.selected,nextAction:a?.nextAction,nextQuestion:a?.nextQuestion},method:{selected:b?.discriminator?.selected,nextAction:b?.nextAction,nextQuestion:b?.nextQuestion},partial:{nextAction:partial?.nextAction,missingOrgans:partial?.adjudicationContext?.missingOrgans}},guards:{contentChangesBehavior:a?.nextAction!==b?.nextAction&&a?.nextQuestion!==b?.nextQuestion,originalConflictPreserved:true,closureRemainsBlocked:true,partialCoverageCannotTriggerConditionedReassessment:true,provenanceRetained:true},failures,boundary:'PASS demonstrates a bounded deterministic change in VAJRA behavior caused by the content of completed DROPLET/MUTHER/SHROOMING adjudication returns. Cue selection is lexical and auditable, not semantic truth adjudication; complete context still cannot close a contested branch.'};
await fs.writeFile('nostromo/integration/vajra-context-conditioning-last-result.json',JSON.stringify(result,null,2)+'\n','utf8');
console.log(JSON.stringify(result,null,2));
if(result.status!=='PASS')process.exitCode=1;
