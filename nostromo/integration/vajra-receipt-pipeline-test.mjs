import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import {auditVajraReceipts,applyVajraReceiptPipeline,maskEditorialBracketPolarity,maskHypotheticalPolarity} from './vajra-receipt-pipeline.mjs';

const root=process.cwd();
const resultPath=path.join(root,'nostromo','integration','vajra-receipt-pipeline-last-result.json');
const code=await fs.readFile(path.join(root,'nostromo','vajra','vajra-engine.js'),'utf8');
vm.runInThisContext(code,{filename:'nostromo/vajra/vajra-engine.js'});
const V=globalThis.VajraEngine;
const failures=[];

const base=V.run('所有自動化測試結果都能直接證明系統可靠',6);
const branch=base.unresolved.find(x=>x.handoff?.preferredOrgan==='DROPLET')||base.unresolved[0];
if(!branch)failures.push({type:'NO_TESTABLE_BRANCH'});
const common={targetRef:branch?.targetRef,clauseRef:branch?.clauseRef,lens:branch?.lens,status:'EXECUTED'};
const support={...common,organ:'DROPLET',provenance:'web-direct-support',material:'Direct bounded assessment.',relation:'This evidence supports the target claim within the tested scope.'};
const refute={...common,organ:'DROPLET',provenance:'web-direct-refute',material:'Direct bounded counter-assessment.',relation:'This evidence refutes the target claim within the tested scope.'};
const bracketRefute={...common,organ:'MU/TH/UR',provenance:'repo-editorial-note',material:'Repository context containing an editorial aside.',relation:'Background [a prior report refutes the target claim] without independent endorsement.'};
const zhBracketSupport={...common,organ:'SHROOMING',provenance:'shroom-editorial-note',material:'回傳含編輯註記。',relation:'背景註記【舊報告支持目標命題】但本回傳沒有自行背書。'};
const outsideSupport={...common,organ:'MU/TH/UR',provenance:'repo-outside-direct',material:'Editorial context plus direct assessment.',relation:'Background [a prior report refutes the target claim]. This evidence supports the target claim within the tested scope.'};
const nested={...common,organ:'SHROOMING',provenance:'shroom-nested-note',material:'Nested editorial aside.',relation:'Background [reviewer notes [a prior report supports the target claim] without endorsement] only.'};
const unbalanced={...common,organ:'MU/TH/UR',provenance:'repo-unbalanced',material:'Parser-limit control.',relation:'Background [refutes the target claim without a closing bracket.'};
const multiline={...common,organ:'SHROOMING',provenance:'shroom-multiline',material:'Multiline parser-limit control.',relation:'Background [a prior report\nrefutes the target claim] without endorsement.'};
const hypotheticalSupport={...common,organ:'MU/TH/UR',provenance:'repo-hypothetical-support',material:'Thought-experiment context only.',relation:'Suppose for this thought experiment that the evidence supports the target claim.'};
const hypotheticalRefuteZh={...common,organ:'SHROOMING',provenance:'shroom-hypothetical-refute',material:'只作假設性壓力測試。',relation:'姑且假定這份材料反駁目標命題，只作為思想實驗。'};
const hypotheticalThenDirect={...common,organ:'MU/TH/UR',provenance:'repo-hypothetical-then-direct',material:'Hypothesis followed by a direct bounded assessment.',relation:'Suppose the legacy report supports the target claim. This evidence refutes the target claim within the tested scope.'};

const a=auditVajraReceipts([support,bracketRefute]);
const af=a.ambiguous?.[0]?.receipts?.find(x=>x.provenance==='repo-editorial-note');
if(a.status!=='AMBIGUITY_FOUND')failures.push({type:'BRACKET_ONLY_NOT_AMBIGUOUS',actual:a.status});
if(af?.polarity!=='UNSPECIFIED')failures.push({type:'BRACKET_POLARITY_LEAK',actual:af?.polarity});
if(af?.relation!==bracketRefute.relation)failures.push({type:'RAW_RELATION_NOT_PRESERVED'});

