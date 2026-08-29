/* NOSTROMO integration orchestrator v0.1 */
(function(root){
  const PATHS={
    shrooming:'../mycelium/state.json',
    muther:'../mother-latest.json',
    droplet:'./droplet-state.json'
  };
  async function getJSON(path){const r=await fetch(path,{cache:'no-store'});if(!r.ok)throw new Error(`${path}: HTTP ${r.status}`);return r.json();}
  function vajraText(bundle){
    return [
      bundle.shrooming?.report?.headline,
      bundle.muther?.terminus?.candidate,
      bundle.droplet?.summary
    ].filter(Boolean).join(' / ');
  }
  async function loadOrgans(){
    const [shrooming,muther,droplet]=await Promise.all([getJSON(PATHS.shrooming),getJSON(PATHS.muther),getJSON(PATHS.droplet)]);
    return {shrooming,muther,droplet};
  }
  async function runRound(seed,round){
    if(!root.GutEngine)throw new Error('GUT unavailable');
    if(!root.VajraEngine)throw new Error('VAJRA unavailable');
    const live=await loadOrgans();
    const intake={round,seed,shrooming:live.shrooming,muther:live.muther,droplet:live.droplet};
    const gutIn=root.GutEngine.digest(intake,{source:'NOSTROMO/round-input'});
    const vajra=root.VajraEngine.run(vajraText(live) || gutIn.summary || String(seed||''),6);
    const gutOut=root.GutEngine.digest({round,seed,gutIn,vajra},{source:'NOSTROMO/round-output'});
    return {
      round,
      status:'PASS',
      sources:{
        shroomingUpdated:live.shrooming.updatedAt||null,
        mutherUpdated:live.muther.updatedAt||null,
        dropletUpdated:live.droplet.updatedAt||null
      },
      routing:['SHROOMING','MU/TH/UR','DROPLET','GUT','VAJRA','GUT'],
      gut:{in:{ingested:gutIn.ingested,absorbed:gutIn.absorbed,excreted:gutIn.excreted},out:{ingested:gutOut.ingested,absorbed:gutOut.absorbed,excreted:gutOut.excreted}},
      vajra:{status:vajra.status,traceLength:vajra.trace.length},
      carry:gutOut.summary.slice(0,1200)
    };
  }
  async function run(rounds,seed,onRound){
    const total=Math.max(1,Math.min(200,Number(rounds)||1));
    const trace=[];let carry=seed||'NOSTROMO integration test';
    for(let i=1;i<=total;i++){
      const result=await runRound(carry,i);trace.push(result);carry=result.carry||carry;
      if(onRound)onRound(result,trace);
    }
    return {status:trace.every(x=>x.status==='PASS')?'PASS':'FAIL',rounds:trace.length,trace,completedAt:new Date().toISOString()};
  }
  root.NostromoOrchestrator={loadOrgans,runRound,run};
})(typeof window!=='undefined'?window:globalThis);
