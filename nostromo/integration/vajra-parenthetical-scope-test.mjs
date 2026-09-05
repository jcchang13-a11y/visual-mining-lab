import fs from 'node:fs/promises';
import path from 'node:path';
import {auditReceiptAmbiguity} from './vajra-ambiguity-guard.mjs';

const root=process.cwd();
const resultPath=path.join(root,'nostromo','integration','vajra-parenthetical-scope-last-result.json');
const failures=[];
const base={targetRef:'t-parenthetical',clauseRef:'c-parenthetical',lens:'evidence',organ:'DROPLET',status:'EXECUTED',material:'bounded parenthetical scope test material'};
const receipt=(provenance,relation,organ='DROPLET')=>({...base,provenance,relation,organ});
function polarity(audit,provenance){
  const finding=audit.ambiguous?.[0]||audit.contested?.[0]||null;
  return finding?.receipts?.find(x=>x.provenance===provenance)?.polarity||null;
}
function check(ok,type,detail){if(!ok)failures.push({type,detail});}

const directSupport=receipt('direct-support','This evidence supports the target claim.');
const directRefute=receipt('direct-refute','This evidence refutes the target claim.','MU/TH/UR');

const englishParenthetical=receipt('en-parenthetical','The measurement was recorded (the source says it supports the target claim).','SHROOMING');
const englishParentheticalAudit=auditReceiptAmbiguity([directRefute,englishParenthetical]);
check(englishParentheticalAudit.status==='AMBIGUITY_FOUND','EN_PARENTHETICAL_FALSE_CONFLICT',englishParentheticalAudit);
check(polarity(englishParentheticalAudit,'en-parenthetical')==='UNSPECIFIED','EN_PARENTHETICAL_NOT_UNSPECIFIED',polarity(englishParentheticalAudit,'en-parenthetical'));

const englishBareParenthetical=receipt('en-bare-parenthetical','The measurement was recorded (supports the target claim).','SHROOMING');
const englishBareParentheticalAudit=auditReceiptAmbiguity([directRefute,englishBareParenthetical]);
check(englishBareParentheticalAudit.status==='AMBIGUITY_FOUND','EN_BARE_PARENTHETICAL_FALSE_CONFLICT',englishBareParentheticalAudit);
check(polarity(englishBareParentheticalAudit,'en-bare-parenthetical')==='UNSPECIFIED','EN_BARE_PARENTHETICAL_NOT_UNSPECIFIED',polarity(englishBareParentheticalAudit,'en-bare-parenthetical'));

const chineseParenthetical=receipt('zh-parenthetical','量測已記錄（來源稱這支持目標命題）。','SHROOMING');
const chineseParentheticalAudit=auditReceiptAmbiguity([directRefute,chineseParenthetical]);
check(chineseParentheticalAudit.status==='AMBIGUITY_FOUND','ZH_PARENTHETICAL_FALSE_CONFLICT',chineseParentheticalAudit);
check(polarity(chineseParentheticalAudit,'zh-parenthetical')==='UNSPECIFIED','ZH_PARENTHETICAL_NOT_UNSPECIFIED',polarity(chineseParentheticalAudit,'zh-parenthetical'));

const englishThenDirect=receipt('en-parenthetical-then-direct','The measurement was recorded (the source says it supports the target claim). Independent reproduction refutes the target claim.','MU/TH/UR');
const englishThenDirectAudit=auditReceiptAmbiguity([directSupport,englishThenDirect]);
check(englishThenDirectAudit.status==='CONFLICT_FOUND','EN_DIRECT_AFTER_PARENTHETICAL_HIDDEN',englishThenDirectAudit);
check(polarity(englishThenDirectAudit,'en-parenthetical-then-direct')==='REFUTES','EN_DIRECT_AFTER_PARENTHETICAL_POLARITY_WRONG',polarity(englishThenDirectAudit,'en-parenthetical-then-direct'));

const chineseThenDirect=receipt('zh-parenthetical-then-direct','量測已記錄（來源稱這反駁目標命題）。重新執行的對照結果支持目標命題。','MU/TH/UR');
const chineseThenDirectAudit=auditReceiptAmbiguity([directRefute,chineseThenDirect]);
check(chineseThenDirectAudit.status==='CONFLICT_FOUND','ZH_DIRECT_AFTER_PARENTHETICAL_HIDDEN',chineseThenDirectAudit);
check(polarity(chineseThenDirectAudit,'zh-parenthetical-then-direct')==='SUPPORTS','ZH_DIRECT_AFTER_PARENTHETICAL_POLARITY_WRONG',polarity(chineseThenDirectAudit,'zh-parenthetical-then-direct'));

const ordinaryParenthetical=receipt('ordinary-parenthetical','The measurement (n=4) was recorded without a directional assessment.','SHROOMING');
const ordinaryParentheticalAudit=auditReceiptAmbiguity([directSupport,ordinaryParenthetical]);
check(ordinaryParentheticalAudit.status==='AMBIGUITY_FOUND','ORDINARY_PARENTHETICAL_CONTROL_FAILED',ordinaryParentheticalAudit);
check(polarity(ordinaryParentheticalAudit,'ordinary-parenthetical')==='UNSPECIFIED','ORDINARY_PARENTHETICAL_POLARITY_WRONG',polarity(ordinaryParentheticalAudit,'ordinary-parenthetical'));

const result={
  schema:'nostromo-vajra-parenthetical-scope-test/v0.1',
  completedAt:new Date().toISOString(),
  status:failures.length?'FAIL':'PASS',
  guardVersion:'v0.5.14',
  cases:{
    englishParenthetical:englishParentheticalAudit.status,
    englishBareParenthetical:englishBareParentheticalAudit.status,
    chineseFullWidthParenthetical:chineseParentheticalAudit.status,
    englishDirectAfterParenthetical:englishThenDirectAudit.status,
    chineseDirectAfterParenthetical:chineseThenDirectAudit.status,
    ordinaryParenthetical:ordinaryParentheticalAudit.status
  },
  failures,
  boundary:'PASS means bounded non-nested parenthetical asides cannot by themselves manufacture unconditional SUPPORTS/REFUTES polarity, including Chinese full-width parentheses after NFKC normalization, while a later direct assessment outside the parenthetical remains visible. This is deterministic lexical containment, not general parenthesis parsing, nested-parenthesis parsing, semantic scope resolution, discourse parsing, source attribution, factual adjudication or proof of source independence.'
};
await fs.writeFile(resultPath,JSON.stringify(result,null,2)+'\n','utf8');
console.log(JSON.stringify(result,null,2));
if(result.status!=='PASS')process.exitCode=1;
