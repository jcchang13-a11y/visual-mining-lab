import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import {auditReceiptAmbiguity,applyGuardedHandoffResults} from './vajra-ambiguity-guard.mjs';

const root=process.cwd();
const code=await fs.readFile(path.join(root,'nostromo','vajra','vajra-engine.js'),'utf8');
vm.runInThisContext(code,{filename:'nostromo/vajra/vajra-engine.js'});
const V=globalThis.VajraEngine;
const failures=[];
const check=(ok,type,detail)=>{if(!ok)failures.push({type,detail});};

const base=V.run('所有自動化測試結果都能直接證明系統可靠',6);
const branch=base.unresolved.find(x=>x.handoff?.preferredOrgan==='DROPLET')||base.unresolved[0];
if(!branch)failures.push({type:'NO_TESTABLE_BRANCH'});

const common={
  targetRef:branch?.targetRef,
  clauseRef:branch?.clauseRef,
  lens:branch?.lens,
  organ:'DROPLET',
  status:'EXECUTED',
  material:'A bounded returned observation is present for branch-scope audit.'
};
const explicitSupport={...common,provenance:'support-control',material:'A bounded verified run reproduced the target pattern.',relation:'This evidence supports the target claim within the tested scope.'};
const explicitRefute={...common,provenance:'refute-control',material:'A bounded adversarial run reproduced a failure condition.',relation:'This evidence refutes the target claim within the tested scope.'};

const cases=[
  {
    id:'EN_SUFFIX_UNLESS_SUPPORT',
    receipt:{...common,provenance:'en-unless-support',relation:'This evidence supports the target claim unless synthetic duplicates are present.'},
    peer:explicitSupport
  },
  {
    id:'EN_PREFIX_UNLESS_REFUTE',
    receipt:{...common,provenance:'en-unless-refute',relation:'Unless duplicate inputs are removed, this evidence refutes the target claim.'},
    peer:explicitRefute
  },
  {
    id:'EN_PREFIX_EXCEPT_IF_SUPPORT',
    receipt:{...common,provenance:'en-except-if-support',relation:'Except if the retry policy is disabled, this evidence supports the target claim.'},
    peer:explicitSupport
  },
  {
    id:'ZH_PREFIX_UNLESS_SUPPORT',
    receipt:{...common,provenance:'zh-unless-support',relation:'除非排除重複樣本，這份證據才支持目標命題。'},
    peer:explicitSupport
  },
  {
    id:'ZH_EXCEPTION_REFUTE',
    receipt:{...common,provenance:'zh-exception-refute',relation:'除了離線模式之外，這份證據反駁目標命題。'},
    peer:explicitRefute
  }
];

const findings=[];
for(const c of cases){
  const audit=auditReceiptAmbiguity([c.peer,c.receipt]);
  const finding=audit.ambiguous?.[0]||audit.contested?.[0]||null;
  const polarity=finding?.receipts?.find(x=>x.provenance===c.receipt.provenance)?.polarity||null;
  findings.push({id:c.id,status:audit.status,polarity,contested:audit.contested?.length||0});
  check(audit.status==='AMBIGUITY_FOUND','EXCEPTION_SCOPE_NOT_PRESERVED',{id:c.id,audit});
  check(polarity==='UNSPECIFIED','EXCEPTION_SCOPE_FALSE_DIRECTION',{id:c.id,polarity,audit});
  check(!(audit.contested?.length),'EXCEPTION_SCOPE_FALSE_CONFLICT',{id:c.id,audit});
}

const crossOrganException={...common,organ:'MU/TH/UR',provenance:'muther-exception',relation:'This evidence refutes the target claim unless the archived sample is excluded.'};
const crossOrganAudit=auditReceiptAmbiguity([explicitSupport,crossOrganException]);
const crossOrganGuarded=applyGuardedHandoffResults(base,[explicitSupport,crossOrganException],V);
const crossOrganBranch=crossOrganGuarded.unresolved.find(x=>x.targetRef===branch?.targetRef&&x.clauseRef===branch?.clauseRef&&x.lens===branch?.lens);
check(crossOrganAudit.status==='AMBIGUITY_FOUND','CROSS_ORGAN_EXCEPTION_NOT_AMBIGUOUS',crossOrganAudit);
check(!(crossOrganAudit.contested?.length),'CROSS_ORGAN_EXCEPTION_FALSE_CONFLICT',crossOrganAudit);
check(crossOrganBranch?.status==='AMBIGUOUS_BY_RECEIPTS','CROSS_ORGAN_EXCEPTION_FALSE_CLOSURE',{status:crossOrganBranch?.status,audit:crossOrganAudit});

const ordinaryMention={...common,provenance:'ordinary-exception-word-control',material:'The report documents an exception field in its schema.',relation:'This evidence supports the target claim within the tested scope.'};
const ordinaryAudit=auditReceiptAmbiguity([explicitSupport,ordinaryMention]);
const ordinaryFinding=ordinaryAudit.ambiguous?.[0]||ordinaryAudit.contested?.[0]||null;
const ordinaryPolarity=(ordinaryFinding?.receipts||[]).find(x=>x.provenance==='ordinary-exception-word-control')?.polarity||'SUPPORTS';
check(ordinaryAudit.status==='NO_AMBIGUITY_FOUND','ORDINARY_EXCEPTION_WORD_FALSE_AMBIGUITY',ordinaryAudit);
check(ordinaryPolarity==='SUPPORTS','ORDINARY_SUPPORT_FALSE_MASK',ordinaryPolarity);

const result={
  schema:'nostromo-vajra-exception-scope-test/v0.1',
  completedAt:new Date().toISOString(),
  guardVersion:'0.5.3',
  status:failures.length?'FAIL':'PASS',
  finding:{
    cases:findings,
    crossOrganStatus:crossOrganAudit.status,
    crossOrganBranchStatus:crossOrganBranch?.status||null,
    ordinaryControlStatus:ordinaryAudit.status,
    ordinaryControlPolarity:ordinaryPolarity
  },
  failures,
  boundary:'The first red dedicated run was a test-fixture qualification failure: exception receipts omitted the required non-empty material field and were correctly rejected as malformed before polarity analysis. This revision preserves that failure evidence and supplies structurally qualifying material so the test reaches the intended exception-scope logic. The adversarial test verifies bounded English and Chinese exception-scope masking in VAJRA receipt polarity. Relations containing explicit unless/except or 除非/除了 exception scope must remain UNSPECIFIED and cannot manufacture unconditional support/refute closure or a false cross-organ contradiction. Ordinary prose that merely mentions an exception field remains directional when its relation is explicitly unconditional. This is deterministic lexical scope containment, not general semantic exception parsing, truth judgment, or evidence-quality scoring.'
};
await fs.writeFile(path.join(root,'nostromo','integration','vajra-exception-scope-last-result.json'),JSON.stringify(result,null,2)+'\n','utf8');
console.log(JSON.stringify(result,null,2));
if(failures.length)process.exit(1);
