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

const cases=[
  ['WHITESPACE_KEY',{evidenceKeys:['receipt-A','   '],evidenceFingerprints:['fp-A','fp-B'],evidenceProvenances:['src-A','src-B']}],
  ['WHITESPACE_FINGERPRINT',{evidenceKeys:['receipt-A','receipt-B'],evidenceFingerprints:['fp-A','\u3000'],evidenceProvenances:['src-A','src-B']}],
  ['WHITESPACE_PROVENANCE',{evidenceKeys:['receipt-A','receipt-B'],evidenceFingerprints:['fp-A','fp-B'],evidenceProvenances:['src-A','\t']}],
  ['CONTROL_KEY',{evidenceKeys:['receipt-A','receipt\nB'],evidenceFingerprints:['fp-A','fp-B'],evidenceProvenances:['src-A','src-B']}],
  ['CONTROL_FINGERPRINT',{evidenceKeys:['receipt-A','receipt-B'],evidenceFingerprints:['fp-A','fp\u0000B'],evidenceProvenances:['src-A','src-B']}],
  ['CONTROL_PROVENANCE',{evidenceKeys:['receipt-A','receipt-B'],evidenceFingerprints:['fp-A','fp-B'],evidenceProvenances:['src-A','src\rB']}]
];
for(const [label,patch] of cases){
  const branch={...baseline,...patch};
  const probe=V.quarantineNovelty(branch);
  const route=V.selectNextInspection({unresolved:[branch]});
  check(probe?.qualifies===false,`${label}_FALSE_NOVELTY`,probe);
  check(route?.trigger==='REPEATED_METABOLIC_CONTEST'&&route?.status==='HOLD',`${label}_FALSE_REACTIVATION`,route);
}

const result={
  schema:'nostromo-vajra-blank-identity-guard/v0.1',
  completedAt:new Date().toISOString(),
  status:failures.length?'FAIL':'PASS',
  capability:'LEXICALLY_VALID_PROVENANCE_BOUND_QUARANTINE_IDENTITY',
  tests:{ordinaryProbe,ordinaryRoute,cases:cases.map(([label])=>label)},
  provenance:{fixture:'synthetic de-identified quarantine tuple fixtures',failureEvidence:'nostromo/failure-log/2026-09-10-vajra-quarantine-blank-identity-laundering.json'},
  failures,
  boundary:'PASS proves only that quarantine reactivation rejects whitespace-only and ASCII-control-bearing evidence key, content-fingerprint, or provenance identity members while preserving normal provenance-bound reactivation. It does not infer semantic identity, normalize aliases, judge source truth, execute DROPLET, incorporate capabilities, or clear historical quarantine evidence.'
};
await fs.writeFile('nostromo/vajra/blank-identity-guard-last-result.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));
if(failures.length)process.exitCode=1;
