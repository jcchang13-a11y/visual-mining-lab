import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';

const root=process.cwd();
async function loadScript(rel){const code=await fs.readFile(path.join(root,rel),'utf8');vm.runInThisContext(code,{filename:rel});}
await loadScript('nostromo/vajra/vajra-engine.js');

const failures=[];
function check(condition,type,detail){if(!condition)failures.push({type,detail});}
function run(label,text,expectedType,requiredLenses=[]){const out=globalThis.VajraEngine.run(text,6);check(out.version==='0.2.0',`${label}_VERSION`,out.version);check(out.positionType===expectedType,`${label}_TYPE`,{expectedType,actual:out.positionType});check(out.trace.length>=1,`${label}_EMPTY_TRACE`,out);for(const lens of requiredLenses)check(out.lensesUsed.includes(lens),`${label}_MISSING_LENS`,{lens,lensesUsed:out.lensesUsed});check(out.unresolved.length===out.trace.length,`${label}_UNRESOLVED_TRACE_MISMATCH`,{unresolved:out.unresolved.length,trace:out.trace.length});check(!['PROVED','TRUE','FALSE','SETTLED','VERIFIED'].includes(out.status),`${label}_FALSE_CERTAINTY_STATUS`,out.status);check(out.unresolved.every(x=>x.status==='UNRESOLVED'),`${label}_FALSE_CERTAINTY_BRANCH`,out.unresolved);return out;}

const universal=run('UNIVERSAL','所有五個器官一定已經足夠成熟。','UNIVERSAL',['counterexample','scope']);
const causal=run('CAUSAL','因為外部證據增加，所以香菇的理解一定改變。','CAUSAL',['causal_mechanism','alternative_cause','counterfactual']);
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

const result={schema:'nostromo-vajra-dynamic-test/v0.2.0',completedAt:new Date().toISOString(),status:failures.length===0?'PASS':'FAIL',guards:{falseCertainty:true,unresolvedBranches:true,dynamicLensSelection:true},cases:{universal:{type:universal.positionType,lenses:universal.lensesUsed},causal:{type:causal.positionType,lenses:causal.lensesUsed},normative:{type:normative.positionType,lenses:normative.lensesUsed},definition:{type:definition.positionType,lenses:definition.lensesUsed},empirical:{type:empirical.positionType,lenses:empirical.lensesUsed},selfReference:{type:selfRef.positionType,lenses:selfRef.lensesUsed},vague:{type:vague.positionType,lenses:vague.lensesUsed}},failures,boundary:'PASS proves that VAJRA selects different auditable dismantling lenses for different proposition classes, preserves unresolved branches, and does not emit a settled-truth status in these adversarial cases. It does not prove semantic classification correctness, factual truth, or autonomous resolution of those branches.'};
await fs.writeFile(path.join(root,'nostromo/integration/vajra-dynamic-last-result.json'),JSON.stringify(result,null,2)+'\n','utf8');
console.log(JSON.stringify(result,null,2));
if(result.status!=='PASS')process.exitCode=1;
