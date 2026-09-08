import fs from 'node:fs/promises';
import vm from 'node:vm';
const load=async p=>vm.runInThisContext(await fs.readFile(p,'utf8'),{filename:p});
await load('nostromo/vajra/vajra-engine.js');
await load('nostromo/vajra/operator-preservation-guard.js');
await load('nostromo/vajra/dynamic-reinspection.js');
const V=globalThis.VajraEngine;
const failures=[];
const check=(ok,type,detail)=>{if(!ok)failures.push({type,detail});};

check(V.operatorPreservationGuardVersion==='0.2','GUARD_VERSION_MISSING',V.operatorPreservationGuardVersion);

// Unit: multiplication and division must remain distinct in canonical material and evidence identity.
const asciiMul='Bounded arithmetic replay records 600*30 under the same measured condition.';
const asciiDiv='Bounded arithmetic replay records 600/30 under the same measured condition.';
const unicodeMul='Bounded arithmetic replay records 600 × 30 under the same measured condition.';
const unicodeDiv='Bounded arithmetic replay records 600 ÷ 30 under the same measured condition.';
const unicodeMinus='Bounded arithmetic replay records 600 − 30 under the same measured condition.';
const unicodeDivisionSlash='Bounded arithmetic replay records 600 ∕ 30 under the same measured condition.';
const asciiPlus='Bounded arithmetic replay records 600 + 30 under the same measured condition.';
check(V.canonicalEvidenceMaterial(asciiMul)!==V.canonicalEvidenceMaterial(asciiDiv),'ASCII_OPERATOR_COLLAPSE',{mul:V.canonicalEvidenceMaterial(asciiMul),div:V.canonicalEvidenceMaterial(asciiDiv)});
check(V.canonicalEvidenceMaterial(unicodeMul)!==V.canonicalEvidenceMaterial(unicodeDiv),'UNICODE_OPERATOR_COLLAPSE',{mul:V.canonicalEvidenceMaterial(unicodeMul),div:V.canonicalEvidenceMaterial(unicodeDiv)});
check(V.canonicalEvidenceMaterial(asciiPlus)!==V.canonicalEvidenceMaterial(unicodeMinus),'UNICODE_MINUS_COLLAPSE',{plus:V.canonicalEvidenceMaterial(asciiPlus),minus:V.canonicalEvidenceMaterial(unicodeMinus)});
check(V.canonicalEvidenceMaterial(unicodeMul)!==V.canonicalEvidenceMaterial(unicodeDivisionSlash),'UNICODE_DIVISION_SLASH_COLLAPSE',{mul:V.canonicalEvidenceMaterial(unicodeMul),divSlash:V.canonicalEvidenceMaterial(unicodeDivisionSlash)});
check(V.evidenceIdentity('source-a',asciiMul)!==V.evidenceIdentity('source-a',asciiDiv),'ASCII_EVIDENCE_ID_COLLAPSE',null);
check(V.evidenceIdentity('source-a',unicodeMul)!==V.evidenceIdentity('source-a',unicodeDiv),'UNICODE_EVIDENCE_ID_COLLAPSE',null);
check(V.evidenceIdentity('source-a',asciiPlus)!==V.evidenceIdentity('source-a',unicodeMinus),'UNICODE_MINUS_EVIDENCE_ID_COLLAPSE',null);
check(V.evidenceIdentity('source-a',unicodeMul)!==V.evidenceIdentity('source-a',unicodeDivisionSlash),'UNICODE_DIVISION_SLASH_EVIDENCE_ID_COLLAPSE',null);

const base=V.run('研究資料顯示所有這類系統一定可靠。',6);
const branch=base.unresolved.find(b=>b.lens==='evidence')||base.unresolved[0];
const mk=(relation,material)=>({
  targetRef:branch.targetRef,
  clauseRef:branch.clauseRef,
  lens:branch.lens,
  organ:branch.handoff.preferredOrgan,
  status:'COMPLETED',
  provenance:'same-source-arithmetic-replay',
  material,
  relation
});

// Adversarial: operator-only material differences must remain distinct so opposing receipts preserve contest.
const asciiContest=V.applyHandoffResults(base,[
  mk('supports the target claim',asciiMul),
  mk('refutes the target claim',asciiDiv)
]);
check(String(asciiContest.status).includes('CONTESTED'),'ASCII_FALSE_CLOSURE',asciiContest.status);
check((asciiContest.handoffResolution?.contested||0)>=1,'ASCII_CONTEST_NOT_AUDITED',asciiContest.handoffResolution);
check((asciiContest.handoffResolution?.rejected||0)===0,'ASCII_DISTINCT_EVIDENCE_FALSE_REPLAY',asciiContest.handoffResolution);

