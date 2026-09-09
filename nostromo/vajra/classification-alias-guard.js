/* VAJRA classification alias guard v0.3 — contradictory triageClassification/classification declarations remain target-scoped HOLD evidence even when one or both declarations are unknown or unauthorized. */
(function(root){
  const api=root.VajraEngine;
  if(!api||typeof api.qualifyContaminationTriageReceipt!=='function'||typeof api.planConflictDecomposition!=='function') throw new Error('VAJRA dynamic decomposition must be loaded before classification-alias-guard');
  const baseQualify=api.qualifyContaminationTriageReceipt;
  const basePlan=api.planConflictDecomposition;
  const clean=v=>String(v??'').replace(/\s+/g,' ').trim();
  const canonical=v=>clean(v).normalize('NFKC').toUpperCase();
  function classificationIdentity(receipt){
    const primary=clean(receipt?.triageClassification);
    const alias=clean(receipt?.classification);
    const primaryCanonical=canonical(primary),aliasCanonical=canonical(alias);
    if(primaryCanonical&&aliasCanonical&&primaryCanonical!==aliasCanonical){
      return {ok:false,reason:'classification-alias-conflict',declared:{triageClassification:primary,classification:alias},canonical:{triageClassification:primaryCanonical,classification:aliasCanonical}};
    }
    return {ok:true,canonical:primaryCanonical||aliasCanonical||'',declared:{triageClassification:primary||null,classification:alias||null}};
  }
  function normalizedReceipt(receipt,identity){
    if(!receipt||typeof receipt!=='object'||!identity?.ok||!identity.canonical) return receipt;
    const out={...receipt};
    if(clean(receipt.triageClassification)) out.triageClassification=identity.canonical;
    if(clean(receipt.classification)) out.classification=identity.canonical;
    return out;
  }
  function rejection(receipt,identity){
    return {reason:'classification-alias-conflict',classificationIdentity:identity,targetRef:clean(receipt?.targetRef)||null,clauseRef:clean(receipt?.clauseRef)||null};
  }
  function expandConflict(receipt,identity){
    const shared={...receipt};
    delete shared.classification;
    delete shared.triageClassification;
    return [
      {...shared,triageClassification:identity.canonical.triageClassification},
      {...shared,triageClassification:identity.canonical.classification}
    ];
  }
  function sameScope(a,b){
    return clean(a?.targetRef)===clean(b?.targetRef)&&clean(a?.clauseRef)===clean(b?.clauseRef);
  }
  function plannedScope(planned){
    if(planned?.parent) return {targetRef:planned.parent.targetRef,clauseRef:planned.parent.clauseRef};
    if(Array.isArray(planned?.parents)&&planned.parents.length===1) return {targetRef:planned.parents[0].targetRef,clauseRef:planned.parents[0].clauseRef};
    return null;
  }
  api.qualifyContaminationTriageReceipt=function(branch,receipt){
    const identity=classificationIdentity(receipt);
    if(!identity.ok) return {ok:false,reason:identity.reason,classificationIdentity:identity};
    return baseQualify(branch,normalizedReceipt(receipt,identity));
  };
  api.planConflictDecomposition=function(result,receipts=[]){
    const candidates=[],blocked=[];
    for(const receipt of Array.isArray(receipts)?receipts:[]){
      const identity=classificationIdentity(receipt);
      if(!identity.ok){
        blocked.push(rejection(receipt,identity));
        candidates.push(...expandConflict(receipt,identity));
        continue;
      }
      candidates.push(normalizedReceipt(receipt,identity));
    }
    const planned=basePlan(result,candidates);
    if(!blocked.length) return planned;
    const scope=plannedScope(planned);
    const relevantBlocked=scope?blocked.filter(item=>sameScope(item,scope)):[];
    const relevantConflictVisible=planned.status==='HOLD'&&planned.reason==='conflicting-qualifying-gut-triage-classifications';
    const rejected=[...(Array.isArray(planned?.rejected)?planned.rejected:[]),...blocked];
    if(relevantBlocked.length&&!relevantConflictVisible){
      return {
        ...planned,
        status:'HOLD',
        reason:'classification-alias-conflict',
        facets:[],
        behaviorRegulation:undefined,
        provenance:undefined,
        rejected,
        classificationAliasGuard:{
          version:'0.3',
          blockedCount:blocked.length,
          relevantBlockedCount:relevantBlocked.length,
          conflictPreserved:true,
          boundary:'A contradictory same-receipt classification pair that targets the selected parent is HOLD evidence even when one or both declarations are unknown or unauthorized and therefore cannot qualify as decomposition classes. Unknown declarations may not disappear in a way that lets the authorized half manufacture certainty. Unrelated target/clause conflicts do not poison the selected parent.'
        },
        boundary:'A same-scope contradictory classification alias pair cannot regulate decomposition unless the contradiction is resolved by new evidence. Zero facets are emitted and any provisional profile selected after discarding an unknown half is suppressed.'
      };
    }
    return {...planned,rejected,classificationAliasGuard:{version:'0.3',blockedCount:blocked.length,relevantBlockedCount:relevantBlocked.length,conflictPreserved:relevantConflictVisible,boundary:'Contradictory dual classification declarations are rejected by direct qualification. Planning preserves authorized-vs-authorized contradictions through expanded same-provenance diagnostics and independently blocks same-scope authorized-vs-unknown or unknown-vs-unknown contradictions from being laundered into certainty. Unrelated target/clause conflicts remain subject to the existing target qualification boundary. Equivalent case/Unicode aliases are canonicalized only within the bounded classification field pair; no source truth or independence is inferred.'}};
  };
  api.classificationAliasGuardVersion='0.3';
})(typeof window!=='undefined'?window:globalThis);
