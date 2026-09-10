import fs from 'node:fs/promises';
import vm from 'node:vm';
const load=async p=>vm.runInThisContext(await fs.readFile(p,'utf8'),{filename:p});
await load('nostromo/vajra/vajra-engine.js');
await load('nostromo/vajra/dynamic-reinspection.js');
const V=globalThis.VajraEngine;
const failures=[];
const check=(ok,type,detail)=>{if(!ok)failures.push({type,detail});};

const baseline={
  status:'CONTESTED_BY_RECEIPTS',targetRef:'t-blank-id',clauseRef:'c-blank-id',lens:'metabolic_contamination',
  evidenceKeys:['receipt-A'],evidenceFingerprints:['fp-A'],evidenceProvenances:['src-A'],
  quarantineBaselineEvidenceKeys:['receipt-A'],quarantineBaselineFingerprints:['fp-A'],quarantineBaselineProvenances:['src-A']
};

const ordinary={...baseline,evidenceKeys:['receipt-A','receipt-B'],evidenceFingerprints:['fp-A','fp-B'],evidenceProvenances:['src-A','src-B']};
const ordinaryProbe=V.quarantineNovelty(ordinary);
const ordinaryRoute=V.selectNextInspection({unresolved:[ordinary]});
check(ordinaryProbe?.qualifies===true,'ORDINARY_IDENTITY_FALSE_REJECTION',ordinaryProbe);
check(ordinaryRoute?.trigger==='NOVEL_POST_QUARANTINE_EVIDENCE'&&ordinaryRoute?.preferredOrgan==='DROPLET','ORDINARY_IDENTITY_DID_NOT_REACTIVATE',ordinaryRoute);

const malformedCases=[
  ['WHITESPACE_KEY',{evidenceKeys:['receipt-A','   '],evidenceFingerprints:['fp-A','fp-B'],evidenceProvenances:['src-A','src-B']}],
  ['WHITESPACE_FINGERPRINT',{evidenceKeys:['receipt-A','receipt-B'],evidenceFingerprints:['fp-A','\u3000'],evidenceProvenances:['src-A','src-B']}],
  ['WHITESPACE_PROVENANCE',{evidenceKeys:['receipt-A','receipt-B'],evidenceFingerprints:['fp-A','fp-B'],evidenceProvenances:['src-A','\t']}],
  ['CONTROL_KEY',{evidenceKeys:['receipt-A','receipt\nB'],evidenceFingerprints:['fp-A','fp-B'],evidenceProvenances:['src-A','src-B']}],
  ['CONTROL_FINGERPRINT',{evidenceKeys:['receipt-A','receipt-B'],evidenceFingerprints:['fp-A','fp\u0000B'],evidenceProvenances:['src-A','src-B']}],
  ['CONTROL_PROVENANCE',{evidenceKeys:['receipt-A','receipt-B'],evidenceFingerprints:['fp-A','fp-B'],evidenceProvenances:['src-A','src\rB']}]
];
for(const [label,patch] of malformedCases){
  const branch={...baseline,...patch};
  const probe=V.quarantineNovelty(branch);
  const route=V.selectNextInspection({unresolved:[branch]});
  check(probe?.qualifies===false,`${label}_FALSE_NOVELTY`,probe);
  check(route?.trigger==='REPEATED_METABOLIC_CONTEST'&&route?.status==='HOLD',`${label}_FALSE_REACTIVATION`,route);
}

const aliasCases=[
  ['OUTER_SPACE_ALIAS',{
    quarantineBaselineEvidenceKeys:['receipt-A'],quarantineBaselineFingerprints:['fp-A'],quarantineBaselineProvenances:['src-A'],
    evidenceKeys:[' receipt-A '],evidenceFingerprints:[' fp-A '],evidenceProvenances:[' src-A ']
  }],
  ['FULLWIDTH_COMPATIBILITY_ALIAS',{
    quarantineBaselineEvidenceKeys:['receipt-A'],quarantineBaselineFingerprints:['fp-A'],quarantineBaselineProvenances:['src-A'],
    evidenceKeys:['ｒｅｃｅｉｐｔ－Ａ'],evidenceFingerprints:['ｆｐ－Ａ'],evidenceProvenances:['ｓｒｃ－Ａ']
  }],
  ['MIXED_PRESENTATION_ALIAS',{
    quarantineBaselineEvidenceKeys:['receipt-A'],quarantineBaselineFingerprints:['fp-A'],quarantineBaselineProvenances:['src-A'],
    evidenceKeys:[' receipt-A'],evidenceFingerprints:['ｆｐ－Ａ'],evidenceProvenances:['src-A ']
  }]
];
for(const [label,patch] of aliasCases){
  const branch={...baseline,...patch};
  const probe=V.quarantineNovelty(branch);
  const route=V.selectNextInspection({unresolved:[branch]});
  check(probe?.qualifies===false,`${label}_FALSE_NOVELTY`,probe);
  check(route?.trigger==='REPEATED_METABOLIC_CONTEST'&&route?.status==='HOLD',`${label}_FALSE_REACTIVATION`,route);
}

const rawPreservation={...baseline,
  evidenceKeys:['receipt-A',' receipt-B '],
  evidenceFingerprints:['fp-A','ｆｐ－Ｂ'],
  evidenceProvenances:['src-A',' src-B ']
};
const rawProbe=V.quarantineNovelty(rawPreservation);
check(rawProbe?.qualifies===true,'CANONICAL_COMPARISON_BLOCKED_GENUINE_NOVELTY',rawProbe);
check(rawProbe?.novelTuples?.[0]?.key===' receipt-B '&&rawProbe?.novelTuples?.[0]?.fingerprint==='ｆｐ－Ｂ'&&rawProbe?.novelTuples?.[0]?.provenance===' src-B ','RAW_PROVENANCE_WAS_REWRITTEN',rawProbe);

const result={
  schema:'nostromo-vajra-blank-identity-guard/v0.2',
  completedAt:new Date().toISOString(),
  status:failures.length?'FAIL':'PASS',
  capability:'LEXICALLY_VALID_AND_BOUNDED_CANONICAL_QUARANTINE_IDENTITY_COMPARISON',
  tests:{ordinaryProbe,ordinaryRoute,malformedCases:malformedCases.map(([label])=>label),aliasCases:aliasCases.map(([label])=>label),rawPreservation:rawProbe},
  provenance:{fixture:'synthetic de-identified quarantine tuple fixtures',failureEvidence:['nostromo/failure-log/2026-09-10-vajra-quarantine-blank-identity-laundering.json','nostromo/failure-log/2026-09-10-vajra-quarantine-identity-alias-laundering.json']},
  failures,
  boundary:'PASS proves only that quarantine reactivation rejects whitespace-only and ASCII-control-bearing identity members and does not count outer-whitespace or Unicode NFKC compatibility presentation aliases as new evidence. Canonicalization is comparison-only: raw evidence and provenance tuple values remain preserved. It does not lowercase identifiers, infer semantic identity, judge source truth, execute DROPLET, incorporate capabilities, or clear historical quarantine evidence.'
};
await fs.writeFile('nostromo/vajra/blank-identity-guard-last-result.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));
if(failures.length)process.exitCode=1;
