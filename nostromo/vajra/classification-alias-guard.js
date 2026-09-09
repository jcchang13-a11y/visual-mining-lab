/* VAJRA receipt alias guard v0.4 — classification aliases retain v0.3 containment; provenance/provenanceFingerprint dual declarations now receive the same bounded anti-laundering treatment. */
(function(root){
  const api=root.VajraEngine;
  if(!api||typeof api.qualifyContaminationTriageReceipt!=='function'||typeof api.planConflictDecomposition!=='function') throw new Error('VAJRA dynamic decomposition must be loaded before classification-alias-guard');
  const baseQualify=api.qualifyContaminationTriageReceipt;
  const basePlan=api.planConflictDecomposition;
  const clean=v=>String(v??'').replace(/\s+/g,' ').trim();
  const canonicalClass=v=>clean(v).normalize('NFKC').toUpperCase();
  const canonicalProvenance=v=>typeof api.canonicalEvidenceProvenance==='function'?api.canonicalEvidenceProvenance(clean(v)):clean(v).normalize('NFKC').toLowerCase().replace(/[\p{P}\p{S}\s]+/gu,'');
  function classificationIdentity(receipt){
    const primary=clean(receipt?.triageClassification),alias=clean(receipt?.classification);
    const primaryCanonical=canonicalClass(primary),aliasCanonical=canonicalClass(alias);
    if(primaryCanonical&&aliasCanonical&&primaryCanonical!==aliasCanonical) return {ok:false,reason:'classification-alias-conflict',declared:{triageClassification:primary,classification:alias},canonical:{triageClassification:primaryCanonical,classification:aliasCanonical}};
    return {ok:true,canonical:primaryCanonical||aliasCanonical||'',declared:{triageClassification:primary||null,classification:alias||null}};
  }
  function provenanceIdentity(receipt){
    const primary=clean(receipt?.provenance),alias=clean(receipt?.provenanceFingerprint);
    const primaryCanonical=canonicalProvenance(primary),aliasCanonical=canonicalProvenance(alias);
    if(primaryCanonical&&aliasCanonical&&primaryCanonical!==aliasCanonical) return {ok:false,reason:'provenance-alias-conflict',declared:{provenance:primary,provenanceFingerprint:alias},canonical:{provenance:primaryCanonical,provenanceFingerprint:aliasCanonical}};
    return {ok:true,canonical:primaryCanonical||aliasCanonical||'',declared:{provenance:primary||null,provenanceFingerprint:alias||null}};
  }
  function normalizedReceipt(receipt,cid,pid){
    if(!receipt||typeof receipt!=='object') return receipt;
    const out={...receipt};
    if(cid?.ok&&cid.canonical){if(clean(receipt.triageClassification))out.triageClassification=cid.canonical;if(clean(receipt.classification))out.classification=cid.canonical;}
    if(pid?.ok&&pid.canonical){if(clean(receipt.provenance))out.provenance=pid.canonical;if(clean(receipt.provenanceFingerprint))out.provenanceFingerprint=pid.canonical;}
    return out;
  }
  function rejection(receipt,identity){return {reason:identity.reason,identity,targetRef:clean(receipt?.targetRef)||null,clauseRef:clean(receipt?.clauseRef)||null};}
  function expandClassificationConflict(receipt,identity){const shared={...receipt};delete shared.classification;delete shared.triageClassification;return [{...shared,triageClassification:identity.canonical.triageClassification},{...shared,triageClassification:identity.canonical.classification}];}
  const sameScope=(a,b)=>clean(a?.targetRef)===clean(b?.targetRef)&&clean(a?.clauseRef)===clean(b?.clauseRef);
  function plannedScope(planned){if(planned?.parent)return {targetRef:planned.parent.targetRef,clauseRef:planned.parent.clauseRef};if(Array.isArray(planned?.parents)&&planned.parents.length===1)return {targetRef:planned.parents[0].targetRef,clauseRef:planned.parents[0].clauseRef};return null;}
  api.qualifyContaminationTriageReceipt=function(branch,receipt){
    const cid=classificationIdentity(receipt); if(!cid.ok)return {ok:false,reason:cid.reason,classificationIdentity:cid};
    const pid=provenanceIdentity(receipt); if(!pid.ok)return {ok:false,reason:pid.reason,provenanceIdentity:pid};
    return baseQualify(branch,normalizedReceipt(receipt,cid,pid));
  };
  api.planConflictDecomposition=function(result,receipts=[]){
    const candidates=[],blockedClass=[],blockedProvenance=[];
    for(const receipt of Array.isArray(receipts)?receipts:[]){
      const cid=classificationIdentity(receipt),pid=provenanceIdentity(receipt);
      if(!pid.ok){blockedProvenance.push(rejection(receipt,pid));continue;}
      if(!cid.ok){blockedClass.push(rejection(receipt,cid));candidates.push(...expandClassificationConflict(normalizedReceipt(receipt,{ok:true,canonical:''},pid),cid));continue;}
      candidates.push(normalizedReceipt(receipt,cid,pid));
    }
    const planned=basePlan(result,candidates),scope=plannedScope(planned);
    const relevantClass=scope?blockedClass.filter(x=>sameScope(x,scope)):[];
    const relevantProvenance=scope?blockedProvenance.filter(x=>sameScope(x,scope)):[];
    const classConflictVisible=planned.status==='HOLD'&&planned.reason==='conflicting-qualifying-gut-triage-classifications';
    const rejected=[...(Array.isArray(planned?.rejected)?planned.rejected:[]),...blockedClass,...blockedProvenance];
    if(relevantProvenance.length){
      return {...planned,status:'HOLD',reason:'provenance-alias-conflict',facets:[],behaviorRegulation:undefined,provenance:undefined,rejected,provenanceAliasGuard:{version:'0.1',blockedCount:blockedProvenance.length,relevantBlockedCount:relevantProvenance.length,conflictPreserved:true,boundary:'Contradictory provenance/provenanceFingerprint declarations on a receipt targeting the selected parent are HOLD evidence. Neither alias may silently win. Equivalent aliases are canonicalized only within the provenance field pair; no independence is inferred.'},classificationAliasGuard:{version:'0.3',blockedCount:blockedClass.length,relevantBlockedCount:relevantClass.length,conflictPreserved:classConflictVisible},boundary:'A same-scope contradictory provenance alias pair cannot regulate decomposition until resolved by new evidence. Zero facets are emitted; unrelated-scope provenance conflicts do not poison the selected parent.'};
    }
    if(relevantClass.length&&!classConflictVisible){
      return {...planned,status:'HOLD',reason:'classification-alias-conflict',facets:[],behaviorRegulation:undefined,provenance:undefined,rejected,classificationAliasGuard:{version:'0.3',blockedCount:blockedClass.length,relevantBlockedCount:relevantClass.length,conflictPreserved:true,boundary:'A contradictory same-receipt classification pair targeting the selected parent remains HOLD evidence even when one or both declarations are unauthorized.'},provenanceAliasGuard:{version:'0.1',blockedCount:blockedProvenance.length,relevantBlockedCount:0,conflictPreserved:false},boundary:'A same-scope contradictory classification alias pair cannot regulate decomposition unless resolved by new evidence. Zero facets are emitted.'};
    }
    return {...planned,rejected,classificationAliasGuard:{version:'0.3',blockedCount:blockedClass.length,relevantBlockedCount:relevantClass.length,conflictPreserved:classConflictVisible,boundary:'Contradictory dual classification declarations are rejected; equivalent bounded aliases canonicalize without changing source truth.'},provenanceAliasGuard:{version:'0.1',blockedCount:blockedProvenance.length,relevantBlockedCount:relevantProvenance.length,conflictPreserved:false,boundary:'Dual provenance declarations must canonicalize to one identity or be rejected. Unrelated-scope conflicts remain audited but cannot regulate this parent.'}};
  };
  api.classificationAliasGuardVersion='0.3';
  api.provenanceAliasGuardVersion='0.1';
})(typeof window!=='undefined'?window:globalThis);
