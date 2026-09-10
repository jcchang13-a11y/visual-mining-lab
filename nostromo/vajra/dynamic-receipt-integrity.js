/* ZENOMORPH / NOSTROMO VAJRA cross-organ receipt integrity guard v0.1
 * Wraps dynamic decomposition so receipts are inspected as inert data before VAJRA reads semantic fields.
 * Accessors and callable values are rejected without invocation. This guard does not execute, authorize,
 * install, fetch, or assimilate any capability and does not decide source truth.
 */
(function(root){
  const api=root.VajraEngine;
  if(!api||typeof api.planConflictDecomposition!=='function') throw new Error('VAJRA dynamic-decomposition must be loaded before dynamic-receipt-integrity');
  const basePlan=api.planConflictDecomposition;
  const clean=v=>String(v??'').replace(/\s+/g,' ').trim();

  function inspectInertReceipt(rootValue,{maxDepth=8,maxNodes=256}={}){
    if(rootValue===null||typeof rootValue!=='object') return {ok:false,reason:'structured-receipt-required',path:'$'};
    const seen=new WeakSet();
    const queue=[{value:rootValue,path:'$',depth:0}];
    let nodes=0;
    while(queue.length){
      const current=queue.shift();
      const value=current.value;
      if(value===null||typeof value!=='object') continue;
      if(seen.has(value)) continue;
      seen.add(value);
      nodes++;
      if(nodes>maxNodes) return {ok:false,reason:'receipt-complexity-node-limit',path:current.path,nodes,maxDepth};
      if(current.depth>maxDepth) return {ok:false,reason:'receipt-complexity-depth-limit',path:current.path,nodes,maxDepth};
      const descriptors=Object.getOwnPropertyDescriptors(value);
      for(const [key,descriptor] of Object.entries(descriptors)){
        const path=`${current.path}.${String(key).slice(0,80)}`;
        if(!Object.prototype.hasOwnProperty.call(descriptor,'value')){
          return {ok:false,reason:'receipt-accessor-present',path,nodes,maxDepth};
        }
        const child=descriptor.value;
        if(typeof child==='function') return {ok:false,reason:'receipt-callable-present',path,nodes,maxDepth};
        if(child&&typeof child==='object') queue.push({value:child,path,depth:current.depth+1});
      }
    }
    return {ok:true,nodes,maxDepth};
  }

  function guardedPlan(result,receipts=[]){
    const list=Array.isArray(receipts)?receipts:[];
    const safe=[];
    const unsafe=[];
    for(let index=0;index<list.length;index++){
      const inspection=inspectInertReceipt(list[index]);
      if(inspection.ok) safe.push(list[index]);
      else unsafe.push({index,reason:inspection.reason,path:inspection.path});
    }
    const planned=basePlan(result,safe);
    const existingRejected=Array.isArray(planned?.rejected)?planned.rejected:[];
    return {
      ...planned,
      rejected:[...existingRejected,...unsafe.map(item=>({reason:item.reason,unsafePath:item.path,receiptIndex:item.index,receiptIntegrityGuard:true}))],
      receiptIntegrity:{
        version:'0.1',
        inspected:list.length,
        admitted:safe.length,
        quarantined:unsafe.length,
        rejectsAccessorsWithoutInvocation:true,
        rejectsCallableValuesWithoutInvocation:true,
        boundedRecursiveInspection:{maxDepth:8,maxNodes:256},
        proxyBoundary:'Receipts are expected to be plain serialized data; JavaScript Proxy trap side effects are outside this in-process inspection guarantee.'
      },
      boundary:[clean(planned?.boundary),'VAJRA cross-organ receipt integrity guard admits only inert structured receipt data to semantic decomposition. Accessor properties and callable values at any inspected depth are quarantined before decomposition reads receipt fields.'].filter(Boolean).join(' ')
    };
  }

  api.inspectInertCrossOrganReceipt=inspectInertReceipt;
  api.planConflictDecomposition=guardedPlan;
  api.dynamicReceiptIntegrityVersion='0.1';
})(typeof window!=='undefined'?window:globalThis);
