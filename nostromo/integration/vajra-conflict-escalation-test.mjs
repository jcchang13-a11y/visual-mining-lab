import fs from 'node:fs/promises';
import vm from 'node:vm';
import {escalateVajraConflicts} from './vajra-conflict-escalation.mjs';
const failures=[];
const contested={unresolved:[{targetRef:'t001',clauseRef:'c001',lens:'evidence',status:'CONTESTED_BY_RECEIPTS',contest:{status:'CONTESTED_BY_RECEIPTS',evidence:[
  {evidenceKey:'e-support',provenance:'source-A',polarity:'SUPPORTS',relation:'supports under condition A'},
  {evidenceKey:'e-refute',provenance:'source-B',polarity:'REFUTES',relation:'refutes under matched condition A'}
]}}]};
const out=escalateVajraConflicts(contested);
if(out.status!=='CONFLICT_ESCALATION_REQUIRED'||out.escalatedBranches!==1||out.closureBlocked!==true)failures.push({type:'ESCALATION_NOT_REQUIRED',out});
const packets=out.escalations[0]?.packets||[];
const targets=packets.map(p=>p.targetOrgan).sort();
if(JSON.stringify(targets)!==JSON.stringify(['DROPLET','MUTHER','SHROOMING']))failures.push({type:'THREE_ORGAN_ESCALATION_MISSING',targets});
if(packets.some(p=>p.closureAuthority!=='NONE'||p.status!=='OPEN'))failures.push({type:'FALSE_CLOSURE_AUTHORITY'});
if(packets.some(p=>p.targetRef!=='t001'||p.clauseRef!=='c001'||p.evidenceKeys.length!==2||p.provenanceRefs.length!==2))failures.push({type:'PROVENANCE_OR_SCOPE_LOST'});
const malformed=escalateVajraConflicts({handoffResolution:{contestedBranches:[{targetRef:'t2',clauseRef:'c2',lens:'evidence',status:'CONTESTED_BY_RECEIPTS',evidence:[
 {evidenceKey:'e1',provenance:'',polarity:'SUPPORTS'},{evidenceKey:'e2',provenance:'s2',polarity:'REFUTES'}]}]}});
if(malformed.quarantinedBranches!==1||malformed.escalatedBranches!==0||!malformed.quarantine[0]?.reasons?.includes('PROVENANCE'))failures.push({type:'MALFORMED_CONTEST_NOT_QUARANTINED',malformed});
const none=escalateVajraConflicts({unresolved:[]});
if(none.status!=='NO_CONTEST'||none.closureBlocked!==false)failures.push({type:'NO_CONTEST_FALSE_POSITIVE',none});

// Cross-organ GUT regression: escalation must remain digestible without becoming a truth-closure claim.
const gutCode=await fs.readFile('nostromo/gut/gut-engine.js','utf8').catch(()=>null);
let gut=null;
if(gutCode){vm.runInThisContext(gutCode,{filename:'gut-engine.js'});gut=globalThis.GutEngine?.digest(out,{source:'VAJRA_CONFLICT_ESCALATION'});if(!gut?.absorbed)failures.push({type:'GUT_CANNOT_DIGEST_ESCALATION'});if(/resolved_by_receipt|truth_certified|claim settled/i.test(gut?.summary||''))failures.push({type:'GUT_FALSE_CLOSURE_LEAK'});}
const result={schema:'nostromo-vajra-conflict-escalation-test/v0.1.1',completedAt:new Date().toISOString(),status:failures.length?'FAIL':'PASS',guards:{multiOrganEscalation:targets.length===3,closureRemainsBlocked:out.closureBlocked===true,provenancePreserved:packets.every(p=>p.provenanceRefs.length===2),malformedContestQuarantined:malformed.quarantinedBranches===1,noContestNoFalsePositive:none.status==='NO_CONTEST',gutRegression:gut?gut.absorbed>0:null},sample:out,failures,boundary:'PASS proves only deterministic conflict escalation contracts and anti-false-closure guards. It does not adjudicate truth or source quality.'};
await fs.writeFile('nostromo/integration/vajra-conflict-escalation-last-result.json',JSON.stringify(result,null,2)+'\n','utf8');
console.log(JSON.stringify(result,null,2));
if(failures.length)process.exitCode=1;
