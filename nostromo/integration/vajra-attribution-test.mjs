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

const englishColonAccordingTo=receipt('en-colon-according-to','According to Source A: the published analysis supports the target claim.');
const englishColonAccordingToAudit=auditReceiptAmbiguity([directRefute,englishColonAccordingTo]);
if(englishColonAccordingToAudit.status!=='AMBIGUITY_FOUND')failures.push({type:'EN_COLON_ACCORDING_TO_FALSE_CONFLICT',audit:englishColonAccordingToAudit});
if(polarity(englishColonAccordingToAudit,'en-colon-according-to')!=='UNSPECIFIED')failures.push({type:'EN_COLON_ACCORDING_TO_NOT_UNSPECIFIED',actual:polarity(englishColonAccordingToAudit,'en-colon-according-to')});

const chineseAttributedSupport=receipt('zh-attributed-support','研究報告指出，這組結果支持目標命題。');
const chineseAttributedSupportAudit=auditReceiptAmbiguity([directRefute,chineseAttributedSupport]);
if(chineseAttributedSupportAudit.status!=='AMBIGUITY_FOUND')failures.push({type:'ZH_ATTRIBUTED_SUPPORT_FALSE_CONFLICT',audit:chineseAttributedSupportAudit});
if(polarity(chineseAttributedSupportAudit,'zh-attributed-support')!=='UNSPECIFIED')failures.push({type:'ZH_ATTRIBUTED_SUPPORT_NOT_UNSPECIFIED',actual:polarity(chineseAttributedSupportAudit,'zh-attributed-support')});

const chineseAccordingTo=receipt('zh-according-to','根據來源甲，這份材料反駁目標命題。','MU/TH/UR');
const chineseAccordingToAudit=auditReceiptAmbiguity([directSupport,chineseAccordingTo]);
if(chineseAccordingToAudit.status!=='AMBIGUITY_FOUND')failures.push({type:'ZH_ACCORDING_TO_FALSE_CONFLICT',audit:chineseAccordingToAudit});
if(polarity(chineseAccordingToAudit,'zh-according-to')!=='UNSPECIFIED')failures.push({type:'ZH_ACCORDING_TO_NOT_UNSPECIFIED',actual:polarity(chineseAccordingToAudit,'zh-according-to')});

const chineseColonAccordingTo=receipt('zh-colon-according-to','根據來源甲：這份材料反駁目標命題。','MU/TH/UR');
const chineseColonAccordingToAudit=auditReceiptAmbiguity([directSupport,chineseColonAccordingTo]);
if(chineseColonAccordingToAudit.status!=='AMBIGUITY_FOUND')failures.push({type:'ZH_COLON_ACCORDING_TO_FALSE_CONFLICT',audit:chineseColonAccordingToAudit});
if(polarity(chineseColonAccordingToAudit,'zh-colon-according-to')!=='UNSPECIFIED')failures.push({type:'ZH_COLON_ACCORDING_TO_NOT_UNSPECIFIED',actual:polarity(chineseColonAccordingToAudit,'zh-colon-according-to')});

const chineseColonAccordingToAscii=receipt('zh-colon-according-to-ascii','依據來源乙: these results support the target claim.');
const chineseColonAccordingToAsciiAudit=auditReceiptAmbiguity([directRefute,chineseColonAccordingToAscii]);
if(chineseColonAccordingToAsciiAudit.status!=='AMBIGUITY_FOUND')failures.push({type:'ZH_COLON_ACCORDING_TO_ASCII_FALSE_CONFLICT',audit:chineseColonAccordingToAsciiAudit});
if(polarity(chineseColonAccordingToAsciiAudit,'zh-colon-according-to-ascii')!=='UNSPECIFIED')failures.push({type:'ZH_COLON_ACCORDING_TO_ASCII_NOT_UNSPECIFIED',actual:polarity(chineseColonAccordingToAsciiAudit,'zh-colon-according-to-ascii')});

