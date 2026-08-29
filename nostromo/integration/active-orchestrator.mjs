// NOSTROMO active executor loop v0.5
// Server/CI-side integration path for repository-native partial executors.
import {shroomSandboxReadingRound,mutherMineRepo,dropletVerifyUrl} from './repo-executors.mjs';

export async function runActiveExecutorLoop({rounds=10,seed='NOSTROMO active integration',mineQuery='NOSTROMO',verifyUrl='https://github.com/jcchang13-a11y/visual-mining-lab'}={}){
  if(!globalThis.GutEngine) throw new Error('GUT_UNAVAILABLE');
  if(!globalThis.VajraEngine) throw new Error('VAJRA_UNAVAILABLE');
  const total=Math.max(1,Math.min(50,Number(rounds)||10));
  const trace=[];
  let carry=String(seed||'NOSTROMO active integration');
  for(let round=1;round<=total;round++){
    const shrooming=await shroomSandboxReadingRound({text:carry,agents:10,round});
    const muther=await mutherMineRepo({query:mineQuery,limit:8});
    let droplet;
    try{droplet=await dropletVerifyUrl({url:verifyUrl});}
    catch(error){droplet={executor:'DROPLET_URL_VERIFY',status:'FAILED',error:String(error?.message||error),boundary:'EXPLICIT-URL VERIFICATION ATTEMPT FAILED; NOT COUNTED AS EXECUTED'};}

    const vajra=globalThis.VajraEngine.run(carry,6);
    const executorPayload={round,shrooming,muther,droplet,vajra};
    const gut=globalThis.GutEngine.digest(executorPayload,{source:'NOSTROMO/active-executor-loop'});
    const statuses=[shrooming.status,muther.status,droplet.status];
    const status=statuses.every(x=>x==='EXECUTED')?'PASS':'FAIL';
    const item={
      round,status,
      executors:{
        shrooming:{status:shrooming.status,count:shrooming.count,sourceFingerprint:shrooming.sourceFingerprint},
        muther:{status:muther.status,hitCount:muther.hitCount,query:muther.query},
        droplet:{status:droplet.status,statusCode:droplet.statusCode||null,finalUrl:droplet.finalUrl||null}
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
    schema:'nostromo-active-executor-loop/v0.5',
    status:trace.length===total&&trace.every(x=>x.status==='PASS')?'PASS':'FAIL',
    requestedRounds:total,
    completedRounds:trace.length,
    trace,
    completedAt:new Date().toISOString(),
    boundary:'Certifies closed-loop routing only for SHROOMING local deterministic sandbox, MU/TH/UR repository mining, DROPLET explicit-URL verification, VAJRA and GUT. It does not certify live SHROOMING, Google Drive mining, or search-engine discovery.'
  };
}
