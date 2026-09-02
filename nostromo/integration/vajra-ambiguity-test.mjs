import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import {applyGuardedHandoffResults,auditReceiptAmbiguity} from './vajra-ambiguity-guard.mjs';

const root=process.cwd();
const resultPath=path.join(root,'nostromo','integration','vajra-ambiguity-last-result.json');
const code=await fs.readFile(path.join(root,'nostromo','vajra','vajra-engine.js'),'utf8');
vm.runInThisContext(code,{filename:'nostromo/vajra/vajra-engine.js'});
const V=globalThis.VajraEngine;
const failures=[];

const base=V.run('所有自動化測試結果都能直接證明系統可靠',6);
const branch=base.unresolved.find(x=>x.handoff?.preferredOrgan==='DROPLET')||base.unresolved[0];
if(!branch)failures.push({type:'NO_TESTABLE_BRANCH'});

const common={
  targetRef:branch?.targetRef,
  clauseRef:branch?.clauseRef,
  lens:branch?.lens,
  organ:branch?.handoff?.preferredOrgan,
  status:'EXECUTED'
};
const receiptA={...common,provenance:'source-A-independent',material:'A bounded test report found repeated failures under one adversarial input family.',relation:'This evidence supports narrowing the reliability claim to the tested scope only.'};
const receiptB={...common,provenance:'source-B-independent',material:'A separate run measured stable behavior on ordinary inputs but did not evaluate the adversarial family.',relation:'The run concerns ordinary inputs and its relation to the universal reliability claim is not determined.'};

const raw=V.applyHandoffResults(base,[receiptA,receiptB]);
const rawBranch=raw.unresolved.find(x=>x.targetRef===branch?.targetRef&&x.clauseRef===branch?.clauseRef&&x.lens===branch?.lens);
const audit=auditReceiptAmbiguity([receiptA,receiptB]);
const guarded=applyGuardedHandoffResults(base,[receiptA,receiptB],V);
const guardedBranch=guarded.unresolved.find(x=>x.targetRef===branch?.targetRef&&x.clauseRef===branch?.clauseRef&&x.lens===branch?.lens);

if(rawBranch?.status!=='RESOLVED_BY_RECEIPT')failures.push({type:'BASELINE_DID_NOT_EXPOSE_FIRST_RECEIPT_CLOSURE',actual:rawBranch?.status});
if(audit.status!=='AMBIGUITY_FOUND')failures.push({type:'AMBIGUITY_NOT_DETECTED',audit});
if(guardedBranch?.status!=='AMBIGUOUS_BY_RECEIPTS')failures.push({type:'FALSE_CERTAINTY_NOT_BLOCKED',actual:guardedBranch?.status});
if(!guarded.receiptAmbiguityAudit?.ambiguous?.length)failures.push({type:'AMBIGUITY_AUDIT_MISSING'});

// Control: two explicit same-direction relations should not be forced ambiguous.
const receiptC={...common,provenance:'source-C-independent',material:'A second bounded report independently reproduced the same failure mode under the same scoped condition.',relation:'This evidence supports narrowing the universal reliability claim because the scoped failure is reproduced.'};
const control=applyGuardedHandoffResults(base,[receiptA,receiptC],V);
const controlBranch=control.unresolved.find(x=>x.targetRef===branch?.targetRef&&x.clauseRef===branch?.clauseRef&&x.lens===branch?.lens);
if(controlBranch?.status==='AMBIGUOUS_BY_RECEIPTS')failures.push({type:'SAME_DIRECTION_CONTROL_FALSE_POSITIVE'});

const result={
  schema:'nostromo-vajra-ambiguity-test/v0.1',
  completedAt:new Date().toISOString(),
  status:failures.length?'FAIL':'PASS',
  finding:{
    baselineStatus:rawBranch?.status||null,
    guardedStatus:guardedBranch?.status||null,
    ambiguityDetected:audit.ambiguous.length,
    controlStatus:controlBranch?.status||null,
    interpretation:'The base receipt matcher can close on the first qualifying receipt when another qualifying return has an unspecified relation. The ambiguity guard preserves that branch as open instead of letting receipt order create false certainty.'
  },
  failures,
  boundary:'This test demonstrates a deterministic structural/lexical false-certainty guard. UNSPECIFIED means the bounded polarity detector cannot classify the relation; it does not prove semantic disagreement, source independence, truth, or evidence quality.'
};
await fs.writeFile(resultPath,JSON.stringify(result,null,2)+'\n','utf8');
console.log(JSON.stringify(result,null,2));
if(failures.length)process.exit(1);
