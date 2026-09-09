/* VAJRA triage schema-alias replay guard v0.2 — canonicalizes equivalent GUT triage receipt field aliases, suppresses same-provenance/same-classification receipt echoes before dynamic-decomposition counting, and HOLDs contradictory aliases. */
(function(root){
  const api=root.VajraEngine;
  if(!api||typeof api.planConflictDecomposition!=='function') throw new Error('VAJRA_DYNAMIC_DECOMPOSITION_REQUIRED_BEFORE_TRIAGE_ALIAS_REPLAY_GUARD');
  if(api.triageAliasReplayGuardVersion==='0.2') return;

  const basePlan=api.planConflictDecomposition.bind(api);
  const clean=v=>String(v??'').replace(/\s+/g,' ').trim();
  const fp=v=>{let h=2166136261;for(const ch of clean(v)){h^=ch.codePointAt(0);h=Math.imul(h,16777619)>>>0;}return h.toString(16).padStart(8,'0');};
  const canonicalProv=v=>typeof api.canonicalEvidenceProvenance==='function'
    ? api.canonicalEvidenceProvenance(clean(v))
    : clean(v).normalize('NFKC').toLowerCase().replace(/[\p{P}\p{S}\s]+/gu,'');

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

  function echoKey(receipt){
    if(!receipt||typeof receipt!=='object'||Array.isArray(receipt)) return '';
    const targetRef=clean(receipt.targetRef),clauseRef=clean(receipt.clauseRef);
    const organ=clean(receipt.organ),status=clean(receipt.status);
    const classification=clean(receipt.triageClassification).toUpperCase();
    const provenance=canonicalProv(receipt.provenance);
    if(!targetRef||!clauseRef||organ!=='GUT'||status!=='COMPLETED'||!classification||!provenance) return '';
    return `${targetRef}\u0000${clauseRef}\u0000${classification}\u0000${provenance}`;
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
        schema:'zenomorph-vajra-triage-alias-replay-guard/v0.2',
        status:'HOLD',
        reason:'conflicting-schema-alias-fields',
        parent:parent?{targetRef:parent.targetRef,clauseRef:parent.clauseRef,lens:parent.lens,status:parent.status,closed:false}:null,
        facets:[],
        aliasConflicts:conflicts,
        boundary:'Equivalent receipt field aliases may be canonicalized only when their values agree. Conflicting aliases are not resolved by field preference or arrival order; VAJRA preserves the parent conflict and emits only fingerprinted conflict evidence.'
      };
    }

    const deduped=[];
    const seen=new Map();
    const receiptEchoes=[];
    for(const [index,receipt] of normalized.entries()){
      const key=echoKey(receipt);
      if(!key){deduped.push(receipt);continue;}
      if(!seen.has(key)){
        seen.set(key,{index,receipt});
        deduped.push(receipt);
        continue;
      }
      const first=seen.get(key);
      receiptEchoes.push({
        receiptIndex:index,
        firstReceiptIndex:first.index,
        targetRefFingerprint:fp(receipt.targetRef),
        clauseRefFingerprint:fp(receipt.clauseRef),
        provenanceFingerprint:fp(canonicalProv(receipt.provenance)),
        classification:clean(receipt.triageClassification).toUpperCase(),
        reason:'same-provenance-same-classification-receipt-echo'
      });
    }

    const out=basePlan(result,deduped);
    if(!out||typeof out!=='object') return out;
    const baseDuplicate=Number(out.replaySuppression?.duplicateReplayCount||0);
    return {
      ...out,
      replaySuppression:{
        ...(out.replaySuppression||{}),
        duplicateReplayCount:baseDuplicate+receiptEchoes.length,
        sameProvenanceReceiptEchoCount:receiptEchoes.length
      },
      schemaAliasReplayGuard:{
        version:'0.2',
        canonicalPairs:['organ/sourceOrgan','provenance/provenanceFingerprint','triageClassification/classification'],
        normalizedReceiptCount:normalized.length,
        forwardedReceiptCount:deduped.length,
        sameProvenanceReceiptEchoCount:receiptEchoes.length,
        receiptEchoes,
        boundary:'Schema aliases are normalized only for replay identity and qualification equivalence. Completed GUT receipts with the same target, clause, canonical provenance, and triage classification are treated as one metabolic diagnosis for counting even if descriptive fields differ. Same-provenance receipts with different classifications are not collapsed and remain eligible to trigger diagnostic conflict HOLD. This guard does not infer missing evidence, adjudicate source truth, or install capability state.'
      }
    };
  }

  api.normalizeTriageReceiptAliases=normalizeReceipt;
  api.planConflictDecomposition=wrappedPlan;
  api.triageAliasReplayGuardVersion='0.2';
})(typeof window!=='undefined'?window:globalThis);
