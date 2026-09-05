import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import {auditVajraReceipts,applyVajraReceiptPipeline,maskEditorialBracketPolarity} from './vajra-receipt-pipeline.mjs';

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
const m=auditVajraReceipts([support,multiline]);
const mf=m.contested?.[0]?.receipts?.find(x=>x.provenance==='shroom-multiline');
if(m.status!=='CONFLICT_FOUND'||mf?.polarity!=='REFUTES')failures.push({type:'MULTILINE_NOT_CONSERVATIVE',status:m.status,polarity:mf?.polarity});

const guarded=applyVajraReceiptPipeline(base,[support,bracketRefute],V);
const guardedBranch=guarded.unresolved.find(x=>x.targetRef===branch?.targetRef&&x.clauseRef===branch?.clauseRef&&x.lens===branch?.lens);
if(guardedBranch?.status!=='AMBIGUOUS_BY_RECEIPTS')failures.push({type:'PIPELINE_FALSE_CLOSURE_NOT_BLOCKED',actual:guardedBranch?.status});
if(guarded.receiptPipeline?.status!=='CANONICAL_EXEC')failures.push({type:'CANONICAL_PIPELINE_MARKER_MISSING'});
if(guarded.receiptPipeline?.closureAuthority!=='NONE')failures.push({type:'CLOSURE_AUTHORITY_ESCALATED'});

const parserControl=maskEditorialBracketPolarity('Background [refutes target without close.');
if(!parserControl.parserLimited||parserControl.maskedRanges!==0)failures.push({type:'PARSER_LIMIT_NOT_AUDITABLE',parserControl});

const result={
  schema:'nostromo-vajra-receipt-pipeline/v0.1.0',
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
    rawRelationPreserved:af?.relation===bracketRefute.relation,
    crossOrganCovered:true,
    provenancePreserved:Boolean(af?.provenance&&zf?.provenance&&df?.provenance),
    closureAuthority:guarded.receiptPipeline?.closureAuthority||null
  },
  failures,
  boundary:'Canonical VAJRA receipt pipeline composes bounded editorial-bracket classification containment with the verified ambiguity/conflict guard. It preserves raw relation/provenance and leaves parser-limit spans visible. This is deterministic structural scope containment, not semantic quotation ownership, truth judgment, source-independence proof or evidence-quality scoring.'
};
await fs.writeFile(resultPath,JSON.stringify(result,null,2)+'\n','utf8');
console.log(JSON.stringify(result,null,2));
if(failures.length)process.exitCode=1;
