import fs from 'node:fs/promises';
import vm from 'node:vm';
const load=async p=>vm.runInThisContext(await fs.readFile(p,'utf8'),{filename:p});
await load('nostromo/vajra/vajra-engine.js');
await load('nostromo/vajra/provenance-independence-guard.js');
await load('nostromo/vajra/dynamic-reinspection.js');
const V=globalThis.VajraEngine;
const failures=[];const check=(ok,type,detail)=>{if(!ok)failures.push({type,detail});};
const base=V.run('研究資料顯示所有這類系統一定可靠。',6);
const branch=base.unresolved.find(b=>b.lens==='evidence')||base.unresolved[0];
const mk=(relation,provenance,material)=>({
  targetRef:branch.targetRef,
  clauseRef:branch.clauseRef,
  lens:branch.lens,
  organ:branch.handoff.preferredOrgan,
  status:'COMPLETED',
  provenance,
  material,
  relation
});

// Adversarial case: the same canonical source returns opposing claims under formatting variants.
// Before this guard, provenance+material identity could make these look like independent evidence.
const sameSourceConflict=V.applyHandoffResults(base,[
  mk('supports the target claim','SRC://Mirror-A','Returned material from mirror A says the target is supported under the tested condition.'),
  mk('refutes the target claim','src mirror a','A differently worded return from the same mirror says the target fails under the tested condition.')
]);
check(!String(sameSourceConflict.status).includes('CONTESTED'),'SAME_SOURCE_CREATED_FALSE_INTERSOURCE_CONTEST',sameSourceConflict.status);
check(sameSourceConflict.dynamicReinspection?.triggered===false,'SAME_SOURCE_TRIGGERED_DYNAMIC_ESCALATION',sameSourceConflict.nextInspection);
check((sameSourceConflict.provenanceIndependence?.sourceContradictions||[]).length===1,'SOURCE_INTERNAL_CONTRADICTION_NOT_RECORDED',sameSourceConflict.provenanceIndependence);
check((sameSourceConflict.handoffResolution?.rejected||0)>=2,'WITHHELD_RECEIPTS_NOT_AUDITED',sameSourceConflict.handoffResolution);
check((sameSourceConflict.provenanceIndependence?.sourceContradictions?.[0]?.provenanceFingerprint||'').length===8,'PROVENANCE_FINGERPRINT_MISSING',sameSourceConflict.provenanceIndependence);

// Duplicate case: one provenance may not inflate evidence by paraphrasing itself.
const sameSourceDuplicate=V.applyHandoffResults(base,[
  mk('supports the target claim','SRC-B','First substantive return supporting the target with a bounded structural statement.'),
  mk('supports the target claim','src b','Second paraphrase from the same source supporting the target with different wording.')
]);
check((sameSourceDuplicate.provenanceIndependence?.duplicateProvenance||0)===1,'DUPLICATE_PROVENANCE_NOT_WITHHELD',sameSourceDuplicate.provenanceIndependence);
check(sameSourceDuplicate.dynamicReinspection?.triggered===false,'DUPLICATE_PROVENANCE_FALSE_ESCALATION',sameSourceDuplicate.nextInspection);

// Regression: genuinely distinct provenance with opposing relations must still preserve contest.
const independentConflict=V.applyHandoffResults(base,[
  mk('supports the target claim','independent-source-1','Independent source one supplies enough material to structurally support the target claim.'),
  mk('refutes the target claim','independent-source-2','Independent source two supplies enough material to structurally refute the target claim.')
]);
check(String(independentConflict.status).includes('CONTESTED'),'INDEPENDENT_CONFLICT_WAS_OVER_COLLAPSED',independentConflict.status);
check(independentConflict.dynamicReinspection?.triggered===true,'INDEPENDENT_CONFLICT_DID_NOT_CHANGE_BEHAVIOR',independentConflict.nextInspection);
check(independentConflict.nextInspection?.lens==='source_quality'&&independentConflict.nextInspection?.preferredOrgan==='DROPLET','INDEPENDENT_CONFLICT_WRONG_ROUTE',independentConflict.nextInspection);

// Cross-organ regression: a repeated source-quality contest still diverts to GUT rather than echoing to DROPLET.
const echoBreak=V.selectNextInspection({unresolved:[{
  status:'CONTESTED_BY_RECEIPTS',targetRef:'t',clauseRef:'c',lens:'source_quality',evidenceKeys:['a','b']
}]});
check(echoBreak?.preferredOrgan==='GUT'&&echoBreak?.lens==='metabolic_contamination','CROSS_ORGAN_ECHO_BREAK_REGRESSED',echoBreak);

const result={
  schema:'zenomorph-vajra-provenance-independence/v0.1',
  completedAt:new Date().toISOString(),
  status:failures.length?'FAIL':'PASS',
  tests:{
    sameSourceConflict:{status:sameSourceConflict.status,dynamicTriggered:sameSourceConflict.dynamicReinspection?.triggered,sourceContradictions:sameSourceConflict.provenanceIndependence?.sourceContradictions?.length,rejected:sameSourceConflict.handoffResolution?.rejected},
    sameSourceDuplicate:{duplicateProvenance:sameSourceDuplicate.provenanceIndependence?.duplicateProvenance,dynamicTriggered:sameSourceDuplicate.dynamicReinspection?.triggered},
    independentConflict:{status:independentConflict.status,nextInspection:independentConflict.nextInspection},
    echoBreak
  },
  failures,
  provenance:'Synthetic receipts only. No private Drive names, IDs, URLs, or source text are written by this test.',
  boundary:'PASS proves that same-canonical-provenance receipts cannot manufacture an inter-source conflict, inflate evidence count through paraphrase, or trigger VAJRA dynamic escalation; independent provenance can still create a preserved contest; repeated source-quality contests still route to GUT. It does not prove semantic source identity, truth, or independence of differently named sources.'
};
await fs.writeFile('nostromo/vajra/provenance-independence-last-result.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));
if(failures.length)process.exitCode=1;
