import fs from 'node:fs/promises';
import vm from 'node:vm';
const load=async p=>vm.runInThisContext(await fs.readFile(p,'utf8'),{filename:p});
await load('nostromo/vajra/vajra-engine.js');
await load('nostromo/vajra/dynamic-reinspection.js');
const V=globalThis.VajraEngine;
const failures=[];const check=(ok,type,detail)=>{if(!ok)failures.push({type,detail});};
const base=V.run('研究資料顯示所有這類系統一定可靠。',6);
const branch=base.unresolved.find(b=>b.lens==='evidence')||base.unresolved[0];
const mk=(relation,provenance,overrides={})=>({targetRef:branch.targetRef,clauseRef:branch.clauseRef,lens:branch.lens,organ:branch.handoff.preferredOrgan,status:'COMPLETED',provenance,material:`Independent returned material ${provenance} with enough substance for structural qualification.`,relation,...overrides});
const contested=V.applyHandoffResults(base,[mk('supports the target claim','src-A'),mk('refutes the target claim','src-B')]);
check(contested.status.includes('CONTESTED'),'CONFLICT_NOT_PRESERVED',contested.status);
check(contested.dynamicReinspection?.triggered===true,'DYNAMIC_REINSPECTION_NOT_TRIGGERED',contested.dynamicReinspection);
check(contested.nextInspection?.trigger==='CONTESTED_RETURN','WRONG_TRIGGER',contested.nextInspection);
check(contested.nextInspection?.lens==='source_quality'&&contested.nextInspection?.preferredOrgan==='DROPLET','CONFLICT_DID_NOT_CHANGE_BEHAVIOR',contested.nextInspection);
check(contested.nextInspection?.targetRef===branch.targetRef&&contested.nextInspection?.clauseRef===branch.clauseRef,'TARGET_SCOPE_LOST',contested.nextInspection);

// Adversarial echo test 1: once a contested branch is already in source-quality inspection,
// VAJRA must not recursively send the same conflict back to DROPLET again.
const repeatedSourceContest=V.selectNextInspection({unresolved:[{
  status:'CONTESTED_BY_RECEIPTS',
  targetRef:'t-source-quality',
  clauseRef:'c-source-quality',
  lens:'source_quality',
  evidenceKeys:['receipt-A','receipt-B']
}]});
check(repeatedSourceContest?.trigger==='REPEATED_SOURCE_CONTEST','REPEATED_CONTEST_NOT_DETECTED',repeatedSourceContest);
check(repeatedSourceContest?.preferredOrgan==='GUT','REPEATED_CONTEST_NOT_DIVERTED_TO_GUT',repeatedSourceContest);
check(repeatedSourceContest?.lens==='metabolic_contamination','REPEATED_CONTEST_WRONG_LENS',repeatedSourceContest);
check(repeatedSourceContest?.targetRef==='t-source-quality'&&repeatedSourceContest?.clauseRef==='c-source-quality','REPEATED_CONTEST_SCOPE_LOST',repeatedSourceContest);
check(repeatedSourceContest?.preferredOrgan!=='DROPLET','METABOLIC_ECHO_NOT_BROKEN',repeatedSourceContest);

// Adversarial echo test 2: if GUT contamination triage also returns a qualifying contest,
// VAJRA must not bounce the same branch back to DROPLET or GUT. It enters HOLD/quarantine.
const repeatedMetabolicContest=V.selectNextInspection({unresolved:[{
  status:'CONTESTED_BY_RECEIPTS',
  targetRef:'t-metabolic',
  clauseRef:'c-metabolic',
  lens:'metabolic_contamination',
  evidenceKeys:['receipt-A','receipt-B','gut-triage-A','gut-triage-B']
}]});
check(repeatedMetabolicContest?.trigger==='REPEATED_METABOLIC_CONTEST','METABOLIC_REPEAT_NOT_DETECTED',repeatedMetabolicContest);
check(repeatedMetabolicContest?.status==='HOLD','METABOLIC_REPEAT_NOT_HELD',repeatedMetabolicContest);
check(repeatedMetabolicContest?.lens==='quarantine_review','METABOLIC_REPEAT_WRONG_LENS',repeatedMetabolicContest);
check(repeatedMetabolicContest?.preferredOrgan===null,'METABOLIC_REPEAT_STILL_ROUTED',repeatedMetabolicContest);
check(repeatedMetabolicContest?.targetRef==='t-metabolic'&&repeatedMetabolicContest?.clauseRef==='c-metabolic','METABOLIC_REPEAT_SCOPE_LOST',repeatedMetabolicContest);
check(!['DROPLET','GUT'].includes(repeatedMetabolicContest?.preferredOrgan),'TWO_ORGAN_ECHO_NOT_BROKEN',repeatedMetabolicContest);
check(/Preserve every contest evidence key/.test(repeatedMetabolicContest?.provenancePolicy||''),'QUARANTINE_PROVENANCE_POLICY_MISSING',repeatedMetabolicContest);

const single=V.applyHandoffResults(base,[mk('supports the target claim','src-C')]);
check(single.dynamicReinspection?.triggered===false,'SINGLE_RETURN_FALSE_ESCALATION',single.dynamicReinspection);
check(single.nextInspection?.trigger!=='CONTESTED_RETURN','SINGLE_RETURN_WRONG_TRIGGER',single.nextInspection);
const rejected=V.applyHandoffResults(base,[mk('supports the target claim','', {provenance:''})]);
check(rejected.dynamicReinspection?.triggered===false,'REJECTED_RECEIPT_FALSE_ESCALATION',rejected.dynamicReinspection);
check((rejected.handoffResolution?.rejected||0)>=1,'REJECTED_RECEIPT_NOT_AUDITED',rejected.handoffResolution);
const result={schema:'nostromo-vajra-dynamic-reinspection/v0.3',completedAt:new Date().toISOString(),status:failures.length?'FAIL':'PASS',tests:{contestedStatus:contested.status,nextInspection:contested.nextInspection,repeatedSourceContest,repeatedMetabolicContest,singleTriggered:single.dynamicReinspection?.triggered,rejectedTriggered:rejected.dynamicReinspection?.triggered,rejectedCount:rejected.handoffResolution?.rejected},failures,boundary:'PASS proves a structurally qualifying cross-organ receipt conflict changes VAJRA next-step priority to clause-scoped source-quality inspection; a conflict already at source_quality diverts to GUT metabolic-contamination triage; and a conflict still unresolved at metabolic_contamination enters a provenance-preserving HOLD/quarantine rather than echoing between DROPLET and GUT. A lone qualifying receipt or rejected receipt does not trigger escalation. It does not prove semantic correctness, source truth, source independence, contamination, or that DROPLET/GUT actually executed the follow-up.'};
await fs.writeFile('nostromo/vajra/dynamic-reinspection-last-result.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));if(failures.length)process.exitCode=1;
