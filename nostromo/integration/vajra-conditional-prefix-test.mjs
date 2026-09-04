import fs from 'node:fs/promises';
import {auditReceiptAmbiguity} from './vajra-ambiguity-guard.mjs';

const failures=[];
const base={targetRef:'t-condition-prefix',clauseRef:'c1',lens:'evidence',organ:'DROPLET',status:'EXECUTED',material:'bounded receipt'};
const anchor={...base,provenance:'anchor',relation:'No directional conclusion is asserted.'};

function polarity(relation,provenance='candidate'){
  const candidate={...base,organ:'MU/TH/UR',provenance,relation};
  const audit=auditReceiptAmbiguity([anchor,candidate]);
  const finding=audit.ambiguous?.[0]||audit.contested?.[0]||null;
  const actual=finding?.receipts?.find(x=>x.provenance===provenance)?.polarity||null;
  return {audit,actual};
}

const cases=[
  ['ONLY_IF_PREFIX','Only if retries remain disabled, this evidence supports the target claim.','UNSPECIFIED'],
  ['PROVIDED_PREFIX','Provided that duplicate inputs are retained, this evidence refutes the target claim.','UNSPECIFIED'],
  ['ASSUMING_PREFIX','Assuming that the cache is cold, this evidence confirms the target claim.','UNSPECIFIED'],
  ['SUBJECT_TO_PREFIX','Subject to the stated sampling restriction, this evidence contradicts the target claim.','UNSPECIFIED'],
  ['UNDER_CONDITION_PREFIX','Under the condition that the fallback is disabled, this evidence corroborates the target claim.','UNSPECIFIED'],
  ['UNLESS_PREFIX','Unless retries are disabled, this evidence supports the target claim.','UNSPECIFIED'],
  ['EXCEPT_WHEN_PREFIX','Except when duplicate inputs are retained, this evidence refutes the target claim.','UNSPECIFIED'],
  ['EXCEPT_IF_SUFFIX','This evidence supports the target claim except if the fallback path is active.','UNSPECIFIED'],
  ['ZH_UNLESS_PREFIX','除非重試機制關閉，這份證據才支持目標命題。','UNSPECIFIED'],
  ['ZH_EXCEPT_PREFIX','除了快取失效的情況之外，這份證據反駁目標命題。','UNSPECIFIED'],
  ['ALTHOUGH_PREFIX_SUPPORT','Although this evidence supports the target claim, provenance remains unaudited.','UNSPECIFIED'],
  ['EVEN_THOUGH_PREFIX_REFUTE','Even though this evidence refutes the target claim, the sample remains incomplete.','UNSPECIFIED'],
  ['DESPITE_PREFIX_SUPPORT','Despite this evidence supporting the target claim, source quality remains unknown.','UNSPECIFIED'],
  ['ZH_CONCESSIVE_PREFIX','雖然這份證據支持目標命題，來源仍未核實。','UNSPECIFIED'],
  ['WHILE_PREFIX_SUPPORT','While this evidence supports the target claim, provenance remains unaudited.','UNSPECIFIED'],
  ['WHILST_PREFIX_REFUTE','Whilst this evidence refutes the target claim, the sample remains incomplete.','UNSPECIFIED'],
  ['WHEREAS_PREFIX_SUPPORT','Whereas this evidence supports the target claim, source quality remains unknown.','UNSPECIFIED'],
  ['ZH_SUISHUO_PREFIX','雖說這份證據支持目標命題，來源仍未核實。','UNSPECIFIED'],
  ['ZH_GURAN_PREFIX','固然這份證據反駁目標命題，樣本仍不完整。','UNSPECIFIED'],
  ['IF_PREFIX_SUPPORT','If this evidence supports the target claim, provenance still needs audit.','UNSPECIFIED'],
  ['WHEN_PREFIX_REFUTE','When this evidence refutes the target claim, the bounded sample still needs replication.','UNSPECIFIED'],
  ['AS_LONG_AS_PREFIX_SUPPORT','As long as this evidence supports the target claim, source independence remains unverified.','UNSPECIFIED'],
  ['ZH_IF_PREFIX_SUPPORT','如果這份證據支持目標命題，來源仍需核實。','UNSPECIFIED'],
  ['ZH_RUO_PREFIX_REFUTE','若這份證據反駁目標命題，樣本仍需重跑。','UNSPECIFIED'],
  ['ZH_TANGRUO_PREFIX_SUPPORT','倘若這份證據支持目標命題，來源獨立性仍未知。','UNSPECIFIED'],
  ['ZH_ZHIYAO_PREFIX_REFUTE','只要這份證據反駁目標命題，仍應保留未解條件。','UNSPECIFIED'],
  ['IF_SAME_SENTENCE_MAIN_SUPPORT','If provenance is audited, this evidence supports the target claim.','UNSPECIFIED'],
  ['WHEN_SAME_SENTENCE_MAIN_REFUTE','When the bounded sample is complete, this evidence refutes the target claim.','UNSPECIFIED'],
  ['AS_LONG_AS_SAME_SENTENCE_MAIN_SUPPORT','As long as source independence is verified, this evidence confirms the target claim.','UNSPECIFIED'],
  ['ZH_IF_SAME_SENTENCE_MAIN_SUPPORT','如果來源完成核實，這份證據支持目標命題。','UNSPECIFIED'],
  ['ZH_RUO_SAME_SENTENCE_MAIN_REFUTE','若樣本完成重跑，這份證據反駁目標命題。','UNSPECIFIED'],
  ['ZH_ZHIYAO_SAME_SENTENCE_MAIN_SUPPORT','只要來源彼此獨立，這份證據佐證目標命題。','UNSPECIFIED'],
  ['SENTENCE_BOUNDARY_CONTROL','Only if retries remain disabled, logging behavior changes. This evidence supports the target claim.','SUPPORTS'],
  ['SEMICOLON_BOUNDARY_CONTROL','Provided that duplicate inputs are retained, logging behavior changes; this evidence refutes the target claim.','REFUTES'],
  ['UNLESS_SENTENCE_BOUNDARY_CONTROL','Unless retries are disabled, logging behavior changes. This evidence supports the target claim.','SUPPORTS'],
  ['EXCEPT_SEMICOLON_BOUNDARY_CONTROL','Except when duplicate inputs are retained, logging behavior changes; this evidence refutes the target claim.','REFUTES'],
  ['CONCESSIVE_MAIN_CLAUSE_SUPPORT','Although provenance is weak, this evidence supports the target claim.','SUPPORTS'],
  ['ZH_CONCESSIVE_MAIN_CLAUSE_REFUTE','雖然樣本有限，這份證據反駁目標命題。','REFUTES'],
  ['WHILE_MAIN_CLAUSE_SUPPORT','While provenance is weak, this evidence supports the target claim.','SUPPORTS'],
  ['WHEREAS_MAIN_CLAUSE_REFUTE','Whereas the sample is incomplete, this evidence refutes the target claim.','REFUTES'],
  ['ZH_GURAN_MAIN_CLAUSE_SUPPORT','固然來源有限，這份證據支持目標命題。','SUPPORTS'],
  ['IF_MAIN_CLAUSE_SUPPORT','If provenance is audited, logging behavior changes. This evidence supports the target claim.','SUPPORTS'],
  ['WHEN_MAIN_CLAUSE_REFUTE','When the sample is complete, logging behavior changes. This evidence refutes the target claim.','REFUTES'],
  ['ZH_IF_MAIN_CLAUSE_SUPPORT','如果來源完成核實，紀錄狀態改變。這份證據支持目標命題。','SUPPORTS']
];

