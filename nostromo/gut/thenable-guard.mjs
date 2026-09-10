/* ZENOMORPH / NOSTROMO GUT candidate thickening: non-executing thenable boundary v0.1
 *
 * Purpose: classify sync vs async-like material without reading `.then` and therefore
 * without executing a getter. This module is isolated from formal GUT admission and
 * held-out gates until CI evidence passes.
 */

function objectLike(value){
  return value!==null&&(typeof value==='object'||typeof value==='function');
}

export function inspectThenableBoundary(value){
  if(!objectLike(value))return {status:'SYNC',reason:'primitive-or-null'};

  const seen=new Set();
  let current=value;
  while(current!==null){
    if(seen.has(current))return {status:'QUARANTINE',reason:'prototype-cycle'};
    seen.add(current);

    let descriptor;
    try{
      descriptor=Object.getOwnPropertyDescriptor(current,'then');
    }catch(error){
      return {status:'QUARANTINE',reason:'then-descriptor-inspection-failed',error:String(error?.message||error).slice(0,240)};
    }

    if(descriptor){
      if(!Object.prototype.hasOwnProperty.call(descriptor,'value')){
        return {status:'QUARANTINE',reason:'then-accessor-not-executed'};
      }
      return typeof descriptor.value==='function'
        ? {status:'ASYNC_LIKE',reason:'callable-then-data-property'}
        : {status:'SYNC',reason:'non-callable-then-data-property'};
    }

    try{
      current=Object.getPrototypeOf(current);
    }catch(error){
      return {status:'QUARANTINE',reason:'prototype-inspection-failed',error:String(error?.message||error).slice(0,240)};
    }
  }

  return {status:'SYNC',reason:'no-then-property'};
}

export const thenableBoundary=Object.freeze({
  version:'0.1',
  candidateOnly:true,
  persistentMutation:false,
  bodyAdmissionOnPass:false,
  directThenPropertyRead:false,
  accessorExecution:false,
  outcomes:['SYNC','ASYNC_LIKE','QUARANTINE'],
  nextStage:'adversarial CI, then held-out gate incorporation candidate'
});
