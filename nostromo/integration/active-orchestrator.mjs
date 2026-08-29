// NOSTROMO active executor loop v0.7
// Server/CI-side integration path for repository-native partial executors plus validated external connector evidence.
import {shroomSandboxReadingRound,shroomGreenhousePoseQuestion,mutherMineRepo,dropletVerifyUrl} from './repo-executors.mjs';
import {loadConnectorEvidence} from './connector-evidence.mjs';

export async function runActiveExecutorLoop({rounds=10,seed='NOSTROMO active integration',mineQuery='NOSTROMO',verifyUrl='https://github.com/jcchang13-a11y/visual-mining-lab'}={}){
  if(!globalThis.GutEngine) throw new Error('GUT_UNAVAILABLE');
  if(!globalThis.VajraEngine) throw new Error('VAJRA_UNAVAILABLE');
  const connectorEvidence=await loadConnectorEvidence();
  if(connectorEvidence.status!=='ACCEPTED') throw new Error(`CONNECTOR_EVIDENCE_REJECTED:${connectorEvidence.failures.join(',')}`);
  const total=Math.max(1,Math.min(50,Number(rounds)||10));
  const trace=[];
  let carry=String(seed||'NOSTROMO active integration');
  for(let round=1;round<=total;round++){
    const shrooming=await shroomSandboxReadingRound({text:carry,agents:10,round});
    const greenhouseProbe=await shroomGreenhousePoseQuestion({question:carry});
    const muther=await mutherMineRepo({query:mineQuery,limit:8});
    let droplet;
    try{droplet=await dropletVerifyUrl({url:verifyUrl});}
    catch(error){droplet={executor:'DROPLET_URL_VERIFY',status:'FAILED',error:String(error?.message||error),boundary:'EXPLICIT-URL VERIFICATION ATTEMPT FAILED; NOT COUNTED AS EXECUTED'};}

    const vajra=globalThis.VajraEngine.run(carry,6);
    const externalConnector=round===1?connectorEvidence:{
      schema:'nostromo-connector-evidence-carry/v0.7',
      status:'CARRIED',
      completedAt:connectorEvidence.completedAt,
      actions:{muther:{action:'MINE_DRIVE_QUERY',status:'CARRIED'},droplet:{action:'SEARCH_EXTERNAL',status:'CARRIED'}},
      boundary:'Connector actions executed externally once; later rounds carry their digested evidence and do not claim re-execution.'
    };
    const executorPayload={round,shrooming,greenhouseProbe,muther,droplet,externalConnector,vajra};
    const gut=globalThis.GutEngine.digest(executorPayload,{source:'NOSTROMO/active-executor-loop'});
    const statuses=[shrooming.status,greenhouseProbe.status,muther.status,droplet.status];
    const status=statuses.every(x=>x==='EXECUTED')?'PASS':'FAIL';
    const item={
      round,status,
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
        dropletWeb:externalConnector.actions?.droplet?.status||null
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
  return {
    schema:'nostromo-active-executor-loop/v0.7',
    status:trace.length===total&&trace.every(x=>x.status==='PASS')?'PASS':'FAIL',
    requestedRounds:total,
    completedRounds:trace.length,
    connectorHandoff:{status:connectorEvidence.status,completedAt:connectorEvidence.completedAt,actionsAccepted:2,failures:connectorEvidence.failures},
    trace,
    completedAt:new Date().toISOString(),
    boundary:'Certifies closed-loop routing for SHROOMING local deterministic sandbox plus a non-state-mutating question probe grounded in the latest published greenhouse history, MU/TH/UR repository mining, DROPLET explicit-URL verification, VAJRA and GUT, plus acceptance and digestion of externally executed Google Drive query mining and public web search. It does not certify formal SHROOMING round advancement or ten independent live LLM processes.'
  };
}
