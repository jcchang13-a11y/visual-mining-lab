/* VAJRA ENGINE v0.2.1 — deterministic proposition-aware dismantling */
const BASE_LENSES=['scope','evidence','counterexample','criterion','excluded_alternative','self_reference'];
const TYPE_LENSES={
  UNIVERSAL:['scope','counterexample','excluded_alternative','evidence','criterion'],
  CAUSAL:['causal_mechanism','alternative_cause','counterfactual','evidence','scope'],
  NORMATIVE:['criterion','affected_parties','tradeoff','excluded_alternative','scope'],
  DEFINITION:['definition_boundary','category_error','counterexample','criterion','scope'],
  EMPIRICAL:['evidence','measurement','source_quality','counterexample','scope'],
  SELF_REFERENTIAL:['self_reference','criterion','scope','counterexample'],
  VAGUE:['definition_boundary','criterion','scope','evidence'],
  GENERAL:BASE_LENSES
};
function clean(text){return String(text||'').replace(/\s+/g,' ').trim();}
function refFingerprint(text){let h=2166136261;for(const ch of clean(text)){h^=ch.codePointAt(0);h=Math.imul(h,16777619)>>>0;}return h.toString(16).padStart(8,'0');}
function detectPosition(text){const position=clean(text);return {position,strong:/唯一|所有|一定|永遠|完全|必然|only|all|always|never|must\b/i.test(position)};}
function classifyPosition(position){
  const s=String(position||'');
  if(/我這句|這個命題|本命題|this statement|this claim|self-reference|自我指涉/i.test(s))return 'SELF_REFERENTIAL';
  if(/應該|必須|最好|值得|正當|公平|ought|should|must\b|better|fair|just\b/i.test(s))return 'NORMATIVE';
  if(/因為|導致|造成|使得|所以|原因|cause|causes|caused|because|leads to|results in/i.test(s))return 'CAUSAL';
  if(/是指|定義|所謂|意思是|means|defined as|definition/i.test(s))return 'DEFINITION';
  if(/唯一|所有|一定|永遠|完全|必然|only|all|always|never/i.test(s))return 'UNIVERSAL';
  if(/研究|資料|數據|觀察|顯示|發現|evidence|data|study|observed|measured|finding/i.test(s))return 'EMPIRICAL';
  if(s.length<12||/某種|一些|大概|可能是好|很好|不好|something|somehow|good|bad/i.test(s))return 'VAGUE';
  return 'GENERAL';
}
function extractAssumptions(p,type){const a=['命題成立條件需要顯式化'];if(p.strong)a.push('包含強普遍化／排他性前提');if(type==='CAUSAL')a.push('相關性不自動等於因果機制');if(type==='NORMATIVE')a.push('需要說明判準、受影響者與代價分配');if(type==='DEFINITION')a.push('定義邊界不能偷帶實證結論');if(type==='EMPIRICAL')a.push('資料品質、測量方式與來源獨立性需要檢查');if(type==='SELF_REFERENTIAL')a.push('命題可能把自身豁免於同一判準');if(type==='VAGUE')a.push('核心詞彙與比較基準尚未足夠明確');return a;}
function instructionFor(lens){const map={scope:'界定適用範圍、例外與邊界條件',evidence:'要求可追溯證據並區分支持與缺席證據',counterexample:'主動尋找最小反例與破壞條件',criterion:'顯式化判準並測試判準是否偷換',excluded_alternative:'列出被排除但仍可解釋資料的替代方案',self_reference:'把同一檢查套回命題自身與檢查者位置',causal_mechanism:'要求中介機制，不接受只靠時間順序或共變',alternative_cause:'尋找共同原因、反向因果與競爭機制',counterfactual:'問若原因不存在結果是否仍可能發生',affected_parties:'辨認誰承擔成本、誰獲得利益、誰被排除',tradeoff:'列出規範選擇犧牲了什麼以及不可同時滿足的目標',definition_boundary:'要求可操作邊界並測試邊界案例',category_error:'檢查是否把不同層級、類別或描述方式混為一談',measurement:'檢查測量是否真的對應所宣稱概念',source_quality:'檢查來源獨立性、方法品質、時間與可重現性'};return map[lens]||'尋找反例、邊界條件與被排除的替代解釋';}
function nextQuestion(lens,type,targetRef){return `${instructionFor(lens)}：針對本輪 ${type} 命題（ref:${targetRef}），哪個前提最可能先失效？`;}
function resultEnvelope(status,type,targetRef,trace,unresolved){return {status,version:'0.2.1',positionType:type,targetRef,trace,unresolved,lensesUsed:[...new Set(trace.map(x=>x.lens))],boundary:status==='INFORMATION_SATURATION'?'Deterministic heuristic dismantling. Saturation means the current rule set has stopped producing a new inspection path; it is not proof that the claim is settled.':'Deterministic proposition-aware dismantling only. Classification and lens choice are auditable heuristics, not semantic truth; unresolved branches must be supplied with evidence or counterexamples by other organs. targetRef preserves referential continuity without copying the full inherited substrate into every generated question.'};}
function runVajra(text,maxRounds=6){
  const base=detectPosition(text),type=classifyPosition(base.position),targetRef=refFingerprint(base.position),trace=[],seen=new Set(),unresolved=[];
  const lenses=TYPE_LENSES[type]||BASE_LENSES;let current=base.position;const cap=Math.max(1,Math.min(12,maxRounds));
  for(let i=0;i<cap;i++){
    const lens=lenses[i%lenses.length],p=detectPosition(current),assumptions=extractAssumptions(p,type),signature=`${type}|${lens}|${clean(current).slice(0,160)}`;
    if(seen.has(signature))return resultEnvelope('INFORMATION_SATURATION',type,targetRef,trace,unresolved);
    seen.add(signature);
    const question=nextQuestion(lens,type,targetRef);const branch={lens,targetRef,question,status:'UNRESOLVED'};unresolved.push(branch);
    trace.push({round:i+1,position:i===0?base.position:`ref:${targetRef}`,positionType:type,targetRef,assumptions,lens,action:instructionFor(lens),question,next:`暫不定案；保留 ${lens} 分支待證據或反例回填。`});
    current=question;
  }
  return resultEnvelope('DEPTH_BOUND',type,targetRef,trace,unresolved);
}
(typeof window!=='undefined'?window:globalThis).VajraEngine={run:runVajra,classify:classifyPosition};