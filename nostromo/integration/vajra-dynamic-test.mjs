import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';

const root=process.cwd();
async function loadScript(rel){const code=await fs.readFile(path.join(root,rel),'utf8');vm.runInThisContext(code,{filename:rel});}
await loadScript('nostromo/vajra/vajra-engine.js');
await loadScript('nostromo/gut/gut-engine.js');

const failures=[];
function check(condition,type,detail){if(!condition)failures.push({type,detail});}
function run(label,text,expectedType,requiredLenses=[]){const out=globalThis.VajraEngine.run(text,6);check(out.version==='0.2.3',`${label}_VERSION`,out.version);check(out.positionType===expectedType,`${label}_TYPE`,{expectedType,actual:out.positionType});check(out.trace.length>=1,`${label}_EMPTY_TRACE`,out);for(const lens of requiredLenses)check(out.lensesUsed.includes(lens),`${label}_MISSING_LENS`,{lens,lensesUsed:out.lensesUsed});check(out.unresolved.length===out.trace.length,`${label}_UNRESOLVED_TRACE_MISMATCH`,{unresolved:out.unresolved.length,trace:out.trace.length});check(out.handoffs.length===out.unresolved.length,`${label}_HANDOFF_TRACE_MISMATCH`,{handoffs:out.handoffs.length,unresolved:out.unresolved.length});check(!['PROVED','TRUE','FALSE','SETTLED','VERIFIED'].includes(out.status),`${label}_FALSE_CERTAINTY_STATUS`,out.status);check(out.unresolved.every(x=>x.status==='UNRESOLVED'),`${label}_FALSE_CERTAINTY_BRANCH`,out.unresolved);check(out.handoffs.every(x=>x.status==='OPEN'),`${label}_FALSE_HANDOFF_EXECUTION`,out.handoffs);check(out.handoffs.every(x=>x.targetRef===out.targetRef&&x.need&&x.resolutionCriterion&&x.preferredOrgan),`${label}_HANDOFF_CONTRACT_INCOMPLETE`,out.handoffs);check(/^[0-9a-f]{8}$/.test(out.targetRef||''),`${label}_TARGET_REF_MISSING`,out.targetRef);check(out.trace.every(x=>x.position===`ref:${out.targetRef}`),`${label}_RAW_SOURCE_IN_TRACE`,out.trace.map(x=>x.position));return out;}

const universal=run('UNIVERSAL','所有五個器官一定已經足夠成熟。','UNIVERSAL',['counterexample','scope']);
const causalText='因為外部證據增加，所以香菇的理解一定改變。';
const causal=run('CAUSAL',causalText,'CAUSAL',['causal_mechanism','alternative_cause','counterfactual']);
const normative=run('NORMATIVE','NOSTROMO 應該優先追求速度而不是可追溯性。','NORMATIVE',['criterion','affected_parties','tradeoff']);
const definition=run('DEFINITION','成熟器官是指能產生很多輸出的器官。','DEFINITION',['definition_boundary','category_error']);
const empirical=run('EMPIRICAL','目前測試資料顯示 GUT 可以隔離重複污染。','EMPIRICAL',['evidence','measurement','source_quality']);
const selfRef=run('SELF_REFERENCE','這個命題本身不需要接受 VAJRA 的檢查。','SELF_REFERENTIAL',['self_reference']);
const vague=run('VAGUE','這個系統很好。','VAGUE',['definition_boundary','criterion']);

check(JSON.stringify(causal.lensesUsed)!==JSON.stringify(universal.lensesUsed),'DYNAMIC_LENSES_NOT_DYNAMIC',{causal:causal.lensesUsed,universal:universal.lensesUsed});
check(normative.trace.some(x=>/成本|利益|排除/.test(x.action)),'NORMATIVE_NO_STAKEHOLDER_PRESSURE',normative.trace);
check(empirical.trace.some(x=>/來源獨立性|方法品質|測量/.test(x.action)),'EMPIRICAL_NO_EVIDENCE_QUALITY_PRESSURE',empirical.trace);
check(definition.trace.some(x=>/層級|類別|描述方式/.test(x.action)),'DEFINITION_NO_CATEGORY_ERROR_CHECK',definition.trace);
check(selfRef.trace.some(x=>x.lens==='self_reference'),'SELF_REFERENCE_NOT_APPLIED',selfRef.trace);
check(vague.trace.some(x=>x.lens==='definition_boundary'),'VAGUE_NOT_FORCED_TO_DEFINE',vague.trace);

