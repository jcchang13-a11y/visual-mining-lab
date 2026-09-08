/* VAJRA triage schema-alias replay guard v0.1 — canonicalizes equivalent GUT triage receipt field aliases before dynamic-decomposition replay identity. Conflicting aliases HOLD rather than allowing arrival order to decide. */
(function(root){
  const api=root.VajraEngine;
  if(!api||typeof api.planConflictDecomposition!=='function') throw new Error('VAJRA_DYNAMIC_DECOMPOSITION_REQUIRED_BEFORE_TRIAGE_ALIAS_REPLAY_GUARD');
  if(api.triageAliasReplayGuardVersion==='0.1') return;

  const basePlan=api.planConflictDecomposition.bind(api);
  const clean=v=>String(v??'').replace(/\s+/g,' ').trim();
  const fp=v=>{let h=2166136261;for(const ch of clean(v)){h^=ch.codePointAt(0);h=Math.imul(h,16777619)>>>0;}return h.toString(16).padStart(8,'0');};

  const pairs=[
    {canonical:'organ',alias:'sourceOrgan',normalize:v=>clean(v)},
    {canonical:'provenance',alias:'provenanceFingerprint',normalize:v=>clean(v)},
    {canonical:'triageClassification',alias:'classification',normalize:v=>clean(v).toUpperCase()}
  ];

  function normalizeReceipt(receipt,index){
    if(!receipt||typeof receipt!=='object'||Array.isArray(receipt)) return {receipt,conflicts:[]};
    const out={...receipt};
    const conflicts=[];
    for(const pair of pairs){
      const hasCanonical=Object.prototype.hasOwnProperty.call(out,pair.canonical)&&clean(out[pair.canonical])!=='';
      const hasAlias=Object.prototype.hasOwnProperty.call(out,pair.alias)&&clean(out[pair.alias])!=='';
      if(hasCanonical&&hasAlias){
        const a=pair.normalize(out[pair.canonical]);
        const b=pair.normalize(out[pair.alias]);
        if(a!==b){
          conflicts.push({receiptIndex:index,fieldPair:`${pair.canonical}/${pair.alias}`,canonicalFingerprint:fp(a),aliasFingerprint:fp(b)});
          continue;
        }
      }
      if(!hasCanonical&&hasAlias) out[pair.canonical]=out[pair.alias];
      if(hasAlias) delete out[pair.alias];
      if(pair.canonical==='triageClassification'&&Object.prototype.hasOwnProperty.call(out,pair.canonical)) out[pair.canonical]=pair.normalize(out[pair.canonical]);
    }
    return {receipt:out,conflicts};
  }

  function wrappedPlan(result,receipts=[]){
    const normalized=[];
    const conflicts=[];
    for(const [index,receipt] of (Array.isArray(receipts)?receipts:[]).entries()){
      const n=normalizeReceipt(receipt,index);
      normalized.push(n.receipt);
      conflicts.push(...n.conflicts);
    }
    if(conflicts.length){
      const parent=(Array.isArray(result?.unresolved)?result.unresolved:[]).find(b=>b?.status==='CONTESTED_BY_RECEIPTS'&&b?.lens==='source_quality');
      return {
        schema:'zenomorph-vajra-triage-alias-replay-guard/v0.1',
        status:'HOLD',
        reason:'conflicting-schema-alias-fields',
        parent:parent?{targetRef:parent.targetRef,clauseRef:parent.clauseRef,lens:parent.lens,status:parent.status,closed:false}:null,
        facets:[],
        aliasConflicts:conflicts,
        boundary:'Equivalent receipt field aliases may be canonicalized only when their values agree. Conflicting aliases are not resolved by field preference or arrival order; VAJRA preserves the parent conflict and emits only fingerprinted conflict evidence.'
      };
    }
    const out=basePlan(result,normalized);
    if(!out||typeof out!=='object') return out;
    return {
      ...out,
      schemaAliasReplayGuard:{
        version:'0.1',
        canonicalPairs:['organ/sourceOrgan','provenance/provenanceFingerprint','triageClassification/classification'],
        normalizedReceiptCount:normalized.length,
        boundary:'Schema aliases are normalized only for replay identity and qualification equivalence. This guard does not infer missing evidence, change triage classification, adjudicate source truth, or install capability state.'
      }
    };
  }

  api.normalizeTriageReceiptAliases=normalizeReceipt;
  api.planConflictDecomposition=wrappedPlan;
  api.triageAliasReplayGuardVersion='0.1';
})(typeof window!=='undefined'?window:globalThis);