const quotedRefute=receipt('quoted-refute','Excerpt: “the evidence refutes the target claim.”','MU/TH/UR');
const quotedRefuteAudit=auditReceiptAmbiguity([directSupport,quotedRefute]);
if(quotedRefuteAudit.status!=='AMBIGUITY_FOUND')failures.push({type:'QUOTED_REFUTE_FALSE_CONFLICT',audit:quotedRefuteAudit});
if(polarity(quotedRefuteAudit,'quoted-refute')!=='UNSPECIFIED')failures.push({type:'QUOTED_REFUTE_NOT_UNSPECIFIED',actual:polarity(quotedRefuteAudit,'quoted-refute')});

const quotedSupport=receipt('quoted-support','Excerpt: "the evidence supports the target claim."');
const quotedSupportAudit=auditReceiptAmbiguity([directRefute,quotedSupport]);
if(quotedSupportAudit.status!=='AMBIGUITY_FOUND')failures.push({type:'QUOTED_SUPPORT_FALSE_CONFLICT',audit:quotedSupportAudit});
if(polarity(quotedSupportAudit,'quoted-support')!=='UNSPECIFIED')failures.push({type:'QUOTED_SUPPORT_NOT_UNSPECIFIED',actual:polarity(quotedSupportAudit,'quoted-support')});

const chineseQuotedRefute=receipt('zh-quoted-refute','摘錄：「這份材料反駁目標命題。」','MU/TH/UR');
const chineseQuotedRefuteAudit=auditReceiptAmbiguity([directSupport,chineseQuotedRefute]);
if(chineseQuotedRefuteAudit.status!=='AMBIGUITY_FOUND')failures.push({type:'ZH_QUOTED_REFUTE_FALSE_CONFLICT',audit:chineseQuotedRefuteAudit});
if(polarity(chineseQuotedRefuteAudit,'zh-quoted-refute')!=='UNSPECIFIED')failures.push({type:'ZH_QUOTED_REFUTE_NOT_UNSPECIFIED',actual:polarity(chineseQuotedRefuteAudit,'zh-quoted-refute')});

const laterDirectRefute=receipt('later-direct-refute','The paper claims that the observations support the target claim. Independent reproduction refutes the target claim.','MU/TH/UR');
const laterDirectRefuteAudit=auditReceiptAmbiguity([directSupport,laterDirectRefute]);
if(laterDirectRefuteAudit.status!=='CONFLICT_FOUND')failures.push({type:'LATER_DIRECT_REFUTE_HIDDEN',audit:laterDirectRefuteAudit});
if(polarity(laterDirectRefuteAudit,'later-direct-refute')!=='REFUTES')failures.push({type:'LATER_DIRECT_REFUTE_POLARITY_WRONG',actual:polarity(laterDirectRefuteAudit,'later-direct-refute')});

const laterDirectSupport=receipt('later-direct-support','來源乙聲稱這些結果反駁目標命題。重新執行的對照結果支持目標命題。');
const laterDirectSupportAudit=auditReceiptAmbiguity([directRefute,laterDirectSupport]);
if(laterDirectSupportAudit.status!=='CONFLICT_FOUND')failures.push({type:'ZH_LATER_DIRECT_SUPPORT_HIDDEN',audit:laterDirectSupportAudit});
if(polarity(laterDirectSupportAudit,'later-direct-support')!=='SUPPORTS')failures.push({type:'ZH_LATER_DIRECT_SUPPORT_POLARITY_WRONG',actual:polarity(laterDirectSupportAudit,'later-direct-support')});

const colonThenDirectSupport=receipt('zh-colon-then-direct-support','根據來源甲：這份材料反駁目標命題。重新執行的對照結果支持目標命題。');
const colonThenDirectSupportAudit=auditReceiptAmbiguity([directRefute,colonThenDirectSupport]);
if(colonThenDirectSupportAudit.status!=='CONFLICT_FOUND')failures.push({type:'ZH_COLON_THEN_DIRECT_SUPPORT_HIDDEN',audit:colonThenDirectSupportAudit});
if(polarity(colonThenDirectSupportAudit,'zh-colon-then-direct-support')!=='SUPPORTS')failures.push({type:'ZH_COLON_THEN_DIRECT_SUPPORT_POLARITY_WRONG',actual:polarity(colonThenDirectSupportAudit,'zh-colon-then-direct-support')});

