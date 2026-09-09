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
check(contested.dynamicReinspection?.version==='0.8','DYNAMIC_REINSPECTION_VERSION_NOT_UPDATED',contested.dynamicReinspection);
check(contested.nextInspection?.trigger==='CONTESTED_RETURN','WRONG_TRIGGER',contested.nextInspection);
check(contested.nextInspection?.lens==='source_quality'&&contested.nextInspection?.preferredOrgan==='DROPLET','CONFLICT_DID_NOT_CHANGE_BEHAVIOR',contested.nextInspection);
check(contested.nextInspection?.targetRef===branch.targetRef&&contested.nextInspection?.clauseRef===branch.clauseRef,'TARGET_SCOPE_LOST',contested.nextInspection);

const sourceBranch={status:'CONTESTED_BY_RECEIPTS',targetRef:'t-source-quality',clauseRef:'c-source-quality',lens:'source_quality',evidenceKeys:['receipt-A','receipt-B']};
const repeatedSourceContest=V.selectNextInspection({unresolved:[sourceBranch]});
check(repeatedSourceContest?.trigger==='REPEATED_SOURCE_CONTEST','REPEATED_CONTEST_NOT_DETECTED',repeatedSourceContest);
check(repeatedSourceContest?.preferredOrgan==='GUT'&&repeatedSourceContest?.lens==='metabolic_contamination','REPEATED_CONTEST_NOT_DIVERTED_TO_GUT',repeatedSourceContest);
check(repeatedSourceContest?.targetRef==='t-source-quality'&&repeatedSourceContest?.clauseRef==='c-source-quality','REPEATED_CONTEST_SCOPE_LOST',repeatedSourceContest);
check(repeatedSourceContest?.preferredOrgan!=='DROPLET','METABOLIC_ECHO_NOT_BROKEN',repeatedSourceContest);

const metabolicBranch={status:'CONTESTED_BY_RECEIPTS',targetRef:'t-metabolic',clauseRef:'c-metabolic',lens:'metabolic_contamination',evidenceKeys:['receipt-A','receipt-B','gut-triage-A','gut-triage-B'],evidenceFingerprints:['fp-A','fp-B','fp-gut-A','fp-gut-B'],evidenceProvenances:['src-A','src-B','gut-src-A','gut-src-B']};
const repeatedMetabolicContest=V.selectNextInspection({unresolved:[metabolicBranch]});
check(repeatedMetabolicContest?.trigger==='REPEATED_METABOLIC_CONTEST','METABOLIC_REPEAT_NOT_DETECTED',repeatedMetabolicContest);
check(repeatedMetabolicContest?.status==='HOLD'&&repeatedMetabolicContest?.lens==='quarantine_review','METABOLIC_REPEAT_NOT_QUARANTINED',repeatedMetabolicContest);
check(repeatedMetabolicContest?.preferredOrgan===null,'METABOLIC_REPEAT_STILL_ROUTED',repeatedMetabolicContest);
check(repeatedMetabolicContest?.targetRef==='t-metabolic'&&repeatedMetabolicContest?.clauseRef==='c-metabolic','METABOLIC_REPEAT_SCOPE_LOST',repeatedMetabolicContest);
check(/Preserve every contest evidence key/.test(repeatedMetabolicContest?.provenancePolicy||''),'QUARANTINE_PROVENANCE_POLICY_MISSING',repeatedMetabolicContest);