const z=auditVajraReceipts([refute,zhBracketSupport]);
const zf=z.ambiguous?.[0]?.receipts?.find(x=>x.provenance==='shroom-editorial-note');
if(z.status!=='AMBIGUITY_FOUND'||zf?.polarity!=='UNSPECIFIED')failures.push({type:'ZH_BRACKET_POLARITY_LEAK',status:z.status,polarity:zf?.polarity});

const d=auditVajraReceipts([refute,outsideSupport]);
const df=d.contested?.[0]?.receipts?.find(x=>x.provenance==='repo-outside-direct');
if(d.status!=='CONFLICT_FOUND'||df?.polarity!=='SUPPORTS')failures.push({type:'DIRECT_OUTSIDE_HIDDEN',status:d.status,polarity:df?.polarity});

const n=auditVajraReceipts([refute,nested]);
const nf=n.ambiguous?.[0]?.receipts?.find(x=>x.provenance==='shroom-nested-note');
if(n.status!=='AMBIGUITY_FOUND'||nf?.polarity!=='UNSPECIFIED')failures.push({type:'NESTED_BRACKET_LEAK',status:n.status,polarity:nf?.polarity});

const u=auditVajraReceipts([support,unbalanced]);
const uf=u.contested?.[0]?.receipts?.find(x=>x.provenance==='repo-unbalanced');
if(u.status!=='CONFLICT_FOUND'||uf?.polarity!=='REFUTES')failures.push({type:'UNBALANCED_NOT_CONSERVATIVE',status:u.status,polarity:uf?.polarity});

const multilineMask=maskEditorialBracketPolarity(multiline.relation);
const m=auditVajraReceipts([support,multiline]);
const mf=(m.contested?.[0]||m.ambiguous?.[0])?.receipts?.find(x=>x.provenance==='shroom-multiline');
if(!multilineMask.parserLimited||multilineMask.maskedRanges!==0)failures.push({type:'MULTILINE_BRACKET_SCOPE_NOT_EXPOSED',multilineMask});
if(!['AMBIGUITY_FOUND','CONFLICT_FOUND'].includes(m.status))failures.push({type:'MULTILINE_CREATED_FALSE_CLOSURE',status:m.status,polarity:mf?.polarity});

const hs=auditVajraReceipts([refute,hypotheticalSupport]);
const hsf=hs.ambiguous?.[0]?.receipts?.find(x=>x.provenance==='repo-hypothetical-support');
if(hs.status!=='AMBIGUITY_FOUND'||hsf?.polarity!=='UNSPECIFIED')failures.push({type:'HYPOTHETICAL_SUPPORT_FALSE_CERTAINTY',status:hs.status,polarity:hsf?.polarity});
if(hsf?.relation!==hypotheticalSupport.relation)failures.push({type:'HYPOTHETICAL_RAW_RELATION_NOT_PRESERVED'});

const hz=auditVajraReceipts([support,hypotheticalRefuteZh]);
const hzf=hz.ambiguous?.[0]?.receipts?.find(x=>x.provenance==='shroom-hypothetical-refute');
if(hz.status!=='AMBIGUITY_FOUND'||hzf?.polarity!=='UNSPECIFIED')failures.push({type:'ZH_HYPOTHETICAL_REFUTE_FALSE_CERTAINTY',status:hz.status,polarity:hzf?.polarity});

const hd=auditVajraReceipts([support,hypotheticalThenDirect]);
const hdf=hd.contested?.[0]?.receipts?.find(x=>x.provenance==='repo-hypothetical-then-direct');
if(hd.status!=='CONFLICT_FOUND'||hdf?.polarity!=='REFUTES')failures.push({type:'DIRECT_AFTER_HYPOTHETICAL_HIDDEN',status:hd.status,polarity:hdf?.polarity});