const observations=[];
for(const [name,relation,expected] of cases){
  const {audit,actual}=polarity(relation,`case-${name}`);
  observations.push({name,relation,expected,actual,auditStatus:audit.status});
  if(actual!==expected)failures.push({type:'POLARITY_MISMATCH',name,expected,actual,auditStatus:audit.status});
  if(expected==='UNSPECIFIED'&&audit.status!=='AMBIGUITY_FOUND')failures.push({type:'SCOPED_RELATION_DID_NOT_BLOCK_CLOSURE',name,auditStatus:audit.status});
}

const result={
  schema:'nostromo-vajra-conditional-prefix-test/v0.6',
  status:failures.length?'FAIL':'PASS',
  guard:'VAJRA ambiguity/conflict guard v0.5.7',
  capability:'BOUNDED_ENGLISH_CHINESE_GENERIC_CONDITIONAL_SENTENCE_EXCEPTION_CONCESSIVE_AND_CONTRASTIVE_SCOPE_CONTAINMENT',
  observations,
  failures,
  boundary:'This adversarial test covers bounded English/Chinese condition, exception, concessive and contrastive scope forms around support/refute vocabulary. Generic if/when/as-long-as and 如果/若/倘若/只要 comma-delimited conditions now verify two separate protections: directional words inside the condition prefix cannot manufacture closure, and a directional main clause in the same conditional sentence also remains UNSPECIFIED rather than being flattened into unconditional support/refute. A later sentence after a full sentence boundary remains visible. Concessive/contrastive main clauses remain visible by design. This is lexical/structural scope containment, not general logical parsing or semantic discourse adjudication.'
};
await fs.writeFile('nostromo/integration/vajra-conditional-prefix-last-result.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));
if(failures.length)process.exit(1);