const quarantinedBaseline={...metabolicBranch,quarantineBaselineEvidenceKeys:[...metabolicBranch.evidenceKeys],quarantineBaselineFingerprints:[...metabolicBranch.evidenceFingerprints],quarantineBaselineProvenances:[...metabolicBranch.evidenceProvenances]};
const novelPostQuarantine={...quarantinedBaseline,evidenceKeys:[...quarantinedBaseline.evidenceKeys,'receipt-C'],evidenceFingerprints:[...quarantinedBaseline.evidenceFingerprints,'fp-C'],evidenceProvenances:[...quarantinedBaseline.evidenceProvenances,'src-C']};
const reactivated=V.selectNextInspection({unresolved:[novelPostQuarantine]});
check(reactivated?.trigger==='NOVEL_POST_QUARANTINE_EVIDENCE','GENUINE_NOVELTY_DID_NOT_REACTIVATE',reactivated);
check(reactivated?.status==='OPEN'&&reactivated?.preferredOrgan==='DROPLET'&&reactivated?.lens==='source_quality','REACTIVATION_WRONG_ROUTE',reactivated);
check(reactivated?.targetRef==='t-metabolic'&&reactivated?.clauseRef==='c-metabolic','REACTIVATION_SCOPE_LOST',reactivated);
check(reactivated?.novelty?.novelEvidenceKeys?.includes('receipt-C')&&reactivated?.novelty?.novelEvidenceFingerprints?.includes('fp-C')&&reactivated?.novelty?.novelEvidenceProvenances?.includes('src-C'),'REACTIVATION_NOVELTY_AUDIT_MISSING',reactivated);
check(reactivated?.novelty?.novelEvidenceTuples?.some(p=>p.key==='receipt-C'&&p.fingerprint==='fp-C'&&p.provenance==='src-C'),'REACTIVATION_TUPLE_AUDIT_MISSING',reactivated);

const keyAliasReplay={...quarantinedBaseline,evidenceKeys:[...quarantinedBaseline.evidenceKeys,'receipt-alias'],evidenceFingerprints:[...quarantinedBaseline.evidenceFingerprints],evidenceProvenances:[...quarantinedBaseline.evidenceProvenances]};
const keyAliasResult=V.selectNextInspection({unresolved:[keyAliasReplay]});
check(keyAliasResult?.trigger==='REPEATED_METABOLIC_CONTEST'&&keyAliasResult?.status==='HOLD','KEY_ONLY_ALIAS_FALSE_REACTIVATION',keyAliasResult);
const fingerprintOnlyDrift={...quarantinedBaseline,evidenceKeys:[...quarantinedBaseline.evidenceKeys],evidenceFingerprints:[...quarantinedBaseline.evidenceFingerprints,'fp-drift'],evidenceProvenances:[...quarantinedBaseline.evidenceProvenances]};
const fingerprintOnlyResult=V.selectNextInspection({unresolved:[fingerprintOnlyDrift]});
check(fingerprintOnlyResult?.trigger==='REPEATED_METABOLIC_CONTEST'&&fingerprintOnlyResult?.status==='HOLD','FINGERPRINT_ONLY_FALSE_REACTIVATION',fingerprintOnlyResult);
const splitNoveltyLaundering={...quarantinedBaseline,evidenceKeys:[...quarantinedBaseline.evidenceKeys,'receipt-C','receipt-A'],evidenceFingerprints:[...quarantinedBaseline.evidenceFingerprints,'fp-A','fp-C'],evidenceProvenances:[...quarantinedBaseline.evidenceProvenances,'src-C','src-A']};
const splitNoveltyResult=V.selectNextInspection({unresolved:[splitNoveltyLaundering]});
check(splitNoveltyResult?.trigger==='REPEATED_METABOLIC_CONTEST'&&splitNoveltyResult?.status==='HOLD','SPLIT_NOVELTY_FALSE_REACTIVATION',splitNoveltyResult);
check(V.quarantineNovelty(splitNoveltyLaundering)?.qualifies===false,'SPLIT_NOVELTY_PROBE_FALSE_POSITIVE',V.quarantineNovelty(splitNoveltyLaundering));
const borrowedProvenance={...quarantinedBaseline,evidenceKeys:[...quarantinedBaseline.evidenceKeys,'receipt-C'],evidenceFingerprints:[...quarantinedBaseline.evidenceFingerprints,'fp-C'],evidenceProvenances:[...quarantinedBaseline.evidenceProvenances,'src-A']};
const borrowedProvenanceResult=V.selectNextInspection({unresolved:[borrowedProvenance]});
check(borrowedProvenanceResult?.trigger==='REPEATED_METABOLIC_CONTEST'&&borrowedProvenanceResult?.status==='HOLD','BORROWED_PROVENANCE_FALSE_REACTIVATION',borrowedProvenanceResult);
const misalignedPairing={...quarantinedBaseline,evidenceKeys:[...quarantinedBaseline.evidenceKeys,'receipt-C'],evidenceFingerprints:[...quarantinedBaseline.evidenceFingerprints,'fp-C','fp-extra'],evidenceProvenances:[...quarantinedBaseline.evidenceProvenances,'src-C']};
const misalignedResult=V.selectNextInspection({unresolved:[misalignedPairing]});
check(misalignedResult?.trigger==='REPEATED_METABOLIC_CONTEST'&&misalignedResult?.status==='HOLD','MISALIGNED_PAIRING_FALSE_REACTIVATION',misalignedResult);
check(V.quarantineNovelty(misalignedPairing)?.tuplePairingValid===false,'MISALIGNED_PAIRING_NOT_AUDITED',V.quarantineNovelty(misalignedPairing));
const missingBaseline={...metabolicBranch,evidenceKeys:[...metabolicBranch.evidenceKeys,'receipt-C'],evidenceFingerprints:[...metabolicBranch.evidenceFingerprints,'fp-C'],evidenceProvenances:[...metabolicBranch.evidenceProvenances,'src-C']};
const missingBaselineResult=V.selectNextInspection({unresolved:[missingBaseline]});
check(missingBaselineResult?.trigger==='REPEATED_METABOLIC_CONTEST'&&missingBaselineResult?.status==='HOLD','MISSING_BASELINE_FALSE_REACTIVATION',missingBaselineResult);

