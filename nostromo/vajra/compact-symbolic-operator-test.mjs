import fs from 'node:fs/promises';
import vm from 'node:vm';
const load=async p=>vm.runInThisContext(await fs.readFile(p,'utf8'),{filename:p});
await load('nostromo/vajra/vajra-engine.js');
await load('nostromo/vajra/operator-preservation-guard.js');
await load('nostromo/vajra/dynamic-reinspection.js');
const V=globalThis.VajraEngine;
const failures=[];
const check=(ok,type,detail)=>{if(!ok)failures.push({type,detail});};

check(V.operatorPreservationGuardVersion==='0.4','GUARD_VERSION_NOT_V04',V.operatorPreservationGuardVersion);

const forms={
  mul:'Symbolic formula replay records x*y under the same measured condition.',
  unicodeMul:'Symbolic formula replay records x×y under the same measured condition.',
  unicodeDiv:'Symbolic formula replay records x÷y under the same measured condition.',
  unicodeMinus:'Symbolic formula replay records x−y under the same measured condition.',
  divisionSlash:'Symbolic formula replay records x∕y under the same measured condition.',
  caret:'Symbolic formula replay records x^y under the same measured condition.',
  percent:'Symbolic formula replay records x%y under the same measured condition.',
  collapsed:'Symbolic formula replay records xy under the same measured condition.'
};

for(const [name,text] of Object.entries(forms)){
  if(name==='collapsed') continue;
  check(V.canonicalEvidenceMaterial(text)!==V.canonicalEvidenceMaterial(forms.collapsed),`COMPACT_${name.toUpperCase()}_COLLAPSED`,{operator:V.canonicalEvidenceMaterial(text),collapsed:V.canonicalEvidenceMaterial(forms.collapsed)});
  check(V.evidenceIdentity('symbolic-source-001',text)!==V.evidenceIdentity('symbolic-source-001',forms.collapsed),`COMPACT_${name.toUpperCase()}_IDENTITY_COLLAPSED`,null);
}

const compactSlash='Route evidence records a/b under the same bounded provenance context.';
const compactSlashPlain='Route evidence records ab under the same bounded provenance context.';
check(V.canonicalEvidenceMaterial(compactSlash)===V.canonicalEvidenceMaterial(compactSlashPlain),'AMBIGUOUS_COMPACT_ASCII_SLASH_FALSELY_PROMOTED',{slash:V.canonicalEvidenceMaterial(compactSlash),plain:V.canonicalEvidenceMaterial(compactSlashPlain)});

const compactHyphen='Lexical evidence records a-b under the same bounded provenance context.';
const compactHyphenPlain='Lexical evidence records ab under the same bounded provenance context.';
check(V.canonicalEvidenceMaterial(compactHyphen)===V.canonicalEvidenceMaterial(compactHyphenPlain),'AMBIGUOUS_COMPACT_ASCII_HYPHEN_FALSELY_PROMOTED',{hyphen:V.canonicalEvidenceMaterial(compactHyphen),plain:V.canonicalEvidenceMaterial(compactHyphenPlain)});

const base=V.run('研究資料顯示所有這類系統一定可靠。',6);
const branch=base.unresolved.find(b=>b.lens==='evidence')||base.unresolved[0];
const mk=(relation,material)=>({
  targetRef:branch.targetRef,
  clauseRef:branch.clauseRef,
  lens:branch.lens,
  organ:branch.handoff.preferredOrgan,
  status:'COMPLETED',
  provenance:'same-source-symbolic-replay',
  material,
  relation
});

const contest=V.applyHandoffResults(base,[mk('supports the target claim',forms.mul),mk('refutes the target claim',forms.caret)]);
check(String(contest.status).includes('CONTESTED'),'COMPACT_SYMBOLIC_FALSE_CLOSURE',contest.status);
check((contest.handoffResolution?.contested||0)>=1,'COMPACT_SYMBOLIC_CONTEST_NOT_AUDITED',contest.handoffResolution);
check((contest.handoffResolution?.rejected||0)===0,'COMPACT_SYMBOLIC_DISTINCT_EVIDENCE_FALSE_REPLAY',contest.handoffResolution);

const next=V.selectNextInspection(contest);
check(next&&next.lens==='source_quality'&&next.preferredOrgan==='DROPLET','COMPACT_SYMBOLIC_CROSS_ORGAN_BEHAVIOR_NOT_CHANGED',next);

const provA='Source-ID: symbolic-001';
const provB='ＳＯＵＲＣＥ　ＩＤ symbolic001!!!';
check(V.canonicalEvidenceProvenance(provA)===V.canonicalEvidenceProvenance(provB),'PROVENANCE_CANONICALIZATION_REGRESSION',{a:V.canonicalEvidenceProvenance(provA),b:V.canonicalEvidenceProvenance(provB)});
check(V.evidenceIdentity(provA,forms.mul)===V.evidenceIdentity(provB,forms.mul),'PROVENANCE_REPLAY_IDENTITY_REGRESSION',null);

const longLeft='abcdefghijklmnopq*y';
const longPlain='abcdefghijklmnopqy';
check(V.canonicalEvidenceMaterial(longLeft)===V.canonicalEvidenceMaterial(longPlain),'OVERLONG_IDENTIFIER_FALSELY_PROMOTED',{operator:V.canonicalEvidenceMaterial(longLeft),plain:V.canonicalEvidenceMaterial(longPlain)});

const result={
  schema:'zenomorph-vajra-compact-symbolic-operator/v0.4',
  completedAt:new Date().toISOString(),
  status:failures.length?'FAIL':'PASS',
  capability:'BOUNDED_COMPACT_SYMBOLIC_OPERATOR_PRESERVATION',
  tests:{
    protectedForms:Object.keys(forms).filter(x=>x!=='collapsed'),
    compactAsciiSlashRemainsUnpromoted:true,
    compactAsciiHyphenRemainsUnpromoted:true,
    overlongIdentifierRemainsUnpromoted:true,
    contestStatus:contest.status,
    crossOrganNextInspection:next,
    provenanceReplayPreserved:true
  },
  failures,
  provenance:'Synthetic de-identified receipts only. No private Drive names, IDs, URLs, or source text are written by this test.',
  failureEvidence:'nostromo/failure-log/2026-09-08-vajra-compact-symbolic-operator-canonicalization.json',
  boundary:'PASS proves only that bounded compact symbolic-variable forms using *, ×, ÷, −, ∕, ^ and % survive VAJRA replay identity and can preserve a contest that changes the next inspection route. Compact ASCII slash/hyphen and overlong identifiers remain deliberately unpromoted. This is structural preservation, not arithmetic semantics.'
};
await fs.writeFile('nostromo/vajra/compact-symbolic-operator-last-result.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));
if(failures.length) process.exitCode=1;
