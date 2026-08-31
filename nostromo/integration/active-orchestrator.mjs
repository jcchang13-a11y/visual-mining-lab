// NOSTROMO active executor loop v1.1.8
// Server/CI-side integration path for repository-native partial executors plus validated external connector evidence.
import crypto from 'node:crypto';
import {shroomGreenhousePoseQuestion,mutherMineRepo,dropletVerifyUrl} from './repo-executors.mjs';
import {shroomFeedbackReadingRound} from './shroom-feedback-executor.mjs';
import {loadConnectorEvidence} from './connector-evidence.mjs';

function fp(value){return crypto.createHash('sha256').update(String(value)).digest('hex').slice(0,16);}
function buildConnectorFeedback(connectorEvidence){
  const a=connectorEvidence.actions||{};
  const webFinding=String(a.droplet?.publicEvidence?.[0]?.finding||'').slice(0,280);
  const verifyRelations=(a.dropletVerify?.redactedEvidence||[]).map(x=>x.relation).filter(Boolean);
  const directive=[
    'EXTERNAL_CONNECTOR_FEEDBACK',
    `drive_hits=${Number(a.muther?.returnedCount||0)}`,
    `internal_hits=${Number(a.mutherInternal?.returnedCount||0)}`,
    webFinding?`public_web_finding=${webFinding}`:'public_web_finding=none',
    `claim_relations=${verifyRelations.join(',')||'none'}`,
    'Use this evidence as a constraint/counterweight in the next round; do not treat counts or absence as truth.'
  ].join(' | ');
  return {directive,fingerprint:fp(directive),privacy:'PRIVATE DRIVE RAW CONTENT/TITLES/IDS/URLS ARE NOT INCLUDED'};
}
function normalizeLineage(text){
  return String(text).toLowerCase().replace(/\b(ref|clause)\s*[:：=]\s*[0-9a-f]{6,64}\b/gi,'$1:<id>').replace(/\b[0-9a-f]{12,64}\b/gi,'<hash>').replace(/\s+/g,' ').trim();
}
function carryStem(segment){return normalizeLineage(segment).slice(0,180);}
function clauseNgrams(text,n=4){
  const s=normalizeLineage(text).replace(/[\s\p{P}\p{S}]+/gu,'');
  const out=new Set();
  if(s.length<n)return out;
  for(let i=0;i<=s.length-n;i++)out.add(s.slice(i,i+n));
  return out;
}
function clauseSimilarity(a,b){
  const aa=normalizeLineage(a),bb=normalizeLineage(b);
  if(Math.min(aa.length,bb.length)<32)return 0;
  if(aa.includes(bb)||bb.includes(aa))return Math.min(aa.length,bb.length)/Math.max(aa.length,bb.length);
  const A=clauseNgrams(aa),B=clauseNgrams(bb);
  if(!A.size||!B.size)return 0;
  let intersection=0;for(const g of A)if(B.has(g))intersection++;
  return intersection/Math.min(A.size,B.size);
}
function compactIntraSegmentEcho(segment){
  const raw=String(segment||'').trim();
  const tagMatch=raw.match(/^(\[[^\]]+\])\s*/);
  const tag=tagMatch?.[1]||'';
  const body=tagMatch?raw.slice(tagMatch[0].length):raw;
  const clauses=body.split(/\s*[：:]\s*/).map(x=>x.trim()).filter(Boolean);
  if(clauses.length<2)return {text:raw,suppressed:0,shortSuppressed:0,nestedSuppressed:0,nearDuplicateSuppressed:0};
  const kept=[];const norms=[];let suppressed=0,shortSuppressed=0,nestedSuppressed=0,nearDuplicateSuppressed=0;
  for(const clause of clauses){
    const norm=normalizeLineage(clause);
    if(!norm)continue;
    if(norms.includes(norm)){suppressed++;if(norm.length<=4)shortSuppressed++;continue;}
    if(norm.length>=24){
      let swallowed=false;
      for(let i=0;i<norms.length;i++){
        const prior=norms[i];
        if(prior.length<24)continue;
        if(prior.includes(norm)){suppressed++;nestedSuppressed++;swallowed=true;break;}
        if(norm.includes(prior)){
          kept[i]=clause;norms[i]=norm;suppressed++;nestedSuppressed++;swallowed=true;break;
        }
        const sim=clauseSimilarity(prior,norm);
        if(sim>=0.78){
          if(norm.length>prior.length){kept[i]=clause;norms[i]=norm;}
          suppressed++;nearDuplicateSuppressed++;swallowed=true;break;
        }
      }
      if(swallowed)continue;
    }
    kept.push(clause);norms.push(norm);
  }
  const clean=[tag,kept.join('：')].filter(Boolean).join(' ');
  return {text:clean||raw,suppressed,shortSuppressed,nestedSuppressed,nearDuplicateSuppressed};
}
function stripRouteTag(segment){return String(segment||'').replace(/^\[[^\]]+\]\s*/,'').trim();}
function isVolatileLineageOnly(segment){return /^(?:ref|clause)\s*[:：=]\s*[0-9a-f]{6,64}$/i.test(stripRouteTag(segment));}
function lineageOnlyKey(segment){return normalizeLineage(stripRouteTag(segment));}
function charNgrams(text,n=5){
  const s=normalizeLineage(stripRouteTag(text));
  const out=new Set();
  if(s.length<n)return out;
  for(let i=0;i<=s.length-n;i++)out.add(s.slice(i,i+n));
  return out;
}
function nearEchoSimilarity(a,b){
  const aa=normalizeLineage(stripRouteTag(a)),bb=normalizeLineage(stripRouteTag(b));
  if(Math.min(aa.length,bb.length)<80)return 0;
  const shorter=aa.length<=bb.length?aa:bb,longer=aa.length<=bb.length?bb:aa;
  if(longer.includes(shorter))return shorter.length/longer.length;
  const A=charNgrams(aa),B=charNgrams(bb);
  if(!A.size||!B.size)return 0;
  let intersection=0;for(const g of A)if(B.has(g))intersection++;
  return intersection/Math.min(A.size,B.size);
}
function routeOf(segment){return (String(segment||'').match(/^\[([^\]]+)\]/)||[])[1]||'UNTYPED';}
export function compactMetabolicCarry(summary){
  const segments=String(summary||'').split(/\s*·\s*/).map(x=>x.trim()).filter(Boolean);
  const seen=new Set(),lineageTokenSeen=new Set(),routeCounts=new Map(),kept=[];let echoSuppressed=0,lineageOnlySuppressed=0,routeCapped=0,intraSegmentSuppressed=0,shortTokenSuppressed=0,nestedClauseSuppressed=0,nearDuplicateClauseSuppressed=0,crossSegmentNearEchoSuppressed=0;
  for(const rawSegment of segments){
    const intra=compactIntraSegmentEcho(rawSegment);intraSegmentSuppressed+=intra.suppressed;shortTokenSuppressed+=intra.shortSuppressed;nestedClauseSuppressed+=intra.nestedSuppressed;nearDuplicateClauseSuppressed+=intra.nearDuplicateSuppressed||0;
    const segment=intra.text,stem=carryStem(segment),route=routeOf(segment);
    if(isVolatileLineageOnly(segment)){
      const key=lineageOnlyKey(segment);
      if(lineageTokenSeen.has(key)){lineageOnlySuppressed++;continue;}
      lineageTokenSeen.add(key);
    }
    if(stem.length>=32&&seen.has(stem)){echoSuppressed++;continue;}
    let nearEcho=false;
    for(const prior of kept){
      if(routeOf(prior)!==route)continue;
      if(nearEchoSimilarity(prior,segment)>=0.82){nearEcho=true;break;}
    }
    if(nearEcho){crossSegmentNearEchoSuppressed++;continue;}
    const count=routeCounts.get(route)||0;
    if(count>=3){routeCapped++;continue;}
    if(stem.length>=32)seen.add(stem);
    routeCounts.set(route,count+1);kept.push(segment);
    if(kept.join(' · ').length>=900)break;
  }
  const text=kept.join(' · ').slice(0,900);
  return {text,echoSuppressed,lineageOnlySuppressed,routeCapped,intraSegmentSuppressed,shortTokenSuppressed,nestedClauseSuppressed,nearDuplicateClauseSuppressed,crossSegmentNearEchoSuppressed,inputSegments:segments.length,outputSegments:kept.length,fingerprint:fp(text),boundary:'Carry-only containment. Exact/lineage-equivalent colon clauses, nested long clauses, recursively wrapped near-duplicate clauses, repeated ref/clause-only lineage tokens, and same-route cross-segment near echoes are collapsed before recirculation. Cross-segment comparison uses a containment coefficient over normalized 5-grams so wrapper growth cannot evade the audit merely by adding prefixes; original GUT nutrients, routes and provenance are not mutated.'};
}

