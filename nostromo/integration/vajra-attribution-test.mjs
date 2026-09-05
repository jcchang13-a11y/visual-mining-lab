import fs from 'node:fs/promises';
import path from 'node:path';
import {auditReceiptAmbiguity} from './vajra-ambiguity-guard.mjs';

const root=process.cwd();
const resultPath=path.join(root,'nostromo','integration','vajra-attribution-last-result.json');
const failures=[];
const base={targetRef:'t-attribution',clauseRef:'c-attribution',lens:'evidence',organ:'DROPLET',status:'EXECUTED',material:'bounded attribution test material'};
const receipt=(provenance,relation,organ='DROPLET')=>({...base,provenance,relation,organ});
function polarity(audit,provenance){
  const finding=audit.ambiguous?.[0]||audit.contested?.[0]||null;
  return finding?.receipts?.find(x=>x.provenance===provenance)?.polarity||null;
}

const directSupport=receipt('direct-support','This evidence supports the target claim.');
const directRefute=receipt('direct-refute','This evidence refutes the target claim.','MU/TH/UR');
const directConflict=auditReceiptAmbiguity([directSupport,directRefute]);
if(directConflict.status!=='CONFLICT_FOUND')failures.push({type:'DIRECT_CONFLICT_CONTROL_FAILED',audit:directConflict});

const attributedRefute=receipt('attributed-refute','The report claims that its experiment refutes the target claim.','MU/TH/UR');
const attributedRefuteAudit=auditReceiptAmbiguity([directSupport,attributedRefute]);
if(attributedRefuteAudit.status!=='AMBIGUITY_FOUND')failures.push({type:'ATTRIBUTED_REFUTE_FALSE_CONFLICT',audit:attributedRefuteAudit});
if(polarity(attributedRefuteAudit,'attributed-refute')!=='UNSPECIFIED')failures.push({type:'ATTRIBUTED_REFUTE_NOT_UNSPECIFIED',actual:polarity(attributedRefuteAudit,'attributed-refute')});

const attributedSupport=receipt('attributed-support','According to Source A, the published analysis supports the target claim.');
const attributedSupportAudit=auditReceiptAmbiguity([directRefute,attributedSupport]);
if(attributedSupportAudit.status!=='AMBIGUITY_FOUND')failures.push({type:'ATTRIBUTED_SUPPORT_FALSE_CONFLICT',audit:attributedSupportAudit});
if(polarity(attributedSupportAudit,'attributed-support')!=='UNSPECIFIED')failures.push({type:'ATTRIBUTED_SUPPORT_NOT_UNSPECIFIED',actual:polarity(attributedSupportAudit,'attributed-support')});

const chineseAttributedSupport=receipt('zh-attributed-support','研究報告指出，這組結果支持目標命題。');
const chineseAttributedSupportAudit=auditReceiptAmbiguity([directRefute,chineseAttributedSupport]);
if(chineseAttributedSupportAudit.status!=='AMBIGUITY_FOUND')failures.push({type:'ZH_ATTRIBUTED_SUPPORT_FALSE_CONFLICT',audit:chineseAttributedSupportAudit});
if(polarity(chineseAttributedSupportAudit,'zh-attributed-support')!=='UNSPECIFIED')failures.push({type:'ZH_ATTRIBUTED_SUPPORT_NOT_UNSPECIFIED',actual:polarity(chineseAttributedSupportAudit,'zh-attributed-support')});

const chineseAccordingTo=receipt('zh-according-to','根據來源甲，這份材料反駁目標命題。','MU/TH/UR');
const chineseAccordingToAudit=auditReceiptAmbiguity([directSupport,chineseAccordingTo]);
if(chineseAccordingToAudit.status!=='AMBIGUITY_FOUND')failures.push({type:'ZH_ACCORDING_TO_FALSE_CONFLICT',audit:chineseAccordingToAudit});
if(polarity(chineseAccordingToAudit,'zh-according-to')!=='UNSPECIFIED')failures.push({type:'ZH_ACCORDING_TO_NOT_UNSPECIFIED',actual:polarity(chineseAccordingToAudit,'zh-according-to')});

const laterDirectRefute=receipt('later-direct-refute','The paper claims that the observations support the target claim. Independent reproduction refutes the target claim.','MU/TH/UR');
const laterDirectRefuteAudit=auditReceiptAmbiguity([directSupport,laterDirectRefute]);
if(laterDirectRefuteAudit.status!=='CONFLICT_FOUND')failures.push({type:'LATER_DIRECT_REFUTE_HIDDEN',audit:laterDirectRefuteAudit});
if(polarity(laterDirectRefuteAudit,'later-direct-refute')!=='REFUTES')failures.push({type:'LATER_DIRECT_REFUTE_POLARITY_WRONG',actual:polarity(laterDirectRefuteAudit,'later-direct-refute')});

const laterDirectSupport=receipt('later-direct-support','來源乙聲稱這些結果反駁目標命題。重新執行的對照結果支持目標命題。');
const laterDirectSupportAudit=auditReceiptAmbiguity([directRefute,laterDirectSupport]);
if(laterDirectSupportAudit.status!=='CONFLICT_FOUND')failures.push({type:'ZH_LATER_DIRECT_SUPPORT_HIDDEN',audit:laterDirectSupportAudit});
if(polarity(laterDirectSupportAudit,'later-direct-support')!=='SUPPORTS')failures.push({type:'ZH_LATER_DIRECT_SUPPORT_POLARITY_WRONG',actual:polarity(laterDirectSupportAudit,'later-direct-support')});

const result={
  schema:'nostromo-vajra-attribution-test/v0.1',
  completedAt:new Date().toISOString(),
  status:failures.length?'FAIL':'PASS',
  guardVersion:'v0.5.11',
  cases:{
    directConflict:directConflict.status,
    attributedRefute:attributedRefuteAudit.status,
    attributedSupport:attributedSupportAudit.status,
    chineseAttributedSupport:chineseAttributedSupportAudit.status,
    chineseAccordingTo:chineseAccordingToAudit.status,
    laterDirectRefute:laterDirectRefuteAudit.status,
    laterDirectSupport:laterDirectSupportAudit.status
  },
  failures,
  boundary:'PASS means bounded English/Chinese reporting/attribution scopes cannot by themselves manufacture unconditional SUPPORTS/REFUTES polarity, while a later separate direct assessment remains visible. This is deterministic lexical/structural attribution containment, not quotation parsing, semantic source attribution, source-quality judgment, factual adjudication or proof of source independence.'
};
await fs.writeFile(resultPath,JSON.stringify(result,null,2)+'\n','utf8');
console.log(JSON.stringify(result,null,2));
if(result.status!=='PASS')process.exitCode=1;