const quoteThenDirectRefute=receipt('quote-then-direct-refute','Excerpt: “the evidence supports the target claim.” Independent reproduction refutes the target claim.','MU/TH/UR');
const quoteThenDirectRefuteAudit=auditReceiptAmbiguity([directSupport,quoteThenDirectRefute]);
if(quoteThenDirectRefuteAudit.status!=='CONFLICT_FOUND')failures.push({type:'QUOTE_THEN_DIRECT_REFUTE_HIDDEN',audit:quoteThenDirectRefuteAudit});
if(polarity(quoteThenDirectRefuteAudit,'quote-then-direct-refute')!=='REFUTES')failures.push({type:'QUOTE_THEN_DIRECT_REFUTE_POLARITY_WRONG',actual:polarity(quoteThenDirectRefuteAudit,'quote-then-direct-refute')});

const zhQuoteThenDirectSupport=receipt('zh-quote-then-direct-support','摘錄：「這份材料反駁目標命題。」重新執行的對照結果支持目標命題。');
const zhQuoteThenDirectSupportAudit=auditReceiptAmbiguity([directRefute,zhQuoteThenDirectSupport]);
if(zhQuoteThenDirectSupportAudit.status!=='CONFLICT_FOUND')failures.push({type:'ZH_QUOTE_THEN_DIRECT_SUPPORT_HIDDEN',audit:zhQuoteThenDirectSupportAudit});
if(polarity(zhQuoteThenDirectSupportAudit,'zh-quote-then-direct-support')!=='SUPPORTS')failures.push({type:'ZH_QUOTE_THEN_DIRECT_SUPPORT_POLARITY_WRONG',actual:polarity(zhQuoteThenDirectSupportAudit,'zh-quote-then-direct-support')});

const result={
  schema:'nostromo-vajra-attribution-test/v0.3',
  completedAt:new Date().toISOString(),
  status:failures.length?'FAIL':'PASS',
  guardVersion:'v0.5.13',
  cases:{
    directConflict:directConflict.status,
    attributedRefute:attributedRefuteAudit.status,
    attributedSupport:attributedSupportAudit.status,
    englishColonAccordingTo:englishColonAccordingToAudit.status,
    chineseAttributedSupport:chineseAttributedSupportAudit.status,
    chineseAccordingTo:chineseAccordingToAudit.status,
    chineseColonAccordingTo:chineseColonAccordingToAudit.status,
    chineseColonAccordingToAscii:chineseColonAccordingToAsciiAudit.status,
    quotedRefute:quotedRefuteAudit.status,
    quotedSupport:quotedSupportAudit.status,
    chineseQuotedRefute:chineseQuotedRefuteAudit.status,
    laterDirectRefute:laterDirectRefuteAudit.status,
    laterDirectSupport:laterDirectSupportAudit.status,
    colonThenDirectSupport:colonThenDirectSupportAudit.status,
    quoteThenDirectRefute:quoteThenDirectRefuteAudit.status,
    zhQuoteThenDirectSupport:zhQuoteThenDirectSupportAudit.status
  },
  failures,
  boundary:'PASS means bounded English/Chinese reporting/attribution scopes, including 根據/依據 comma and colon-delimited forms, and bounded paired quoted excerpts cannot by themselves manufacture unconditional SUPPORTS/REFUTES polarity, while a later separate direct assessment outside the attribution/quote remains visible. Attribution and quote handling are bounded lexical containment, not discourse parsing, semantic source attribution, quotation parsing, quote ownership inference, source-quality judgment, factual adjudication or proof of source independence.'
};
await fs.writeFile(resultPath,JSON.stringify(result,null,2)+'\n','utf8');
console.log(JSON.stringify(result,null,2));
if(result.status!=='PASS')process.exitCode=1;
