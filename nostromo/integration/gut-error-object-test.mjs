import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';

const root=process.cwd();
const resultPath=path.join(root,'nostromo','integration','gut-error-object-last-result.json');
const failures=[];
const check=(ok,type,detail)=>{if(!ok)failures.push({type,detail});};
const code=await fs.readFile(path.join(root,'nostromo','gut','gut-engine.js'),'utf8');
vm.runInThisContext(code,{filename:'nostromo/gut/gut-engine.js'});

const source='NOSTROMO/gut-error-object-test';
const repeatedMessage='authorized connector failed before returning evidence';
const errA=new Error(repeatedMessage);
const errB=new TypeError(repeatedMessage);
const input={
  failures:{primary:errA,secondary:errB},
  ordinaryClaim:'Claim: mentioning an error in ordinary prose should not itself become an Error object.',
  ordinaryEvidence:'Evidence: the error rate declined after the patch.',
  metric:{count:2}
};
const gut=globalThis.GutEngine.digest(input,{source});
const errors=gut.quarantine.filter(x=>x.type==='ERROR_OBJECT');
const expectedPaths=['root.failures.primary','root.failures.secondary'];

check(gut.version==='0.2.32','GUT_COMPAT_VERSION_CHANGED',gut.version);
check(errors.length===2,'ERROR_OBJECT_MULTIPLICITY_LOST',errors);
check(expectedPaths.every(p=>errors.some(x=>x.path===p)),'ERROR_OBJECT_PATH_PROVENANCE_LOST',errors);
check(errors.every(x=>x.route==='HOLD'&&x.status==='QUARANTINE'&&x.reason==='typed-error-object'),'ERROR_OBJECT_NOT_QUARANTINED',errors);
check(errors.every(x=>x.provenance?.inputSource===source),'ERROR_OBJECT_INPUT_PROVENANCE_LOST',errors);
check(errors.some(x=>x.text===`Error: ${repeatedMessage}`),'ERROR_NAME_MESSAGE_NOT_PRESERVED',errors);
check(errors.some(x=>x.text===`TypeError: ${repeatedMessage}`),'ERROR_SUBTYPE_NAME_NOT_PRESERVED',errors);
check(!gut.routes?.DROPLET?.items?.some(x=>expectedPaths.includes(x.path)),'ERROR_OBJECT_PROMOTED_TO_CLAIM',gut.routes?.DROPLET);
check(!gut.routes?.MUTHER?.items?.some(x=>expectedPaths.includes(x.path)),'ERROR_OBJECT_PROMOTED_TO_EVIDENCE',gut.routes?.MUTHER);
check(gut.routes?.DROPLET?.items?.some(x=>x.path==='root.ordinaryClaim'),'ORDINARY_ERROR_PROSE_CLAIM_REGRESSED',gut.routes?.DROPLET);
check(gut.routes?.MUTHER?.items?.some(x=>x.path==='root.ordinaryEvidence'),'ORDINARY_ERROR_RATE_EVIDENCE_REGRESSED',gut.routes?.MUTHER);
check(gut.routes?.MUTHER?.items?.some(x=>x.path==='root.metric.count'&&x.type==='NUMERIC_EVIDENCE'),'FINITE_NUMERIC_EVIDENCE_REGRESSED',gut.routes?.MUTHER);
check(typeof JSON.stringify(gut)==='string','ERROR_OBJECT_BROKE_JSON_SERIALIZATION','digest result was not JSON serializable');
check(errors.every(x=>!('stack' in x)&&!('cause' in x)),'ERROR_STACK_OR_CAUSE_LEAKED_INTO_ATOM',errors);

const result={
  schema:'nostromo-gut-error-object-test/v0.1',
  completedAt:new Date().toISOString(),
  status:failures.length?'FAIL':'PASS',
  capability:'PATH_SCOPED_TYPED_ERROR_OBJECT_PRESERVATION_WITH_QUARANTINE_WITHOUT_STACK_CAUSE_OR_SEMANTIC_PROMOTION',
  quarantinedErrors:errors.map(x=>({path:x.path,text:x.text,type:x.type,status:x.status,route:x.route,reason:x.reason,errorName:x.errorName,provenance:x.provenance})),
  ordinaryClaimStillRoutedToDroplet:gut.routes?.DROPLET?.items?.some(x=>x.path==='root.ordinaryClaim')||false,
  ordinaryEvidenceStillRoutedToMuther:gut.routes?.MUTHER?.items?.some(x=>x.path==='root.ordinaryEvidence')||false,
  finiteMetricStillEvidence:gut.routes?.MUTHER?.items?.some(x=>x.path==='root.metric.count'&&x.type==='NUMERIC_EVIDENCE')||false,
  jsonSerializable:true,
  failures,
  boundary:'JavaScript Error objects are retained before generic enumerable-object traversal. Bounded Error name/message audit text becomes ERROR_OBJECT in QUARANTINE/HOLD. Stack and cause are intentionally not promoted by this capability. Diagnostic text does not establish root cause, factual truth, severity, source identity, retry policy or evidence quality.'
};
await fs.writeFile(resultPath,JSON.stringify(result,null,2)+'\n','utf8');
console.log(JSON.stringify(result,null,2));
if(failures.length)process.exit(1);
