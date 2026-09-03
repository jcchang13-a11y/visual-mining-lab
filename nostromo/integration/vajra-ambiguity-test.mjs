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

const crossOrganSameDirection={...receiptA,organ:'MU/TH/UR',provenance:'muther-source-C',material:'A repository mining result independently reproduces the scoped failure.',relation:'This evidence supports narrowing the universal reliability claim because the same scoped failure is reproduced.'};
const crossOrganControl=applyGuardedHandoffResults(base,[crossOrganA,crossOrganSameDirection],V);
const crossOrganControlBranch=crossOrganControl.unresolved.find(x=>x.targetRef===branch?.targetRef&&x.clauseRef===branch?.clauseRef&&x.lens===branch?.lens);
if(crossOrganControlBranch?.status==='AMBIGUOUS_BY_RECEIPTS')failures.push({type:'CROSS_ORGAN_DIVERSITY_FALSE_POSITIVE'});

const receiptC={...common,provenance:'source-C-independent',material:'A second bounded report independently reproduced the same failure mode under the same scoped condition.',relation:'This evidence supports narrowing the universal reliability claim because the scoped failure is reproduced.'};
const control=applyGuardedHandoffResults(base,[receiptA,receiptC],V);
const controlBranch=control.unresolved.find(x=>x.targetRef===branch?.targetRef&&x.clauseRef===branch?.clauseRef&&x.lens===branch?.lens);
if(controlBranch?.status==='AMBIGUOUS_BY_RECEIPTS')failures.push({type:'SAME_DIRECTION_CONTROL_FALSE_POSITIVE'});

const negatedSupport={...common,provenance:'source-neg-support',material:'A bounded return reports the tested observation without endorsing the target claim.',relation:'This evidence does not support the target claim under the tested condition.'};
const negatedSupportAudit=auditReceiptAmbiguity([receiptA,negatedSupport]);
const negatedSupportFinding=negatedSupportAudit.ambiguous?.[0]||null;
const negatedSupportPolarity=negatedSupportFinding?.receipts?.find(x=>x.provenance==='source-neg-support')?.polarity||null;
if(negatedSupportAudit.status!=='AMBIGUITY_FOUND')failures.push({type:'NEGATED_SUPPORT_FALSE_POLARITY',audit:negatedSupportAudit});
if(negatedSupportPolarity!=='UNSPECIFIED')failures.push({type:'NEGATED_SUPPORT_NOT_UNSPECIFIED',actual:negatedSupportPolarity});

const explicitRefute={...common,provenance:'source-explicit-refute',material:'A bounded adversarial run directly contradicts the universal reliability claim within the tested scope.',relation:'This evidence refutes the universal reliability claim within the tested scope.'};
const negatedRefute={...common,provenance:'source-neg-refute',material:'A separate bounded return does not establish whether the target claim fails.',relation:'This evidence does not refute the target claim under the tested condition.'};
const negatedRefuteAudit=auditReceiptAmbiguity([explicitRefute,negatedRefute]);
const negatedRefuteFinding=negatedRefuteAudit.ambiguous?.[0]||null;
const negatedRefutePolarity=negatedRefuteFinding?.receipts?.find(x=>x.provenance==='source-neg-refute')?.polarity||null;
if(negatedRefuteAudit.status!=='AMBIGUITY_FOUND')failures.push({type:'NEGATED_REFUTE_FALSE_POLARITY',audit:negatedRefuteAudit});
if(negatedRefutePolarity!=='UNSPECIFIED')failures.push({type:'NEGATED_REFUTE_NOT_UNSPECIFIED',actual:negatedRefutePolarity});

const chineseNegatedSupport={...common,provenance:'source-zh-neg-support',material:'這份材料只描述測試結果，沒有建立目標命題。',relation:'這份證據並未支持目標命題。'};
const chineseNegatedSupportAudit=auditReceiptAmbiguity([receiptA,chineseNegatedSupport]);
const chineseNegatedSupportPolarity=chineseNegatedSupportAudit.ambiguous?.[0]?.receipts?.find(x=>x.provenance==='source-zh-neg-support')?.polarity||null;
if(chineseNegatedSupportAudit.status!=='AMBIGUITY_FOUND')failures.push({type:'ZH_NEGATED_SUPPORT_FALSE_POLARITY',audit:chineseNegatedSupportAudit});
if(chineseNegatedSupportPolarity!=='UNSPECIFIED')failures.push({type:'ZH_NEGATED_SUPPORT_NOT_UNSPECIFIED',actual:chineseNegatedSupportPolarity});

// Insufficiency adversarial cases: evidence that is explicitly insufficient to
// support/refute a target must remain UNSPECIFIED rather than becoming directional.
const insufficientSupport={...common,provenance:'source-insufficient-support',material:'The bounded run is informative but too narrow to settle the target branch.',relation:'This is insufficient evidence to support the target claim.'};
const insufficientSupportAudit=auditReceiptAmbiguity([receiptA,insufficientSupport]);
const insufficientSupportPolarity=insufficientSupportAudit.ambiguous?.[0]?.receipts?.find(x=>x.provenance==='source-insufficient-support')?.polarity||null;
if(insufficientSupportAudit.status!=='AMBIGUITY_FOUND')failures.push({type:'INSUFFICIENT_SUPPORT_FALSE_POLARITY',audit:insufficientSupportAudit});
if(insufficientSupportPolarity!=='UNSPECIFIED')failures.push({type:'INSUFFICIENT_SUPPORT_NOT_UNSPECIFIED',actual:insufficientSupportPolarity});

