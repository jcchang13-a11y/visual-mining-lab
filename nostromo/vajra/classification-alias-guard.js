/* VAJRA classification alias guard v0.2 — contradictory triageClassification/classification declarations remain visible as conflict evidence instead of becoming certainty. */
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
    const relevantConflictVisible=planned.status==='HOLD'&&planned.reason==='conflicting-qualifying-gut-triage-classifications';
    return {...planned,rejected:[...(Array.isArray(planned?.rejected)?planned.rejected:[]),...blocked],classificationAliasGuard:{version:'0.2',blockedCount:blocked.length,conflictPreserved:relevantConflictVisible,boundary:'Contradictory dual classification declarations are rejected by direct qualification and expanded only inside planning as two same-provenance diagnostic declarations so a relevant contradiction remains HOLD evidence even when a clean receipt is also present. Unrelated target/clause conflicts remain subject to the existing target qualification boundary. Equivalent case/Unicode aliases are canonicalized only within the bounded authorized classification field pair; no source truth or independence is inferred.'}};
  };
  api.classificationAliasGuardVersion='0.2';
})(typeof window!=='undefined'?window:globalThis);