const unicodeContest=V.applyHandoffResults(base,[
  mk('supports the target claim',unicodeMul),
  mk('refutes the target claim',unicodeDiv)
]);
check(String(unicodeContest.status).includes('CONTESTED'),'UNICODE_FALSE_CLOSURE',unicodeContest.status);
check((unicodeContest.handoffResolution?.rejected||0)===0,'UNICODE_DISTINCT_EVIDENCE_FALSE_REPLAY',unicodeContest.handoffResolution);

const scientificGlyphContest=V.applyHandoffResults(base,[
  mk('supports the target claim',asciiPlus),
  mk('refutes the target claim',unicodeMinus)
]);
check(String(scientificGlyphContest.status).includes('CONTESTED'),'UNICODE_MINUS_FALSE_CLOSURE',scientificGlyphContest.status);
check((scientificGlyphContest.handoffResolution?.rejected||0)===0,'UNICODE_MINUS_FALSE_REPLAY',scientificGlyphContest.handoffResolution);

// Cross-organ regression: a preserved contest must alter subsequent inspection rather than merely record two receipts.
const next=V.selectNextInspection(scientificGlyphContest);
check(next&&next.lens==='source_quality'&&next.preferredOrgan==='DROPLET','CROSS_ORGAN_BEHAVIOR_NOT_CHANGED',next);

// Provenance boundary: same material from canonical provenance variants must still collapse as replay; this guard only preserves material operator identity.
const provA='Source-ID: arithmetic-001';
const provB='ＳＯＵＲＣＥ　ＩＤ arithmetic001!!!';
check(V.canonicalEvidenceProvenance(provA)===V.canonicalEvidenceProvenance(provB),'PROVENANCE_CANONICALIZATION_REGRESSION',{a:V.canonicalEvidenceProvenance(provA),b:V.canonicalEvidenceProvenance(provB)});
check(V.evidenceIdentity(provA,unicodeMinus)===V.evidenceIdentity(provB,unicodeMinus),'PROVENANCE_REPLAY_IDENTITY_REGRESSION',null);

// Non-arithmetic boundary: URL/path punctuation must not be reinterpreted as arithmetic merely because '/' exists.
const pathA='Evidence source path archive/item/version with bounded provenance context.';
const pathB='Evidence source path archiveitemversion with bounded provenance context.';
check(V.canonicalEvidenceMaterial(pathA)===V.canonicalEvidenceMaterial(pathB),'PATH_SLASH_WAS_FALSELY_PROMOTED_TO_ARITHMETIC',{a:V.canonicalEvidenceMaterial(pathA),b:V.canonicalEvidenceMaterial(pathB)});

const result={
  schema:'zenomorph-vajra-operator-preservation/v0.2',
  completedAt:new Date().toISOString(),
  status:failures.length?'FAIL':'PASS',
  tests:{
    asciiDistinct:V.evidenceIdentity('source-a',asciiMul)!==V.evidenceIdentity('source-a',asciiDiv),
    unicodeDistinct:V.evidenceIdentity('source-a',unicodeMul)!==V.evidenceIdentity('source-a',unicodeDiv),
    unicodeMinusDistinct:V.evidenceIdentity('source-a',asciiPlus)!==V.evidenceIdentity('source-a',unicodeMinus),
    unicodeDivisionSlashDistinct:V.evidenceIdentity('source-a',unicodeMul)!==V.evidenceIdentity('source-a',unicodeDivisionSlash),
    asciiContest:asciiContest.status,
    unicodeContest:unicodeContest.status,
    scientificGlyphContest:scientificGlyphContest.status,
    crossOrganNextInspection:next,
    provenanceCanonicalReplayPreserved:true,
    pathBoundaryPreserved:true
  },
  failures,
  provenance:'Synthetic de-identified receipts only. No private Drive names, IDs, URLs, or source text are written by this test.',
  failureEvidence:'nostromo/failure-log/2026-09-08-vajra-unicode-arithmetic-operator-gap.json',
  boundary:'PASS proves only that explicit arithmetic operators in bounded arithmetic-looking contexts—including U+2212 mathematical minus and U+2215 division slash—survive VAJRA replay identity, can preserve opposing evidence as a contest, and can alter the next inspection route. Canonical provenance replay suppression remains intact, and arbitrary slash-delimited paths are not promoted to arithmetic. It does not provide semantic arithmetic understanding.'
};
await fs.writeFile('nostromo/vajra/operator-preservation-last-result.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));
if(failures.length)process.exitCode=1;
