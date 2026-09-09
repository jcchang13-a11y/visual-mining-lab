/* VAJRA triage schema-alias replay guard v0.5 — canonicalizes equivalent GUT triage receipt field aliases, suppresses same-provenance/same-classification receipt echoes before dynamic-decomposition counting, HOLDs contradictory aliases only when they are scoped to an active contested parent, preserves out-of-scope conflicts as rejected audit evidence, and uses field-specific canonical identity for organ, provenance, and classification aliases. */
(function(root){
  const api=root.VajraEngine;
  if(!api||typeof api.planConflictDecomposition!=='function') throw new Error('VAJRA_DYNAMIC_DECOMPOSITION_REQUIRED_BEFORE_TRIAGE_ALIAS_REPLAY_GUARD');
  if(api.triageAliasReplayGuardVersion==='0.5') return;

  const basePlan=api.planConflictDecomposition.bind(api);
  const clean=v=>String(v??'').replace(/\s+/g,' ').trim();
  const fp=v=>{let h=2166136261;for(const ch of clean(v)){h^=ch.codePointAt(0);h=Math.imul(h,16777619)>>>0;}return h.toString(16).padStart(8,'0');};
  const canonicalOrgan=v=>clean(v).toUpperCase();
  const canonicalProv=v=>typeof api.canonicalEvidenceProvenance==='function'
    ? api.canonicalEvidenceProvenance(clean(v))
    : clean(v).normalize('NFKC').toLowerCase().replace(/[\p{P}\p{S}\s]+/gu,'');

  const pairs=[
    {canonical:'organ',alias:'sourceOrgan',normalize:v=>canonicalOrgan(v)},
    {canonical:'provenance',alias:'provenanceFingerprint',normalize:v=>canonicalProv(v)},
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
      if(pair.canonical==='organ'&&Object.prototype.hasOwnProperty.call(out,pair.canonical)) out[pair.canonical]=canonicalOrgan(out[pair.canonical]);
      if(pair.canonical==='triageClassification'&&Object.prototype.hasOwnProperty.call(out,pair.canonical)) out[pair.canonical]=clean(out[pair.canonical]).toUpperCase();
    }
    return {receipt:out,conflicts};
  }

  function activeContestedParents(result){
    return (Array.isArray(result?.unresolved)?result.unresolved:[]).filter(b=>b?.status==='CONTESTED_BY_RECEIPTS'&&b?.lens==='source_quality');
  }

  function receiptScopesToAnyParent(receipt,parents){
    if(!receipt||typeof receipt!=='object'||Array.isArray(receipt)) return false;
    const targetRef=clean(receipt.targetRef),clauseRef=clean(receipt.clauseRef);
    if(!targetRef||!clauseRef) return false;
    return parents.some(parent=>targetRef===clean(parent.targetRef)&&clauseRef===clean(parent.clauseRef));
  }

  function echoKey(receipt){
    if(!receipt||typeof receipt!=='object'||Array.isArray(receipt)) return '';
    const targetRef=clean(receipt.targetRef),clauseRef=clean(receipt.clauseRef);
    const organ=canonicalOrgan(receipt.organ),status=clean(receipt.status);
    const classification=clean(receipt.triageClassification).toUpperCase();
    const provenance=canonicalProv(receipt.provenance);
    if(!targetRef||!clauseRef||organ!=='GUT'||status!=='COMPLETED'||!classification||!provenance) return '';
    return `${targetRef}\u0000${clauseRef}\u0000${classification}\u0000${provenance}`;
  }

  function wrappedPlan(result,receipts=[]){
    const normalized=[];
    const conflicts=[];
    const parents=activeContestedParents(result);
    for(const [index,receipt] of (Array.isArray(receipts)?receipts:[]).entries()){
      const n=normalizeReceipt(receipt,index);
      normalized.push(n.receipt);
      const scopeRelevant=receiptScopesToAnyParent(receipt,parents);
      conflicts.push(...n.conflicts.map(conflict=>({...conflict,scopeRelevant,targetRefFingerprint:fp(receipt?.targetRef),clauseRefFingerprint:fp(receipt?.clauseRef)})));
    }
    const scopedConflicts=conflicts.filter(x=>x.scopeRelevant);
    const outOfScopeConflicts=conflicts.filter(x=>!x.scopeRelevant);
    if(scopedConflicts.length){
      const parent=parents.find(p=>{
        const tf=fp(p.targetRef),cf=fp(p.clauseRef);
        return scopedConflicts.some(x=>x.targetRefFingerprint===tf&&x.clauseRefFingerprint===cf);
      })||parents[0];
      return {
        schema:'zenomorph-vajra-triage-alias-replay-guard/v0.5',
        status:'HOLD',
        reason:'conflicting-schema-alias-fields',
        parent:parent?{targetRef:parent.targetRef,clauseRef:parent.clauseRef,lens:parent.lens,status:parent.status,closed:false}:null,
        facets:[],
        aliasConflicts:scopedConflicts,
        rejectedAliasConflicts:outOfScopeConflicts,
        schemaAliasReplayGuard:{
          version:'0.5',
          scopedAliasConflictCount:scopedConflicts.length,
          rejectedOutOfScopeAliasConflictCount:outOfScopeConflicts.length
        },
        boundary:'Equivalent receipt field aliases may be canonicalized only when their values agree under the field-specific identity rule. A contradictory alias may change decomposition behavior only when its targetRef and clauseRef match an active contested source-quality parent. Out-of-scope alias conflicts are retained only as fingerprinted rejected audit evidence and cannot manufacture HOLD, target selection, multiplicity, or facets.'
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
        version:'0.5',
        canonicalPairs:['organ/sourceOrgan','provenance/provenanceFingerprint','triageClassification/classification'],
        normalizedReceiptCount:normalized.length,
        forwardedReceiptCount:deduped.length,
        sameProvenanceReceiptEchoCount:receiptEchoes.length,
        scopedAliasConflictCount:0,
        rejectedOutOfScopeAliasConflictCount:outOfScopeConflicts.length,
        receiptEchoes,
        rejectedAliasConflicts:outOfScopeConflicts,
        boundary:'Schema aliases are normalized only for replay identity and qualification equivalence. Organ/sourceOrgan values use bounded case-insensitive declared-organ identity, and provenance/provenanceFingerprint values use canonical provenance identity, so formatting-only variants cannot manufacture HOLD or metabolic multiplicity. Completed GUT receipts with the same target, clause, canonical provenance, and triage classification are treated as one metabolic diagnosis for counting even if descriptive fields differ. Genuinely different aliases can HOLD only when scoped to an active contested parent; out-of-scope alias conflicts remain fingerprinted audit evidence but cannot alter the active branch. Same-provenance receipts with different classifications are not collapsed. This guard does not infer missing evidence, adjudicate source truth, or install capability state.'
      }
    };
  }

  api.normalizeTriageReceiptAliases=normalizeReceipt;
  api.planConflictDecomposition=wrappedPlan;
  api.triageAliasReplayGuardVersion='0.5';
})(typeof window!=='undefined'?window:globalThis);
