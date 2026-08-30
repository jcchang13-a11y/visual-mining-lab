// NOSTROMO active executor loop v1.0
// Server/CI-side integration path for repository-native partial executors plus validated external connector evidence.
import crypto from 'node:crypto';
import {shroomSandboxReadingRound,shroomGreenhousePoseQuestion,mutherMineRepo,dropletVerifyUrl} from './repo-executors.mjs';
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
    const shrooming=await shroomSandboxReadingRound({text:roundInput,agents:10,round});
    const greenhouseProbe=await shroomGreenhousePoseQuestion({question:roundInput});
    const muther=await mutherMineRepo({query:mineQuery,limit:8});
    let droplet;
    try{droplet=await dropletVerifyUrl({url:verifyUrl});}
    catch(error){droplet={executor:'DROPLET_URL_VERIFY',status:'FAILED',error:String(error?.message||error),boundary:'EXPLICIT-URL VERIFICATION ATTEMPT FAILED; NOT COUNTED AS EXECUTED'};}

    const vajra=globalThis.VajraEngine.run(roundInput,6);
    const externalConnector=round===1?connectorEvidence:{
      schema:'nostromo-connector-evidence-carry/v1.0',
      status:'CARRIED',
      completedAt:connectorEvidence.completedAt,
      feedbackFingerprint:feedback.fingerprint,
      actions:{
        muther:{action:'MINE_DRIVE_QUERY',status:'CARRIED'},
        mutherInternal:{action:'MINE_INTERNAL',status:'CARRIED'},
        droplet:{action:'SEARCH_EXTERNAL',status:'CARRIED'},
        dropletVerify:{action:'VERIFY',status:'CARRIED'}
      },
      boundary:'Connector actions executed externally once; later rounds apply a redacted evidence-derived feedback directive and do not claim re-execution.'
    };
    const executorPayload={round,feedbackApplied,feedbackFingerprint:feedback.fingerprint,shrooming,greenhouseProbe,muther,droplet,externalConnector,vajra};
    const gut=globalThis.GutEngine.digest(executorPayload,{source:'NOSTROMO/active-executor-loop'});
    const statuses=[shrooming.status,greenhouseProbe.status,muther.status,droplet.status];
    const status=statuses.every(x=>x==='EXECUTED')?'PASS':'FAIL';
    const item={
      round,status,feedback:{applied:feedbackApplied,fingerprint:feedback.fingerprint,privacy:feedback.privacy,inputFingerprint:fp(roundInput)},
      executors:{
        shrooming:{status:shrooming.status,count:shrooming.count,sourceFingerprint:shrooming.sourceFingerprint},
        greenhouseProbe:{status:greenhouseProbe.status,count:greenhouseProbe.count,sourceRounds:greenhouseProbe.sourceRounds,questionFingerprint:greenhouseProbe.questionFingerprint},
        muther:{status:muther.status,hitCount:muther.hitCount,query:muther.query},
        droplet:{status:droplet.status,statusCode:droplet.statusCode||null,finalUrl:droplet.finalUrl||null}
      },
      connector:{
        status:externalConnector.status,
        completedAt:externalConnector.completedAt||null,
        mutherDrive:externalConnector.actions?.muther?.status||null,
        mutherInternal:externalConnector.actions?.mutherInternal?.status||null,
        dropletWeb:externalConnector.actions?.droplet?.status||null,
        dropletVerify:externalConnector.actions?.dropletVerify?.status||null
      },
      vajra:{status:vajra.status,traceLength:vajra.trace.length},
      gut:{ingested:gut.ingested,absorbed:gut.absorbed,excreted:gut.excreted},
      carryIn:carry.slice(0,240),
      carryOut:gut.summary.slice(0,1200)
    };
    trace.push(item);
    carry=item.carryOut||carry;
    if(status!=='PASS') break;
  }
  const acceptedActions=['muther','mutherInternal','droplet','dropletVerify'].filter(k=>connectorEvidence.actions?.[k]?.status==='EXECUTED').length;
  return {
    schema:'nostromo-active-executor-loop/v1.0',
    status:trace.length===total&&trace.every(x=>x.status==='PASS')?'PASS':'FAIL',
    requestedRounds:total,
    completedRounds:trace.length,
    feedback:{fingerprint:feedback.fingerprint,appliedRounds:trace.filter(x=>x.feedback.applied).length,firstAppliedRound:trace.find(x=>x.feedback.applied)?.round||null,privacy:feedback.privacy},
    connectorHandoff:{status:connectorEvidence.status,completedAt:connectorEvidence.completedAt,actionsAccepted:acceptedActions,failures:connectorEvidence.failures},
    trace,
    completedAt:new Date().toISOString(),
    boundary:'Certifies closed-loop routing for SHROOMING local deterministic sandbox plus a non-state-mutating greenhouse probe, MU/TH/UR repository mining, DROPLET explicit-URL verification, VAJRA and GUT, plus acceptance and digestion of externally executed Google Drive query mining, bounded authorized-source MINE_INTERNAL evidence, public web search, and connector-supplied claim-verification evidence. From round 2 onward, a redacted connector-evidence feedback directive is explicitly injected into SHROOMING/greenhouse/VAJRA input; this proves feedback routing, not connector re-execution or semantic correctness. MINE_INTERNAL is not exhaustive private-environment crawling. GitHub Actions does not itself search private Drive or the web.'
  };
}
