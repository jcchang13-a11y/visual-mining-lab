import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import {integrateConflictAdjudicationContext} from './vajra-conflict-escalation.mjs';
import {prioritizeVajraBranches} from './vajra-metabolic-priority.mjs';
const failures=[];
const check=(condition,type,detail)=>{if(!condition)failures.push({type,detail});};
const root=process.cwd();
async function loadScript(rel){const code=await fs.readFile(path.join(root,rel),'utf8');vm.runInThisContext(code,{filename:rel});}
await loadScript('nostromo/vajra/vajra-engine.js');
await loadScript('nostromo/gut/gut-engine.js');

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

// New cross-organ thickening: identical VAJRA target, different GUT metabolic outputs must reprioritize the next open branch differently without changing branch state.
const targetText='目前測試資料顯示 GUT 可以隔離重複污染。';
const vajra=globalThis.VajraEngine.run(targetText,6);
const contradictionGut=globalThis.GutEngine.digest({counterevidence:'A conflicting observation directly contradicts the current finding under a bounded condition.'},{source:'VAJRA_PRIORITY_CONTRADICTION'});
const provenanceGut=globalThis.GutEngine.digest({evidence:'Independent source provenance and measurement procedure require a source-quality check before reuse.'},{source:'VAJRA_PRIORITY_PROVENANCE'});
const contradictionPriority=prioritizeVajraBranches(vajra,contradictionGut);
const provenancePriority=prioritizeVajraBranches(vajra,provenanceGut);
check(contradictionPriority.status==='PRIORITIZED_BY_GUT_SIGNAL','GUT_CONTRADICTION_DID_NOT_PRIORITIZE',contradictionPriority);
check(provenancePriority.status==='PRIORITIZED_BY_GUT_SIGNAL','GUT_PROVENANCE_DID_NOT_PRIORITIZE',provenancePriority);
check(contradictionPriority.selected?.lens==='counterexample','CONTRADICTION_DID_NOT_PRIORITIZE_COUNTEREXAMPLE',contradictionPriority.selected);
check(provenancePriority.selected?.lens==='source_quality','PROVENANCE_DID_NOT_PRIORITIZE_SOURCE_QUALITY',provenancePriority.selected);
check(contradictionPriority.selected?.lens!==provenancePriority.selected?.lens,'DIFFERENT_GUT_METABOLISM_DID_NOT_CHANGE_VAJRA_PRIORITY',{contradiction:contradictionPriority.selected,provenance:provenancePriority.selected});
check(contradictionPriority.targetRef===vajra.targetRef&&provenancePriority.targetRef===vajra.targetRef,'VAJRA_TARGET_REF_LOST_DURING_METABOLIC_PRIORITY',{target:vajra.targetRef,contradiction:contradictionPriority.targetRef,provenance:provenancePriority.targetRef});
check(contradictionPriority.closureAuthority==='NONE'&&provenancePriority.closureAuthority==='NONE','METABOLIC_PRIORITY_GAINED_CLOSURE_AUTHORITY',{contradiction:contradictionPriority.closureAuthority,provenance:provenancePriority.closureAuthority});
check(contradictionPriority.branchStateMutated===false&&provenancePriority.branchStateMutated===false,'METABOLIC_PRIORITY_MUTATED_BRANCH_STATE',{contradiction:contradictionPriority.branchStateMutated,provenance:provenancePriority.branchStateMutated});
check(vajra.unresolved.every(x=>x.status==='UNRESOLVED'),'SOURCE_VAJRA_BRANCH_STATE_MUTATED',vajra.unresolved.map(x=>({lens:x.lens,status:x.status})));
check(contradictionPriority.feedbackFingerprint!==provenancePriority.feedbackFingerprint,'DISTINCT_GUT_FEEDBACK_FINGERPRINT_COLLISION',{a:contradictionPriority.feedbackFingerprint,b:provenancePriority.feedbackFingerprint});
const noSignal=prioritizeVajraBranches(vajra,{items:[]});
check(noSignal.status==='NO_METABOLIC_PRIORITY_SIGNAL'&&noSignal.selected===null,'EMPTY_GUT_SIGNAL_CREATED_FALSE_PRIORITY',noSignal);

const result={schema:'nostromo-vajra-context-conditioning-test/v0.2.0',completedAt:new Date().toISOString(),status:failures.length?'FAIL':'PASS',capability:'MULTI_ORGAN_RETURN_AND_GUT_METABOLISM_CONDITION_NEXT_VAJRA_BEHAVIOR',samples:{scope:{selected:a?.discriminator?.selected,nextAction:a?.nextAction,nextQuestion:a?.nextQuestion},method:{selected:b?.discriminator?.selected,nextAction:b?.nextAction,nextQuestion:b?.nextQuestion},partial:{nextAction:partial?.nextAction,missingOrgans:partial?.adjudicationContext?.missingOrgans},gutConditioning:{contradiction:{selectedLens:contradictionPriority.selected?.lens,feedbackFingerprint:contradictionPriority.feedbackFingerprint,signalTypes:contradictionPriority.signals?.map(x=>x.type)},provenance:{selectedLens:provenancePriority.selected?.lens,feedbackFingerprint:provenancePriority.feedbackFingerprint,signalTypes:provenancePriority.signals?.map(x=>x.type)},empty:{status:noSignal.status,selected:noSignal.selected}}},guards:{contentChangesBehavior:a?.nextAction!==b?.nextAction&&a?.nextQuestion!==b?.nextQuestion,originalConflictPreserved:true,closureRemainsBlocked:true,partialCoverageCannotTriggerConditionedReassessment:true,provenanceRetained:true,gutMetabolismChangesVajraPriority:contradictionPriority.selected?.lens!==provenancePriority.selected?.lens,gutCannotCloseVajraBranch:true,targetRefPreserved:true,emptySignalCannotInventPriority:true},failures,boundary:'PASS demonstrates two bounded forms of cross-organ regulation: completed DROPLET/MUTHER/SHROOMING adjudication content changes VAJRA conflict reassessment, and GUT metabolic classification can change which still-open VAJRA branch is inspected next. Both mechanisms are deterministic and auditable. Neither GUT nor the adjudication bridge gains authority to close, validate or prove a VAJRA branch; cue and priority selection remain lexical/type heuristics rather than semantic truth judgments.'};
await fs.writeFile('nostromo/integration/vajra-context-conditioning-last-result.json',JSON.stringify(result,null,2)+'\n','utf8');
console.log(JSON.stringify(result,null,2));
if(result.status!=='PASS')process.exitCode=1;
