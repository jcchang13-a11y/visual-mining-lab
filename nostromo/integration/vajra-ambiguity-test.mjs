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
if(audit.qualifyingReceiptCount!==2)failures.push({type:'QUALIFYING_COUNT_WRONG',actual:audit.qualifyingReceiptCount});

// Cross-organ adversarial case: the same VAJRA branch must remain ambiguous when
// one qualifying return comes from DROPLET and another from MU/TH/UR. Organ labels
// are provenance metadata, not separate closure domains.
const crossOrganA={...receiptA,organ:'DROPLET',provenance:'droplet-source-A'};
const crossOrganB={...receiptB,organ:'MU/TH/UR',provenance:'muther-source-B'};
const crossOrganAudit=auditReceiptAmbiguity([crossOrganA,crossOrganB]);
const crossOrganGuarded=applyGuardedHandoffResults(base,[crossOrganA,crossOrganB],V);
const crossOrganBranch=crossOrganGuarded.unresolved.find(x=>x.targetRef===branch?.targetRef&&x.clauseRef===branch?.clauseRef&&x.lens===branch?.lens);
const crossOrganFinding=crossOrganAudit.ambiguous?.[0]||null;
if(crossOrganAudit.status!=='AMBIGUITY_FOUND')failures.push({type:'CROSS_ORGAN_AMBIGUITY_NOT_DETECTED',audit:crossOrganAudit});
if(crossOrganBranch?.status!=='AMBIGUOUS_BY_RECEIPTS')failures.push({type:'CROSS_ORGAN_FALSE_CLOSURE_NOT_BLOCKED',actual:crossOrganBranch?.status});
if(crossOrganFinding?.distinctOrganCount!==2)failures.push({type:'CROSS_ORGAN_COUNT_WRONG',actual:crossOrganFinding?.distinctOrganCount});
if(!Array.isArray(crossOrganFinding?.organs)||!crossOrganFinding.organs.includes('DROPLET')||!crossOrganFinding.organs.includes('MU/TH/UR'))failures.push({type:'CROSS_ORGAN_AUDIT_METADATA_MISSING',organs:crossOrganFinding?.organs});

// Cross-organ same-direction control: organ diversity alone must not manufacture ambiguity.
const crossOrganSameDirection={...receiptA,organ:'MU/TH/UR',provenance:'muther-source-C',material:'A repository mining result independently reproduces the scoped failure.',relation:'This evidence supports narrowing the universal reliability claim because the same scoped failure is reproduced.'};
const crossOrganControl=applyGuardedHandoffResults(base,[crossOrganA,crossOrganSameDirection],V);
const crossOrganControlBranch=crossOrganControl.unresolved.find(x=>x.targetRef===branch?.targetRef&&x.clauseRef===branch?.clauseRef&&x.lens===branch?.lens);
if(crossOrganControlBranch?.status==='AMBIGUOUS_BY_RECEIPTS')failures.push({type:'CROSS_ORGAN_DIVERSITY_FALSE_POSITIVE'});

// Control: two explicit same-direction relations should not be forced ambiguous.
const receiptC={...common,provenance:'source-C-independent',material:'A second bounded report independently reproduced the same failure mode under the same scoped condition.',relation:'This evidence supports narrowing the universal reliability claim because the scoped failure is reproduced.'};
const control=applyGuardedHandoffResults(base,[receiptA,receiptC],V);
const controlBranch=control.unresolved.find(x=>x.targetRef===branch?.targetRef&&x.clauseRef===branch?.clauseRef&&x.lens===branch?.lens);
if(controlBranch?.status==='AMBIGUOUS_BY_RECEIPTS')failures.push({type:'SAME_DIRECTION_CONTROL_FALSE_POSITIVE'});

