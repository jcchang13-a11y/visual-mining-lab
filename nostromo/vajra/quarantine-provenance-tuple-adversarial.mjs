import fs from 'node:fs/promises';
import vm from 'node:vm';
const load=async p=>vm.runInThisContext(await fs.readFile(p,'utf8'),{filename:p});
await load('nostromo/vajra/vajra-engine.js');
await load('nostromo/vajra/dynamic-reinspection.js');
const V=globalThis.VajraEngine;
const failures=[];const check=(ok,type,detail)=>{if(!ok)failures.push({type,detail});};

const baseline={
  status:'CONTESTED_BY_RECEIPTS',targetRef:'t-provenance-tuple',clauseRef:'c-provenance-tuple',lens:'metabolic_contamination',
  evidenceKeys:['receipt-A','receipt-B'],
  evidenceFingerprints:['fp-A','fp-B'],
  evidenceProvenances:['src-A','src-B'],
  quarantineBaselineEvidenceKeys:['receipt-A','receipt-B'],
  quarantineBaselineFingerprints:['fp-A','fp-B'],
  quarantineBaselineProvenances:['src-A','src-B']
};

const missingProvenance={...baseline,
  evidenceKeys:[...baseline.evidenceKeys,'receipt-C'],
  evidenceFingerprints:[...baseline.evidenceFingerprints,'fp-C'],
  evidenceProvenances:[...baseline.evidenceProvenances]
};
const missingResult=V.selectNextInspection({unresolved:[missingProvenance]});
check(missingResult?.trigger==='REPEATED_METABOLIC_CONTEST'&&missingResult?.status==='HOLD','MISSING_PROVENANCE_FALSE_REACTIVATION',missingResult);

const replayedProvenance={...baseline,
  evidenceKeys:[...baseline.evidenceKeys,'receipt-C'],
  evidenceFingerprints:[...baseline.evidenceFingerprints,'fp-C'],
  evidenceProvenances:[...baseline.evidenceProvenances,'src-A']
};
const replayedResult=V.selectNextInspection({unresolved:[replayedProvenance]});
check(replayedResult?.trigger==='REPEATED_METABOLIC_CONTEST'&&replayedResult?.status==='HOLD','REPLAYED_PROVENANCE_FALSE_REACTIVATION',replayedResult);

const misalignedProvenance={...baseline,
  evidenceKeys:[...baseline.evidenceKeys,'receipt-C'],
  evidenceFingerprints:[...baseline.evidenceFingerprints,'fp-C'],
  evidenceProvenances:[...baseline.evidenceProvenances,'src-C','src-extra']
};
const misalignedResult=V.selectNextInspection({unresolved:[misalignedProvenance]});
check(misalignedResult?.trigger==='REPEATED_METABOLIC_CONTEST'&&misalignedResult?.status==='HOLD','MISALIGNED_PROVENANCE_FALSE_REACTIVATION',misalignedResult);

// Adversarial positional laundering: each novel component exists at a different original index.
// Independent filtering must never compact these into one synthetic tuple.
const compactedLaundering={...baseline,
  evidenceKeys:[...baseline.evidenceKeys,'receipt-C','', ''],
  evidenceFingerprints:[...baseline.evidenceFingerprints,'','fp-C',''],
  evidenceProvenances:[...baseline.evidenceProvenances,'','','src-C']
};
const compactedResult=V.selectNextInspection({unresolved:[compactedLaundering]});
check(compactedResult?.trigger==='REPEATED_METABOLIC_CONTEST'&&compactedResult?.status==='HOLD','COMPACTED_POSITIONAL_TUPLE_FALSE_REACTIVATION',compactedResult);

const provenanceBoundNovelty={...baseline,
  evidenceKeys:[...baseline.evidenceKeys,'receipt-C'],
  evidenceFingerprints:[...baseline.evidenceFingerprints,'fp-C'],
  evidenceProvenances:[...baseline.evidenceProvenances,'src-C']
};
const validResult=V.selectNextInspection({unresolved:[provenanceBoundNovelty]});
check(validResult?.trigger==='NOVEL_POST_QUARANTINE_EVIDENCE'&&validResult?.status==='OPEN','PROVENANCE_BOUND_NOVELTY_NOT_REACTIVATED',validResult);

const result={
  schema:'nostromo-vajra-quarantine-provenance-tuple-adversarial/v0.2',
  completedAt:new Date().toISOString(),
  status:failures.length?'FAIL':'PASS',
  capability:'PROVENANCE_BOUND_POSITION_PRESERVING_QUARANTINE_REACTIVATION',
  tests:{missingResult,replayedResult,misalignedResult,compactedResult,validResult},
  provenance:{fixture:'synthetic de-identified quarantine fixtures',failureEvidence:['nostromo/failure-log/2026-09-10-vajra-quarantine-provenance-tuple-laundering.json','nostromo/failure-log/2026-09-10-vajra-quarantine-tuple-compaction-laundering.json']},
  failures,
  boundary:'PASS requires provenance identity to be aligned with the same original post-quarantine evidence position before novelty may alter VAJRA routing. Missing, replayed, misaligned, or independently compacted tuple members must remain HOLD. This test does not establish source truth, independence, semantic novelty, assimilation, or persistent body mutation.'
};
await fs.writeFile('nostromo/vajra/quarantine-provenance-tuple-last-result.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));
if(failures.length)process.exitCode=1;