export async function runActiveExecutorLoop({rounds=10,seed='NOSTROMO active integration',mineQuery='NOSTROMO',verifyUrl='https://github.com/jcchang13-a11y/visual-mining-lab'}={}){
  if(!globalThis.GutEngine) throw new Error('GUT_UNAVAILABLE');
  if(!globalThis.VajraEngine) throw new Error('VAJRA_UNAVAILABLE');
  const connectorEvidence=await loadConnectorEvidence();
  if(connectorEvidence.status!=='ACCEPTED') throw new Error(`CONNECTOR_EVIDENCE_REJECTED:${connectorEvidence.failures.join(',')}`);
  const feedback=buildConnectorFeedback(connectorEvidence);
  const total=Math.max(1,Math.min(50,Number(rounds)||10));
  const trace=[];
  let carry=String(seed||'NOSTROMO active integration');
  for(let round=1;round<=total;round++){
    const feedbackApplied=round>1;
    const roundInput=feedbackApplied?`${carry}\n${feedback.directive}`:carry;
    const shrooming=await shroomFeedbackReadingRound({text:roundInput,agents:10,round});
    const greenhouseProbe=await shroomGreenhousePoseQuestion({question:roundInput});
    const muther=await mutherMineRepo({query:mineQuery,limit:8});
    let droplet;
    try{droplet=await dropletVerifyUrl({url:verifyUrl});}
    catch(error){droplet={executor:'DROPLET_URL_VERIFY',status:'FAILED',error:String(error?.message||error),boundary:'EXPLICIT-URL VERIFICATION ATTEMPT FAILED; NOT COUNTED AS EXECUTED'};}
    const vajra=globalThis.VajraEngine.run(roundInput,6);
    const externalConnector=round===1?connectorEvidence:{schema:'nostromo-connector-evidence-carry/v1.0',status:'CARRIED',completedAt:connectorEvidence.completedAt,feedbackFingerprint:feedback.fingerprint,actions:{muther:{action:'MINE_DRIVE_QUERY',status:'CARRIED'},mutherInternal:{action:'MINE_INTERNAL',status:'CARRIED'},droplet:{action:'SEARCH_EXTERNAL',status:'CARRIED'},dropletVerify:{action:'VERIFY',status:'CARRIED'}},boundary:'Connector actions executed externally once; later rounds apply a redacted evidence-derived feedback directive and do not claim re-execution.'};
    const executorPayload={round,feedbackApplied,feedbackFingerprint:feedback.fingerprint,shrooming,greenhouseProbe,muther,droplet,externalConnector,vajra};
    const inheritedSubstrates=feedbackApplied?[roundInput,carry,feedback.directive]:[roundInput,carry];
    const gut=globalThis.GutEngine.digest(executorPayload,{source:'NOSTROMO/active-executor-loop',inheritedSubstrates});
    const metabolicCarry=compactMetabolicCarry(gut.summary);
    const statuses=[shrooming.status,greenhouseProbe.status,muther.status,droplet.status];
    const status=statuses.every(x=>x==='EXECUTED')?'PASS':'FAIL';
    const item={round,status,feedback:{applied:feedbackApplied,fingerprint:feedback.fingerprint,privacy:feedback.privacy,inputFingerprint:fp(roundInput)},executors:{shrooming:{status:shrooming.status,count:shrooming.count,sourceFingerprint:shrooming.sourceFingerprint,adaptation:shrooming.adaptation},greenhouseProbe:{status:greenhouseProbe.status,count:greenhouseProbe.count,sourceRounds:greenhouseProbe.sourceRounds,questionFingerprint:greenhouseProbe.questionFingerprint},muther:{status:muther.status,hitCount:muther.hitCount,query:muther.query},droplet:{status:droplet.status,statusCode:droplet.statusCode||null,finalUrl:droplet.finalUrl||null}},connector:{status:externalConnector.status,completedAt:externalConnector.completedAt||null,mutherDrive:externalConnector.actions?.muther?.status||null,mutherInternal:externalConnector.actions?.mutherInternal?.status||null,dropletWeb:externalConnector.actions?.droplet?.status||null,dropletVerify:externalConnector.actions?.dropletVerify?.status||null},vajra:{status:vajra.status,traceLength:vajra.trace.length},gut:{ingested:gut.ingested,absorbed:gut.absorbed,excreted:gut.excreted,antiEcho:gut.antiEcho},metabolicCarry,carryIn:carry.slice(0,240),carryOut:metabolicCarry.text};
    trace.push(item);carry=item.carryOut||carry;if(status!=='PASS') break;
  }
  const acceptedActions=['muther','mutherInternal','droplet','dropletVerify'].filter(k=>connectorEvidence.actions?.[k]?.status==='EXECUTED').length;
  return {schema:'nostromo-active-executor-loop/v1.1.8',status:trace.length===total&&trace.every(x=>x.status==='PASS')?'PASS':'FAIL',requestedRounds:total,completedRounds:trace.length,feedback:{fingerprint:feedback.fingerprint,appliedRounds:trace.filter(x=>x.feedback.applied).length,firstAppliedRound:trace.find(x=>x.feedback.applied)?.round||null,privacy:feedback.privacy},connectorHandoff:{status:connectorEvidence.status,completedAt:connectorEvidence.completedAt,actionsAccepted:acceptedActions,failures:connectorEvidence.failures},trace,completedAt:new Date().toISOString(),boundary:'Certifies the closed-loop executor path plus carry-layer metabolic containment and a deterministic SHROOMING feedback-conditioned lens selector. From round 2 onward, redacted connector feedback can change SHROOMING inspection priority without claiming semantic learning or independent persistent agents. Recursive wrapper growth and repeated lineage-only carry fragments are contained only at carry rendering; GUT nutrient atoms, routes and provenance remain intact. GitHub Actions does not itself search private Drive or the web.'};
}