const noveltyProbe=V.quarantineNovelty(novelPostQuarantine);
check(noveltyProbe?.qualifies===true&&noveltyProbe?.tuplePairingValid===true&&noveltyProbe?.novelTuples?.length===1,'NOVELTY_PROBE_CONTRACT_BROKEN',noveltyProbe);
check(V.quarantineNovelty(keyAliasReplay)?.qualifies===false,'REPLAY_ALIAS_QUALIFIED_AS_NOVEL',V.quarantineNovelty(keyAliasReplay));
check(V.quarantineNovelty(borrowedProvenance)?.qualifies===false,'BORROWED_PROVENANCE_QUALIFIED_AS_NOVEL',V.quarantineNovelty(borrowedProvenance));

const genericBranch={status:'CONTESTED_BY_RECEIPTS',targetRef:'t-generic',clauseRef:'c-generic',lens:'evidence',evidenceKeys:['g-A','g-B']};
for(const unresolved of [
  [genericBranch,sourceBranch,metabolicBranch],
  [sourceBranch,metabolicBranch,genericBranch],
  [metabolicBranch,genericBranch,sourceBranch]
]){
  const selected=V.selectNextInspection({unresolved});
  check(selected?.trigger==='REPEATED_SOURCE_CONTEST','QUARANTINE_STARVED_RUNNABLE_SOURCE_CONTEST',{order:unresolved.map(x=>x.lens),selected});
  check(selected?.targetRef==='t-source-quality'&&selected?.preferredOrgan==='GUT','RUNNABLE_SOURCE_CONTEST_MISROUTED',{order:unresolved.map(x=>x.lens),selected});
}
for(const unresolved of [[metabolicBranch,genericBranch],[genericBranch,metabolicBranch]]){
  const selected=V.selectNextInspection({unresolved});
  check(selected?.trigger==='CONTESTED_RETURN','QUARANTINE_STARVED_GENERIC_CONTEST',{order:unresolved.map(x=>x.lens),selected});
  check(selected?.targetRef==='t-generic'&&selected?.preferredOrgan==='DROPLET','GENERIC_CONTEST_MISROUTED',{order:unresolved.map(x=>x.lens),selected});
}
const sourceOverGeneric=V.selectNextInspection({unresolved:[genericBranch,sourceBranch]});
check(sourceOverGeneric?.trigger==='REPEATED_SOURCE_CONTEST'&&sourceOverGeneric?.preferredOrgan==='GUT','SOURCE_CONTEST_PRIORITY_INVERTED',sourceOverGeneric);
const genericSameSeverityA={...genericBranch,targetRef:'t-generic-A',clauseRef:'c-generic-A'};
const genericSameSeverityB={...genericBranch,targetRef:'t-generic-B',clauseRef:'c-generic-B'};
const stableTie=V.selectNextInspection({unresolved:[genericSameSeverityB,genericSameSeverityA]});
check(stableTie?.targetRef==='t-generic-B','EQUAL_SEVERITY_ORDER_NOT_STABLE',stableTie);

