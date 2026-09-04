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
  ['SENTENCE_BOUNDARY_CONTROL','Only if retries remain disabled, logging behavior changes. This evidence supports the target claim.','SUPPORTS'],
  ['SEMICOLON_BOUNDARY_CONTROL','Provided that duplicate inputs are retained, logging behavior changes; this evidence refutes the target claim.','REFUTES'],
  ['UNLESS_SENTENCE_BOUNDARY_CONTROL','Unless retries are disabled, logging behavior changes. This evidence supports the target claim.','SUPPORTS'],
  ['EXCEPT_SEMICOLON_BOUNDARY_CONTROL','Except when duplicate inputs are retained, logging behavior changes; this evidence refutes the target claim.','REFUTES']
];

const observations=[];
for(const [name,relation,expected] of cases){
  const {audit,actual}=polarity(relation,`case-${name}`);
  observations.push({name,relation,expected,actual,auditStatus:audit.status});
  if(actual!==expected)failures.push({type:'POLARITY_MISMATCH',name,expected,actual,auditStatus:audit.status});
  if(expected==='UNSPECIFIED'&&audit.status!=='AMBIGUITY_FOUND')failures.push({type:'SCOPED_RELATION_DID_NOT_BLOCK_CLOSURE',name,auditStatus:audit.status});
}

const result={
  schema:'nostromo-vajra-conditional-prefix-test/v0.2',
  status:failures.length?'FAIL':'PASS',
  guard:'VAJRA ambiguity/conflict guard v0.5.3',
  capability:'BOUNDED_ENGLISH_CHINESE_CONDITION_AND_EXCEPTION_SCOPE_CONTAINMENT',
  observations,
  failures,
  boundary:'This adversarial test covers bounded English/Chinese condition and exception-scope forms around support/refute vocabulary and verifies that prefix masking does not cross sentence or semicolon boundaries. It is lexical/structural scope containment, not general logical parsing or semantic condition/exception adjudication.'
};
await fs.writeFile('nostromo/integration/vajra-conditional-prefix-last-result.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));
if(failures.length)process.exit(1);
