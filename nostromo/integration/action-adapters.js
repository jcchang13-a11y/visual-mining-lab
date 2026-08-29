/* NOSTROMO action adapters v0.2 — explicit capability boundary */
(function(root){
  const CAPABILITIES={
    shrooming:{mode:'REQUEST_ONLY',actions:['READ_STATE','POSE_QUESTION','RUN_READING_ROUND'],executor:null},
    muther:{mode:'REQUEST_ONLY',actions:['READ_STATE','MINE_INTERNAL','FALSIFY'],executor:null},
    droplet:{mode:'REQUEST_ONLY',actions:['READ_STATE','SEARCH_EXTERNAL','VERIFY'],executor:null},
    gut:{mode:'EXEC_CONNECTED',actions:['DIGEST'],executor:'GutEngine'},
    vajra:{mode:'EXEC_CONNECTED',actions:['DISMANTLE'],executor:'VajraEngine'}
  };
  function id(){return 'req-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8)}
  function request(organ,action,payload,context={}){
    const key=String(organ||'').toLowerCase();
    const cap=CAPABILITIES[key];
    if(!cap)return {status:'REJECTED',reason:'UNKNOWN_ORGAN',organ,action};
    if(!cap.actions.includes(action))return {status:'REJECTED',reason:'UNSUPPORTED_ACTION',organ:key,action,supported:cap.actions};
    const envelope={schema:'nostromo-action/v0.2',requestId:id(),organ:key,action,payload:payload??null,context,createdAt:new Date().toISOString()};
    if(cap.mode==='REQUEST_ONLY')return {status:'QUEUED_UNEXECUTABLE',mode:cap.mode,envelope,reason:'NO_EXECUTOR_CONNECTED'};
    try{
      if(key==='gut'&&action==='DIGEST')return {status:'EXECUTED',mode:cap.mode,envelope,result:root.GutEngine.digest(payload,context)};
      if(key==='vajra'&&action==='DISMANTLE')return {status:'EXECUTED',mode:cap.mode,envelope,result:root.VajraEngine.run(String(payload?.text??payload??''),payload?.maxRounds||6)};
      return {status:'REJECTED',reason:'EXECUTOR_MAPPING_MISSING',envelope};
    }catch(error){return {status:'FAILED',mode:cap.mode,envelope,error:String(error?.message||error)};}
  }
  root.NostromoActions={capabilities:CAPABILITIES,request};
})(typeof window!=='undefined'?window:globalThis);
