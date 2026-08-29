/* NOSTROMO integration orchestrator v0.3 */
(function(root){
  const PATHS={shrooming:'../mycelium/state.json',muther:'../mother-latest.json',droplet:'./droplet-state.json'};
  async function getJSON(path){const r=await fetch(path,{cache:'no-store'});if(!r.ok)throw new Error(`${path}: HTTP ${r.status}`);return r.json();}
  function vajraText(bundle){return [bundle.shrooming?.report?.headline,bundle.muther?.terminus?.candidate,bundle.droplet?.summary].filter(Boolean).join(' / ');}
  async function loadOrgans(){const [shrooming,muther,droplet]=await Promise.all([getJSON(PATHS.shrooming),getJSON(PATHS.muther),getJSON(PATHS.droplet)]);return {shrooming,muther,droplet};}
  async function makeRequests(live,round,seed){
    if(!root.NostromoActions)return [];
    return Promise.all([
      root.NostromoActions.request('shrooming','INSPECT_STATE',{question:`Round ${round}: 哪個既有判斷最值得重新讀？`,seed},{round,source:'NOSTROMO'}),
      root.NostromoActions.request('muther','AUDIT_STATE',{candidate:live.muther?.terminus?.candidate||null,seed},{round,source:'NOSTROMO'}),
      root.NostromoActions.request('droplet','AUDIT_EVIDENCE',{claim:live.droplet?.summary||null,seed},{round,source:'NOSTROMO'}),
      root.NostromoActions.request('shrooming','RUN_READING_ROUND',{question:`Round ${round}: 重新讀並產生新的分歧`,seed},{round,source:'NOSTROMO',class:'REMOTE_REQUIRED'}),
      root.NostromoActions.request('muther','FALSIFY',{candidate:live.muther?.terminus?.candidate||null,seed},{round,source:'NOSTROMO',class:'REMOTE_REQUIRED'}),
      root.NostromoActions.request('droplet','VERIFY',{claim:live.droplet?.summary||null,seed},{round,source:'NOSTROMO',class:'REMOTE_REQUIRED'})
    ]);
  }
  async function runRound(seed,round){
    if(!root.GutEngine)throw new Error('GUT unavailable');
    if(!root.VajraEngine)throw new Error('VAJRA unavailable');
    const live=await loadOrgans();
    const intake={round,seed,shrooming:live.shrooming,muther:live.muther,droplet:live.droplet};
    const gutIn=root.GutEngine.digest(intake,{source:'NOSTROMO/round-input'});
    const vajra=root.VajraEngine.run(vajraText(live)||gutIn.summary||String(seed||''),6);
    const actionRequests=await makeRequests(live,round,seed);
    const actionResults=actionRequests.filter(x=>x.status==='EXECUTED').map(x=>({organ:x.envelope?.organ,action:x.envelope?.action,result:x.result}));
    const gutOut=root.GutEngine.digest({round,seed,gutIn,vajra,actionResults,actionRequests},{source:'NOSTROMO/round-output'});
    const requestSummary=actionRequests.reduce((a,x)=>{a[x.status]=(a[x.status]||0)+1;return a;},{});
    const hardFailures=actionRequests.filter(x=>x.status==='FAILED'||x.status==='REJECTED');
    return {round,status:hardFailures.length?'FAIL':'PASS',sources:{shroomingUpdated:live.shrooming.updatedAt||null,mutherUpdated:live.muther.updatedAt||null,dropletUpdated:live.droplet.updatedAt||null},routing:['SHROOMING','MU/TH/UR','DROPLET','GUT','VAJRA','ACTION EXECUTORS','GUT'],gut:{in:{ingested:gutIn.ingested,absorbed:gutIn.absorbed,excreted:gutIn.excreted},out:{ingested:gutOut.ingested,absorbed:gutOut.absorbed,excreted:gutOut.excreted}},vajra:{status:vajra.status,traceLength:vajra.trace.length},actions:{count:actionRequests.length,summary:requestSummary,requests:actionRequests.map(x=>({organ:x.envelope?.organ||null,action:x.envelope?.action||null,status:x.status,mode:x.mode||null,reason:x.reason||null,boundary:x.result?.boundary||null}))},carry:gutOut.summary.slice(0,1200)};
  }
  async function run(rounds,seed,onRound){const total=Math.max(1,Math.min(200,Number(rounds)||1));const trace=[];let carry=seed||'NOSTROMO integration test';for(let i=1;i<=total;i++){const result=await runRound(carry,i);trace.push(result);carry=result.carry||carry;if(onRound)onRound(result,trace);}return {status:trace.every(x=>x.status==='PASS')?'PASS':'FAIL',rounds:trace.length,trace,completedAt:new Date().toISOString()};}
  root.NostromoOrchestrator={loadOrgans,runRound,run};
})(typeof window!=='undefined'?window:globalThis);