const overlongRelation=`Suppose ${'x'.repeat(230)} refutes the target claim.`;
const overlongMask=maskHypotheticalPolarity(overlongRelation);
const overlong={...common,organ:'SHROOMING',provenance:'shroom-hypothetical-overlong',material:'Overlong hypothetical parser-limit control.',relation:overlongRelation};
const ho=auditVajraReceipts([support,overlong]);
const hof=ho.contested?.[0]?.receipts?.find(x=>x.provenance==='shroom-hypothetical-overlong');
if(!overlongMask.parserLimited||overlongMask.maskedRanges!==0)failures.push({type:'HYPOTHETICAL_PARSER_LIMIT_NOT_EXPOSED',overlongMask});
if(ho.status!=='CONFLICT_FOUND'||hof?.polarity!=='REFUTES')failures.push({type:'HYPOTHETICAL_PARSER_LIMIT_SILENTLY_HIDDEN',status:ho.status,polarity:hof?.polarity});

const guarded=applyVajraReceiptPipeline(base,[support,hypotheticalRefuteZh],V);
const guardedBranch=guarded.unresolved.find(x=>x.targetRef===branch?.targetRef&&x.clauseRef===branch?.clauseRef&&x.lens===branch?.lens);
if(guardedBranch?.status!=='AMBIGUOUS_BY_RECEIPTS')failures.push({type:'PIPELINE_FALSE_CLOSURE_NOT_BLOCKED',actual:guardedBranch?.status});
if(guarded.receiptPipeline?.status!=='CANONICAL_EXEC')failures.push({type:'CANONICAL_PIPELINE_MARKER_MISSING'});
if(guarded.receiptPipeline?.closureAuthority!=='NONE')failures.push({type:'CLOSURE_AUTHORITY_ESCALATED'});

const parserControl=maskEditorialBracketPolarity('Background [refutes target without close.');
if(!parserControl.parserLimited||parserControl.maskedRanges!==0)failures.push({type:'PARSER_LIMIT_NOT_AUDITABLE',parserControl});

const result={
  schema:'nostromo-vajra-receipt-pipeline/v0.1.2',
  completedAt:new Date().toISOString(),
  status:failures.length?'FAIL':'PASS',
  finding:{
    canonicalPipelineStatus:guarded.receiptPipeline?.status||null,
    bracketOnlyStatus:a.status,
    bracketOnlyPolarity:af?.polarity||null,
    chineseBracketStatus:z.status,
    chineseBracketPolarity:zf?.polarity||null,
    directOutsideStatus:d.status,
    directOutsidePolarity:df?.polarity||null,
    nestedStatus:n.status,
    nestedPolarity:nf?.polarity||null,
    unbalancedStatus:u.status,
    unbalancedPolarity:uf?.polarity||null,
    multilineStatus:m.status,
    multilinePolarity:mf?.polarity||null,
    multilineBracketParserLimited:multilineMask.parserLimited,
    hypotheticalEnglishStatus:hs.status,
    hypotheticalEnglishPolarity:hsf?.polarity||null,
    hypotheticalChineseStatus:hz.status,
    hypotheticalChinesePolarity:hzf?.polarity||null,
    directAfterHypotheticalStatus:hd.status,
    directAfterHypotheticalPolarity:hdf?.polarity||null,
    hypotheticalParserLimited:overlongMask.parserLimited,
    hypotheticalParserLimitedStatus:ho.status,
    rawRelationPreserved:af?.relation===bracketRefute.relation&&hsf?.relation===hypotheticalSupport.relation,
    crossOrganCovered:true,
    provenancePreserved:Boolean(af?.provenance&&zf?.provenance&&hsf?.provenance&&hzf?.provenance&&hdf?.provenance),
    closureAuthority:guarded.receiptPipeline?.closureAuthority||null
  },
  failures,
  boundary:'Canonical VAJRA receipt pipeline composes bounded editorial-bracket and explicit hypothetical/thought-experiment classification containment with the verified ambiguity/conflict guard. Hypothetical support/refute wording cannot become unconditional polarity inside a supported single-line sentence-bounded span, while a later direct assessment remains visible. Unsupported overlong hypothetical spans are exposed as parserLimited and left visible conservatively. Raw relation/provenance are preserved. This is deterministic structural scope containment, not semantic counterfactual reasoning, truth judgment, source-independence proof or evidence-quality scoring.'
};
await fs.writeFile(resultPath,JSON.stringify(result,null,2)+'\n','utf8');
console.log(JSON.stringify(result,null,2));
if(failures.length)process.exitCode=1;
