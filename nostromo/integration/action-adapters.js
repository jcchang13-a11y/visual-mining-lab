/* NOSTROMO action adapters v0.3 — action-level capability boundary */
(function(root){
  const CAPABILITIES={
    shrooming:{actions:{READ_STATE:'EXEC_STATE',INSPECT_STATE:'EXEC_STATE',POSE_QUESTION:'REQUEST_ONLY',RUN_READING_ROUND:'REQUEST_ONLY'}},
    muther:{actions:{READ_STATE:'EXEC_STATE',AUDIT_STATE:'EXEC_STATE',MINE_INTERNAL:'REQUEST_ONLY',FALSIFY:'REQUEST_ONLY'}},
    droplet:{actions:{READ_STATE:'EXEC_STATE',AUDIT_EVIDENCE:'EXEC_STATE',SEARCH_EXTERNAL:'REQUEST_ONLY',VERIFY:'REQUEST_ONLY'}},
    gut:{actions:{DIGEST:'EXEC_CONNECTED'}},
    vajra:{actions:{DISMANTLE:'EXEC_CONNECTED'}}
  };
  function id(){return 'req-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8)}
  async function request(organ,action,payload,context={}){
    const key=String(organ||'').toLowerCase();
    const cap=CAPABILITIES[key];
    if(!cap)return {status:'REJECTED',reason:'UNKNOWN_ORGAN',organ,action};
    const mode=cap.actions[action];
    if(!mode)return {status:'REJECTED',reason:'UNSUPPORTED_ACTION',organ:key,action,supported:Object.keys(cap.actions)};
    const envelope={schema:'nostromo-action/v0.3',requestId:id(),organ:key,action,payload:payload??null,context,createdAt:new Date().toISOString()};
    if(mode==='REQUEST_ONLY')return {status:'QUEUED_UNEXECUTABLE',mode,envelope,reason:'NO_REMOTE_EXECUTOR_CONNECTED'};
    try{
      if(mode==='EXEC_STATE'){
        if(!root.NostromoStateExecutors)throw new Error('STATE_EXECUTOR_UNAVAILABLE');
        const result=await root.NostromoStateExecutors.execute(key,action,payload);
        return {status:'EXECUTED',mode,envelope,result};
      }
      if(key==='gut'&&action==='DIGEST')return {status:'EXECUTED',mode,envelope,result:root.GutEngine.digest(payload,context)};
      if(key==='vajra'&&action==='DISMANTLE')return {status:'EXECUTED',mode,envelope,result:root.VajraEngine.run(String(payload?.text??payload??''),payload?.maxRounds||6)};
      return {status:'REJECTED',reason:'EXECUTOR_MAPPING_MISSING',envelope};
    }catch(error){return {status:'FAILED',mode,envelope,error:String(error?.message||error)};}
  }
  root.NostromoActions={capabilities:CAPABILITIES,request};
})(typeof window!=='undefined'?window:globalThis);
