// Focused adversarial coverage for VAJRA v0.5.16 nested-parenthetical containment.
// Evidence artifact is intentionally separate from the shared ambiguity regression result.
import fs from 'node:fs/promises';
import path from 'node:path';
import {auditReceiptAmbiguity} from './vajra-ambiguity-guard.mjs';

const root=process.cwd();
const resultPath=path.join(root,'nostromo','integration','vajra-nested-parenthetical-last-result.json');
const failures=[];
const common={targetRef:'vajra:nested-parenthetical:test',clauseRef:'clause:1',lens:'evidence',organ:'DROPLET',status:'EXECUTED'};
const directSupport={...common,provenance:'direct-support',material:'A direct bounded assessment is available for the branch.',relation:'This evidence supports the target claim within the tested scope.'};
const directRefute={...common,provenance:'direct-refute',material:'A direct bounded counter-assessment is available for the branch.',relation:'This evidence refutes the target claim within the tested scope.'};

function polarityFor(receipt,peer=directSupport){
  const audit=auditReceiptAmbiguity([peer,receipt]);
  const finding=audit.ambiguous?.[0]||audit.contested?.[0]||null;
  const view=finding?.receipts?.find(x=>x.provenance===receipt.provenance)||null;
  return {audit,polarity:view?.polarity||null};
}

const nestedEnglish={...common,provenance:'nested-en',material:'The return contains a nested aside only.',relation:'This return is informative (the reviewer notes (a prior report supports the target claim) but does not independently endorse it).'};
const nestedEnglishResult=polarityFor(nestedEnglish);
if(nestedEnglishResult.audit.status!=='AMBIGUITY_FOUND')failures.push({type:'NESTED_ENGLISH_NOT_AMBIGUOUS',actual:nestedEnglishResult.audit.status});
if(nestedEnglishResult.polarity!=='UNSPECIFIED')failures.push({type:'NESTED_ENGLISH_POLARITY_LEAK',actual:nestedEnglishResult.polarity});

const nestedChinese={...common,provenance:'nested-zh',material:'回傳只包含巢狀括號中的來源說法。',relation:'這份回傳只是補充說明（審查者提到（舊報告支持目標命題）但未自行背書）。'};
const nestedChineseResult=polarityFor(nestedChinese);
if(nestedChineseResult.audit.status!=='AMBIGUITY_FOUND')failures.push({type:'NESTED_CHINESE_NOT_AMBIGUOUS',actual:nestedChineseResult.audit.status});
if(nestedChineseResult.polarity!=='UNSPECIFIED')failures.push({type:'NESTED_CHINESE_POLARITY_LEAK',actual:nestedChineseResult.polarity});

const directOutside={...common,provenance:'outside-direct',material:'The nested aside is background but the return also makes a direct assessment.',relation:'The note (the reviewer says (a prior report refutes the target claim)) is background. This evidence supports the target claim within the tested scope.'};
const directOutsideResult=polarityFor(directOutside,directRefute);
if(directOutsideResult.polarity!=='SUPPORTS')failures.push({type:'DIRECT_OUTSIDE_PARENTHESES_HIDDEN',actual:directOutsideResult.polarity});
if(directOutsideResult.audit.status!=='CONFLICT_FOUND')failures.push({type:'DIRECT_OUTSIDE_CONTROL_NOT_VISIBLE',actual:directOutsideResult.audit.status});

const multiline={...common,provenance:'multiline-limit',material:'This deliberately crosses a line boundary inside a parenthetical.',relation:'Background marker (legacy material\nrefutes the target claim) remains outside the bounded single-line parser guarantee.'};
const multilineResult=polarityFor(multiline);
if(multilineResult.polarity!=='REFUTES')failures.push({type:'MULTILINE_SCOPE_SILENTLY_HIDDEN',actual:multilineResult.polarity});
if(multilineResult.audit.status!=='CONFLICT_FOUND')failures.push({type:'MULTILINE_SCOPE_NOT_CONSERVATIVE',actual:multilineResult.audit.status});

const tooDeep={...common,provenance:'too-deep',material:'This deliberately exceeds the bounded nesting limit.',relation:'This return is background (level one (level two (level three (refutes the target claim)))).'};
const tooDeepResult=polarityFor(tooDeep);
if(tooDeepResult.polarity!=='REFUTES')failures.push({type:'TOO_DEEP_SCOPE_SILENTLY_HIDDEN',actual:tooDeepResult.polarity});
if(tooDeepResult.audit.status!=='CONFLICT_FOUND')failures.push({type:'TOO_DEEP_SCOPE_NOT_CONSERVATIVE',actual:tooDeepResult.audit.status});

const unbalanced={...common,provenance:'unbalanced',material:'This deliberately contains an unbalanced parenthetical.',relation:'Background note (refutes the target claim without a closing delimiter.'};
const unbalancedResult=polarityFor(unbalanced);
if(unbalancedResult.polarity!=='REFUTES')failures.push({type:'UNBALANCED_SCOPE_SILENTLY_HIDDEN',actual:unbalancedResult.polarity});
if(unbalancedResult.audit.status!=='CONFLICT_FOUND')failures.push({type:'UNBALANCED_SCOPE_NOT_CONSERVATIVE',actual:unbalancedResult.audit.status});

const result={
  schema:'nostromo-vajra-nested-parenthetical-test/v0.2',
  completedAt:new Date().toISOString(),
  status:failures.length?'FAIL':'PASS',
  finding:{
    version:'v0.5.16',
    englishNestedStatus:nestedEnglishResult.audit.status,
    englishNestedPolarity:nestedEnglishResult.polarity,
    chineseNestedStatus:nestedChineseResult.audit.status,
    chineseNestedPolarity:nestedChineseResult.polarity,
    directOutsideStatus:directOutsideResult.audit.status,
    directOutsidePolarity:directOutsideResult.polarity,
    multilineStatus:multilineResult.audit.status,
    multilinePolarity:multilineResult.polarity,
    tooDeepStatus:tooDeepResult.audit.status,
    tooDeepPolarity:tooDeepResult.polarity,
    unbalancedStatus:unbalancedResult.audit.status,
    unbalancedPolarity:unbalancedResult.polarity,
    interpretation:'Nested parenthetical-only polarity is contained up to the declared bounded depth, while direct assessments outside the parenthetical remain visible. Newline-bearing, too-deep and unbalanced parser-limit cases remain visible rather than being silently masked.'
  },
  failures,
  boundary:'NFKC-normalized ASCII/full-width parentheses are scanned with bounded depth <=3, bounded top-level span length <=362 characters and no newline. Directional support/refute wording inside a qualifying single-line nested parenthetical is masked before lexical polarity classification. Newline-bearing, too-deep, overlong or unbalanced spans are not masked, so parser limits cannot silently manufacture certainty. The multiline adversarial case deliberately avoids attribution/reporting vocabulary so it isolates newline parser-limit behavior rather than source-attribution masking. This remains deterministic structural containment, not general parenthesis parsing or semantic scope resolution.'
};
await fs.writeFile(resultPath,JSON.stringify(result,null,2)+'\n','utf8');
console.log(JSON.stringify(result,null,2));
if(failures.length)process.exitCode=1;