// Poison control: malformed/non-executed returns must not manufacture ambiguity.
const poisonMissingProvenance={...common,provenance:'',material:'A vague additional return that would otherwise look unrelated to the first receipt.',relation:'Its relation to the target is not determined.'};
const poisonNotExecuted={...common,status:'QUEUED',provenance:'source-poison-queued',material:'Queued material that has not actually been returned by the requested organ.',relation:'Its relation to the target is not determined.'};
const poisonMissingRelation={...common,provenance:'source-poison-no-relation',material:'Returned material with no explicit statement connecting it to the target claim.',relation:''};
const poisonAudit=auditReceiptAmbiguity([receiptA,poisonMissingProvenance,poisonNotExecuted,poisonMissingRelation]);
const poisonGuarded=applyGuardedHandoffResults(base,[receiptA,poisonMissingProvenance,poisonNotExecuted,poisonMissingRelation],V);
const poisonBranch=poisonGuarded.unresolved.find(x=>x.targetRef===branch?.targetRef&&x.clauseRef===branch?.clauseRef&&x.lens===branch?.lens);
if(poisonAudit.status!=='NO_AMBIGUITY_FOUND')failures.push({type:'MALFORMED_RECEIPT_CREATED_AMBIGUITY',audit:poisonAudit});
if(poisonAudit.qualifyingReceiptCount!==1)failures.push({type:'POISON_QUALIFYING_COUNT_WRONG',actual:poisonAudit.qualifyingReceiptCount});
if(poisonAudit.rejectedReceiptCount!==3)failures.push({type:'POISON_REJECTION_COUNT_WRONG',actual:poisonAudit.rejectedReceiptCount});
if(poisonBranch?.status==='AMBIGUOUS_BY_RECEIPTS')failures.push({type:'POISON_CHANGED_BRANCH_TO_AMBIGUOUS'});

const rejectionReasons=[...new Set((poisonAudit.rejectedReceipts||[]).flatMap(x=>x.reasons||[]))];
for(const expected of ['MISSING_PROVENANCE','NO_EXECUTION_EVIDENCE','MISSING_RELATION_TO_TARGET']){
  if(!rejectionReasons.includes(expected))failures.push({type:'EXPECTED_POISON_REASON_MISSING',expected,rejectionReasons});
}

const result={
  schema:'nostromo-vajra-ambiguity-test/v0.3',
  completedAt:new Date().toISOString(),
  status:failures.length?'FAIL':'PASS',
  finding:{
    baselineStatus:rawBranch?.status||null,
    guardedStatus:guardedBranch?.status||null,
    ambiguityDetected:audit.ambiguous.length,
    crossOrganStatus:crossOrganBranch?.status||null,
    crossOrganAmbiguityDetected:crossOrganAudit.ambiguous.length,
    crossOrganDistinctOrgans:crossOrganFinding?.distinctOrganCount||0,
    crossOrganControlStatus:crossOrganControlBranch?.status||null,
    controlStatus:controlBranch?.status||null,
    poisonAuditStatus:poisonAudit.status,
    poisonRejected:poisonAudit.rejectedReceiptCount,
    poisonBranchStatus:poisonBranch?.status||null,
    interpretation:'The guard preserves branch-scoped ambiguity across organ boundaries while excluding malformed, non-executed, provenance-free or relation-free returns. Different organ labels no longer partition one VAJRA branch into separate first-receipt closure domains, while organ diversity by itself does not manufacture ambiguity.'
  },
  failures,
  boundary:'This test demonstrates a deterministic structural/lexical false-certainty and ambiguity-poisoning guard, including cross-organ branch-scoped returns. UNSPECIFIED means the bounded polarity detector cannot classify the relation; qualification means only that minimum execution/provenance/material/relation fields exist. Distinct organ/provenance counts are audit metadata, not proof of source independence. It does not prove semantic disagreement, truth or evidence quality.'
};
await fs.writeFile(resultPath,JSON.stringify(result,null,2)+'\n','utf8');
console.log(JSON.stringify(result,null,2));
if(failures.length)process.exit(1);