const empiricalHandoffs=Object.fromEntries(empirical.handoffs.map(x=>[x.lens,x]));
check(empiricalHandoffs.evidence?.preferredOrgan==='DROPLET','EMPIRICAL_EVIDENCE_NOT_ROUTED_TO_DROPLET',empiricalHandoffs.evidence);
check(empiricalHandoffs.measurement?.preferredOrgan==='DROPLET','EMPIRICAL_MEASUREMENT_NOT_ROUTED_TO_DROPLET',empiricalHandoffs.measurement);
check(empiricalHandoffs.source_quality?.preferredOrgan==='DROPLET','EMPIRICAL_SOURCE_QUALITY_NOT_ROUTED_TO_DROPLET',empiricalHandoffs.source_quality);
const causalHandoffs=Object.fromEntries(causal.handoffs.map(x=>[x.lens,x]));
check(causalHandoffs.causal_mechanism?.preferredOrgan==='MUTHER','CAUSAL_MECHANISM_NOT_ROUTED_TO_MUTHER',causalHandoffs.causal_mechanism);
check(causalHandoffs.alternative_cause?.preferredOrgan==='DROPLET','ALTERNATIVE_CAUSE_NOT_ROUTED_TO_DROPLET',causalHandoffs.alternative_cause);
check(causalHandoffs.counterfactual?.preferredOrgan==='SHROOMING','COUNTERFACTUAL_NOT_ROUTED_TO_SHROOMING',causalHandoffs.counterfactual);
check(definition.handoffs.some(x=>x.lens==='category_error'&&x.preferredOrgan==='VAJRA'),'CATEGORY_ERROR_NOT_SELF_ROUTED',definition.handoffs);
check(Object.keys(causal.handoffCounts).length>=3,'HANDOFF_DIVERSITY_COLLAPSE',causal.handoffCounts);

const metabolic=globalThis.GutEngine.digest({vajra:causal},{source:'VAJRA_GUT_REGRESSION',inheritedSubstrates:[causalText]});
check(!/「\s*」/.test(metabolic.summary), 'VAJRA_GUT_HOLLOW_TARGET', metabolic.summary);
check(metabolic.summary.includes(causal.targetRef), 'VAJRA_GUT_TARGET_REF_LOST',{targetRef:causal.targetRef,summary:metabolic.summary});
check(!metabolic.summary.includes(causalText), 'VAJRA_GUT_INHERITED_TARGET_ECHO',{summary:metabolic.summary});
check(causal.handoffs.every(x=>!['EXECUTED','RESOLVED','VERIFIED'].includes(x.status)),'HANDOFF_STATUS_OVERCLAIM',causal.handoffs);

const result={schema:'nostromo-vajra-dynamic-test/v0.2.3',completedAt:new Date().toISOString(),status:failures.length===0?'PASS':'FAIL',guards:{falseCertainty:true,unresolvedBranches:true,dynamicLensSelection:true,branchHandoffContracts:true,noFalseHandoffExecution:true,gutReferentialContinuity:true,inheritedTargetAntiEcho:true,rawSourceNotCopiedIntoTrace:true},crossOrgan:{vajraGut:{targetRef:causal.targetRef,hollowTarget:false,rawTargetEcho:false,summarySample:metabolic.summary.slice(0,360)},handoffMap:{empirical:empirical.handoffs,causal:causal.handoffs}},cases:{universal:{type:universal.positionType,lenses:universal.lensesUsed,handoffCounts:universal.handoffCounts},causal:{type:causal.positionType,lenses:causal.lensesUsed,handoffCounts:causal.handoffCounts},normative:{type:normative.positionType,lenses:normative.lensesUsed,handoffCounts:normative.handoffCounts},definition:{type:definition.positionType,lenses:definition.lensesUsed,handoffCounts:definition.handoffCounts},empirical:{type:empirical.positionType,lenses:empirical.lensesUsed,handoffCounts:empirical.handoffCounts},selfReference:{type:selfRef.positionType,lenses:selfRef.lensesUsed,handoffCounts:selfRef.handoffCounts},vague:{type:vague.positionType,lenses:vague.lensesUsed,handoffCounts:vague.handoffCounts}},failures,boundary:'PASS proves that VAJRA selects different auditable dismantling lenses for different proposition classes and now turns each unresolved branch into an explicit OPEN work contract naming a preferred organ, requested material and resolution criterion. These are routing requests only: PASS does not claim that the requested organ executed the contract, that classification is semantically correct, or that a branch is resolved. The VAJRA→GUT regression still checks compact referential continuity and inherited-target anti-echo.'};
await fs.writeFile(path.join(root,'nostromo/integration/vajra-dynamic-last-result.json'),JSON.stringify(result,null,2)+'\n','utf8');
console.log(JSON.stringify(result,null,2));
if(result.status!=='PASS')process.exitCode=1;
