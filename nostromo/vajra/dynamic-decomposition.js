/* VAJRA dynamic decomposition v0.7 — qualifying GUT contamination triage can split a repeated source-quality conflict into bounded follow-up facets; qualifying receipt replays are suppressed by deterministic structured identity so object-key serialization order and explicitly declared top-level transport metadata cannot masquerade as evidence multiplicity; canonical provenance aliases cannot manufacture disagreement or order-dependent provenance selection, while genuinely conflicting qualifying triage receipts force a HOLD */
(function(root){
  const api=root.VajraEngine;
  if(!api||typeof api.selectNextInspection!=='function') throw new Error('VajraEngine + dynamic-reinspection must be loaded before dynamic-decomposition');

  const TRIAGE_CLASSES=new Set(['PROVENANCE_COLLISION','DUPLICATE_CONTAMINATION','MIXED_CONTAMINATION']);
  const NON_EVIDENTIAL_TRANSPORT_KEYS=new Set(['receivedAt','received_at','attempt','retry','traceId','trace_id','transportId','transport_id','deliveryId','delivery_id']);
  const clean=v=>String(v??'').replace(/\s+/g,' ').trim();
  const fp=v=>{let h=2166136261;for(const ch of clean(v)){h^=ch.codePointAt(0);h=Math.imul(h,16777619)>>>0;}return h.toString(16).padStart(8,'0');};
  const stableStructure=v=>{
    if(Array.isArray(v)) return v.map(stableStructure);
    if(v&&typeof v==='object') return Object.fromEntries(Object.keys(v).sort().map(k=>[k,stableStructure(v[k])]));
    return v;
  };
  const replayIdentityProjection=v=>{
    if(!v||typeof v!=='object'||Array.isArray(v)) return v;
    return Object.fromEntries(Object.entries(v).filter(([k])=>!NON_EVIDENTIAL_TRANSPORT_KEYS.has(k)));
  };
  const receiptFingerprint=v=>fp(JSON.stringify(stableStructure(replayIdentityProjection(v))));
  const canonicalProvenance=v=>typeof api.canonicalEvidenceProvenance==='function'
    ? api.canonicalEvidenceProvenance(clean(v))
    : clean(v).normalize('NFKC').toLowerCase().replace(/[\p{P}\p{S}\s]+/gu,'');

  function qualifyTriageReceipt(branch,receipt){
    if(!branch||!receipt||typeof receipt!=='object') return {ok:false,reason:'missing-branch-or-receipt'};
    const targetRef=clean(receipt.targetRef),clauseRef=clean(receipt.clauseRef),organ=clean(receipt.organ||receipt.sourceOrgan),status=clean(receipt.status),provenance=clean(receipt.provenance||receipt.provenanceFingerprint),classification=clean(receipt.triageClassification||receipt.classification).toUpperCase();
    if(targetRef!==clean(branch.targetRef)||clauseRef!==clean(branch.clauseRef)) return {ok:false,reason:'scope-mismatch'};
    if(organ!=='GUT') return {ok:false,reason:'gut-receipt-required'};
    if(status!=='COMPLETED') return {ok:false,reason:'completed-receipt-required'};
    if(!provenance) return {ok:false,reason:'provenance-required'};
    if(!TRIAGE_CLASSES.has(classification)) return {ok:false,reason:'non-decomposing-triage-class'};
    const canonical=canonicalProvenance(provenance);
    if(!canonical) return {ok:false,reason:'canonical-provenance-empty'};
    return {ok:true,classification,provenance,canonicalProvenance:canonical,receiptFingerprint:receiptFingerprint(receipt)};
  }

  function auditQualifiedAliases(qualified){
    return qualified
      .map(item=>({
        provenance:item.q.provenance,
        provenanceFingerprint:fp(item.q.canonicalProvenance),
        receiptFingerprint:item.q.receiptFingerprint
      }))
      .sort((a,b)=>a.provenanceFingerprint.localeCompare(b.provenanceFingerprint)||a.receiptFingerprint.localeCompare(b.receiptFingerprint)||a.provenance.localeCompare(b.provenance));
  }

  function replayAudit(duplicateReplayCount){
    return {
      duplicateReplayCount,
      identity:'stable-recursive-object-key-order+bounded-top-level-transport-projection',
      ignoredTopLevelTransportKeys:[...NON_EVIDENTIAL_TRANSPORT_KEYS].sort()
    };
  }

  function planConflictDecomposition(result,receipts=[]){
    const branches=Array.isArray(result?.unresolved)?result.unresolved:[];
    const parent=branches.find(b=>b?.status==='CONTESTED_BY_RECEIPTS'&&b?.lens==='source_quality');
    if(!parent) return {status:'NO_DECOMPOSITION',reason:'no-contested-source-quality-parent',facets:[],rejected:[]};

    const rejected=[];
    const qualified=[];
    const seenQualifiedReceiptFingerprints=new Set();
    let duplicateReplayCount=0;
    for(const receipt of Array.isArray(receipts)?receipts:[]){
      const q=qualifyTriageReceipt(parent,receipt);
      if(q.ok){
        if(seenQualifiedReceiptFingerprints.has(q.receiptFingerprint)){
          duplicateReplayCount++;
          rejected.push({reason:'duplicate-qualifying-receipt-replay',receiptFingerprint:q.receiptFingerprint,provenanceFingerprint:fp(q.canonicalProvenance)});
          continue;
        }
        seenQualifiedReceiptFingerprints.add(q.receiptFingerprint);
        qualified.push({receipt,q});
      } else rejected.push({reason:q.reason,receiptFingerprint:receiptFingerprint(receipt||null)});
    }
    if(!qualified.length) return {status:'HOLD',reason:'qualifying-gut-contamination-triage-required',parent:{targetRef:parent.targetRef,clauseRef:parent.clauseRef,lens:parent.lens,status:parent.status},facets:[],rejected,replaySuppression:replayAudit(duplicateReplayCount),boundary:'Absence or rejection of a GUT triage receipt cannot change VAJRA decomposition behavior. Structured replay suppression cannot create qualifying evidence when no unique qualifying receipt remains. Only explicitly declared top-level transport metadata is ignored for replay identity; nested fields remain evidence-significant.'};

    const signatures=new Map();
    for(const item of qualified){
      const signature=`${item.q.classification}|${item.q.canonicalProvenance}`;
      if(!signatures.has(signature)) signatures.set(signature,[]);
      signatures.get(signature).push(item.q.receiptFingerprint);
    }
    if(signatures.size>1){
      const signatureAudit=[...signatures.entries()]
        .map(([signature,receiptFingerprints])=>({signatureFingerprint:fp(signature),receiptFingerprints:[...receiptFingerprints].sort()}))
        .sort((a,b)=>a.signatureFingerprint.localeCompare(b.signatureFingerprint)||JSON.stringify(a.receiptFingerprints).localeCompare(JSON.stringify(b.receiptFingerprints)));
      return {
        schema:'zenomorph-vajra-dynamic-decomposition/v0.7',
        status:'HOLD',
        reason:'conflicting-qualifying-gut-triage-receipts',
        parent:{targetRef:parent.targetRef,clauseRef:parent.clauseRef,lens:parent.lens,status:parent.status,closed:false},
        facets:[],
        conflict:{signatures:signatureAudit,qualifyingReceiptCount:qualified.length},
        replaySuppression:replayAudit(duplicateReplayCount),
        rejected,
        boundary:'Multiple unique qualifying GUT triage receipts that disagree on classification or canonical provenance cannot be resolved by arrival order. Replay identity recursively sorts object keys and removes only a bounded allowlist of top-level transport-only fields before fingerprinting; evidence-bearing values, arrays, nested objects, summary, provenance, classification, scope, organ and status remain significant. Conflict evidence is emitted deterministically and VAJRA must preserve the parent conflict rather than manufacture certainty.'
      };
    }

    const canonicalRepresentative=[...qualified].sort((a,b)=>a.q.canonicalProvenance.localeCompare(b.q.canonicalProvenance)||a.q.classification.localeCompare(b.q.classification)||a.q.receiptFingerprint.localeCompare(b.q.receiptFingerprint))[0];
    const aliasAudit=auditQualifiedAliases(qualified);
    const shared={targetRef:parent.targetRef,clauseRef:parent.clauseRef,parentLens:parent.lens,parentStatus:parent.status,triageClassification:canonicalRepresentative.q.classification,triageProvenanceFingerprint:fp(canonicalRepresentative.q.canonicalProvenance),status:'OPEN'};
    const facets=[
      {...shared,facetId:`${parent.clauseRef}:identity`,lens:'source_identity',preferredOrgan:'GUT',need:'isolate duplicate/alias/provenance-collision structure without adjudicating claim truth',reason:'Contamination triage makes source identity a separate unresolved structural question.'},
      {...shared,facetId:`${parent.clauseRef}:relation`,lens:'claim_relation',preferredOrgan:'MUTHER',need:'re-evaluate how the surviving material relates to the clause after contaminated copies are not counted as independent support/opposition',reason:'Source contamination changes the evidential relation that must be reconstructed from retained provenance.'}
    ];
    return {
      schema:'zenomorph-vajra-dynamic-decomposition/v0.7',
      status:'DECOMPOSED',
      reason:'qualifying-gut-contamination-triage-split-parent-conflict',
      parent:{targetRef:parent.targetRef,clauseRef:parent.clauseRef,lens:parent.lens,status:parent.status,closed:false},
      facets,
      provenance:{
        triageClassification:canonicalRepresentative.q.classification,
        triageProvenance:canonicalRepresentative.q.provenance,
        triageProvenanceFingerprint:fp(canonicalRepresentative.q.canonicalProvenance),
        qualifyingReceiptCount:qualified.length,
        canonicalAliasCount:qualified.filter(x=>x.q.canonicalProvenance===canonicalRepresentative.q.canonicalProvenance).length,
        aliasAudit,
        preservedTargetRef:parent.targetRef,
        preservedClauseRef:parent.clauseRef
      },
      replaySuppression:replayAudit(duplicateReplayCount),
      rejected,
      boundary:'Dynamic decomposition is a reversible routing/inspection plan. Qualifying GUT receipt replay identity recursively sorts object keys and ignores only a bounded allowlist of top-level transport metadata, preventing delivery wrappers from manufacturing evidential multiplicity. Nested values and all evidence-bearing fields remain significant. Replays are retained as explicit rejected audit entries. Canonical provenance aliases remain traceable, the contested parent remains open, and this does not decide source truth, prove source independence, or claim GUT or MUTHER executed the generated facets.'
    };
  }

  api.qualifyContaminationTriageReceipt=qualifyTriageReceipt;
  api.planConflictDecomposition=planConflictDecomposition;
  api.dynamicDecompositionVersion='0.7';
})(typeof window!=='undefined'?window:globalThis);