const wrappedMixed=V.applyHandoffResults(base,[mk('supports the target claim','src-C')]);
check(Array.isArray(wrappedMixed.dynamicReinspection?.quarantineDeferred),'QUARANTINE_AUDIT_CHANNEL_MISSING',wrappedMixed.dynamicReinspection);
const single=V.applyHandoffResults(base,[mk('supports the target claim','src-D')]);
check(single.dynamicReinspection?.triggered===false,'SINGLE_RETURN_FALSE_ESCALATION',single.dynamicReinspection);
check(single.nextInspection?.trigger!=='CONTESTED_RETURN','SINGLE_RETURN_WRONG_TRIGGER',single.nextInspection);
const rejected=V.applyHandoffResults(base,[mk('supports the target claim','', {provenance:''})]);
check(rejected.dynamicReinspection?.triggered===false,'REJECTED_RECEIPT_FALSE_ESCALATION',rejected.dynamicReinspection);
check((rejected.handoffResolution?.rejected||0)>=1,'REJECTED_RECEIPT_NOT_AUDITED',rejected.handoffResolution);

const result={schema:'nostromo-vajra-dynamic-reinspection/v0.8',completedAt:new Date().toISOString(),status:failures.length?'FAIL':'PASS',capability:'PROVENANCE_BOUND_TUPLE_GATED_QUARANTINE_REACTIVATION',tests:{contestedStatus:contested.status,nextInspection:contested.nextInspection,repeatedSourceContest,repeatedMetabolicContest,reactivated,keyAliasResult,fingerprintOnlyResult,splitNoveltyResult,borrowedProvenanceResult,misalignedResult,missingBaselineResult,noveltyProbe,sourceOverGeneric,stableTie,singleTriggered:single.dynamicReinspection?.triggered,rejectedTriggered:rejected.dynamicReinspection?.triggered,rejectedCount:rejected.handoffResolution?.rejected},provenance:{fixture:'synthetic de-identified branch/receipt fixtures',failureEvidence:'nostromo/failure-log/2026-09-10-vajra-quarantine-provenance-tuple-laundering.json'},failures,boundary:'PASS proves only that an explicitly baselined quarantined metabolic-contamination branch can become runnable again when one aligned evidence item has a new evidence identity, new content fingerprint, and new provenance identity bound to the same item. Split novelty, borrowed baseline provenance, missing provenance, missing baselines, and tuple misalignment remain HOLD. Reactivation is clause-scoped and returns only to DROPLET source-quality inspection while preserving prior quarantine/provenance. Existing non-starvation, first-conflict DROPLET routing, repeated-source GUT diversion, rejected-receipt containment, and echo breaking remain bounded. It does not decide source truth, infer semantic novelty, execute follow-up organs, install capabilities, clear historical quarantine evidence, or mutate persistent body state.'};
await fs.writeFile('nostromo/vajra/dynamic-reinspection-last-result.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));if(failures.length)process.exitCode=1;