const insufficientRefute={...common,provenance:'source-insufficient-refute',material:'The bounded return does not cover the decisive failure condition.',relation:'This is inadequate evidence to refute the target claim.'};
const insufficientRefuteAudit=auditReceiptAmbiguity([explicitRefute,insufficientRefute]);
const insufficientRefutePolarity=insufficientRefuteAudit.ambiguous?.[0]?.receipts?.find(x=>x.provenance==='source-insufficient-refute')?.polarity||null;
if(insufficientRefuteAudit.status!=='AMBIGUITY_FOUND')failures.push({type:'INSUFFICIENT_REFUTE_FALSE_POLARITY',audit:insufficientRefuteAudit});
if(insufficientRefutePolarity!=='UNSPECIFIED')failures.push({type:'INSUFFICIENT_REFUTE_NOT_UNSPECIFIED',actual:insufficientRefutePolarity});

const chineseInsufficientSupport={...common,provenance:'source-zh-insufficient-support',material:'這份材料仍有資訊價值，但範圍不足。',relation:'這份證據不足以支持目標命題。'};
const chineseInsufficientSupportAudit=auditReceiptAmbiguity([receiptA,chineseInsufficientSupport]);
const chineseInsufficientSupportPolarity=chineseInsufficientSupportAudit.ambiguous?.[0]?.receipts?.find(x=>x.provenance==='source-zh-insufficient-support')?.polarity||null;
if(chineseInsufficientSupportAudit.status!=='AMBIGUITY_FOUND')failures.push({type:'ZH_INSUFFICIENT_SUPPORT_FALSE_POLARITY',audit:chineseInsufficientSupportAudit});
if(chineseInsufficientSupportPolarity!=='UNSPECIFIED')failures.push({type:'ZH_INSUFFICIENT_SUPPORT_NOT_UNSPECIFIED',actual:chineseInsufficientSupportPolarity});

const chineseInsufficientRefute={...common,provenance:'source-zh-insufficient-refute',material:'這份材料沒有覆蓋足以否定命題的條件。',relation:'現有證據尚不足以反駁目標命題。'};
const chineseInsufficientRefuteAudit=auditReceiptAmbiguity([explicitRefute,chineseInsufficientRefute]);
const chineseInsufficientRefutePolarity=chineseInsufficientRefuteAudit.ambiguous?.[0]?.receipts?.find(x=>x.provenance==='source-zh-insufficient-refute')?.polarity||null;
if(chineseInsufficientRefuteAudit.status!=='AMBIGUITY_FOUND')failures.push({type:'ZH_INSUFFICIENT_REFUTE_FALSE_POLARITY',audit:chineseInsufficientRefuteAudit});
if(chineseInsufficientRefutePolarity!=='UNSPECIFIED')failures.push({type:'ZH_INSUFFICIENT_REFUTE_NOT_UNSPECIFIED',actual:chineseInsufficientRefutePolarity});

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
  schema:'nostromo-vajra-ambiguity-test/v0.4.2',
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
    negatedSupportStatus:negatedSupportAudit.status,
    negatedSupportPolarity,
    negatedRefuteStatus:negatedRefuteAudit.status,
    negatedRefutePolarity,
    chineseNegatedSupportStatus:chineseNegatedSupportAudit.status,
    chineseNegatedSupportPolarity,
    insufficientSupportStatus:insufficientSupportAudit.status,
    insufficientSupportPolarity,
    insufficientRefuteStatus:insufficientRefuteAudit.status,
    insufficientRefutePolarity,
    chineseInsufficientSupportStatus:chineseInsufficientSupportAudit.status,
    chineseInsufficientSupportPolarity,
    chineseInsufficientRefuteStatus:chineseInsufficientRefuteAudit.status,
    chineseInsufficientRefutePolarity,
    poisonAuditStatus:poisonAudit.status,
    poisonRejected:poisonAudit.rejectedReceiptCount,
    poisonBranchStatus:poisonBranch?.status||null,
    interpretation:'The guard preserves branch-scoped ambiguity across organ boundaries, excludes malformed returns, and masks bounded English/Chinese negated or explicitly insufficient support/refute phrases before polarity detection so lexical keywords cannot manufacture false directional evidence.'
  },
  failures,
  boundary:'This test demonstrates a deterministic structural/lexical false-certainty and ambiguity-poisoning guard, including cross-organ branch-scoped returns plus bounded negation and insufficiency handling. UNSPECIFIED means the bounded polarity detector cannot safely classify the relation; qualification means only that minimum execution/provenance/material/relation fields exist. Distinct organ/provenance counts are audit metadata, not proof of source independence. Masking is intentionally narrow and does not amount to general semantic negation or modality scope resolution, truth judgment or evidence-quality scoring.'
};
await fs.writeFile(resultPath,JSON.stringify(result,null,2)+'\n','utf8');
console.log(JSON.stringify(result,null,2));
if(failures.length)process.exit(1);
