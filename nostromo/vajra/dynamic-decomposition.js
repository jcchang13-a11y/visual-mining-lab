/* VAJRA dynamic decomposition v0.5 — qualifying GUT contamination triage can split a repeated source-quality conflict into bounded follow-up facets; exact qualifying receipt replays are suppressed before counting so metabolic echo cannot masquerade as evidence multiplicity; canonical provenance aliases cannot manufacture disagreement or order-dependent provenance selection, while genuinely conflicting qualifying triage receipts force a HOLD */
(function(root){
  const api=root.VajraEngine;
  if(!api||typeof api.selectNextInspection!=='function') throw new Error('VajraEngine + dynamic-reinspection must be loaded before dynamic-decomposition');

  const TRIAGE_CLASSES=new Set(['PROVENANCE_COLLISION','DUPLICATE_CONTAMINATION','MIXED_CONTAMINATION']);
  const clean=v=>String(v??'').replace(/\s+/g,' ').trim();
  const fp=v=>{let h=2166136261;for(const ch of clean(v)){h^=ch.codePointAt(0);h=Math.imul(h,16777619)>>>0;}return h.toString(16).padStart(8,'0');};
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
    return {ok:true,classification,provenance,canonicalProvenance:canonical,receiptFingerprint:fp(JSON.stringify(receipt))};
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
      } else rejected.push({reason:q.reason,receiptFingerprint:fp(JSON.stringify(receipt||null))});
    }
    if(!qualified.length) return {status:'HOLD',reason:'qualifying-gut-contamination-triage-required',parent:{targetRef:parent.targetRef,clauseRef:parent.clauseRef,lens:parent.lens,status:parent.status},facets:[],rejected,replaySuppression:{duplicateReplayCount},boundary:'Absence or rejection of a GUT triage receipt cannot change VAJRA decomposition behavior. Exact replay suppression cannot create qualifying evidence when no unique qualifying receipt remains.'};

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
        schema:'zenomorph-vajra-dynamic-decomposition/v0.5',
        status:'HOLD',
        reason:'conflicting-qualifying-gut-triage-receipts',
        parent:{targetRef:parent.targetRef,clauseRef:parent.clauseRef,lens:parent.lens,status:parent.status,closed:false},
        facets:[],
        conflict:{
          signatures:signatureAudit,
          qualifyingReceiptCount:qualified.length
        },
        replaySuppression:{duplicateReplayCount},
        rejected,
        boundary:'Multiple unique qualifying GUT triage receipts that disagree on classification or canonical provenance cannot be resolved by array order. Exact receipt replays are suppressed before conflict counting so transport retries cannot inflate evidential multiplicity. Surface-form aliases of one canonical provenance remain traceable and are not treated as independent disagreement. Conflict evidence is emitted in deterministic signature order so receipt arrival order cannot acquire false procedural significance. VAJRA must preserve the parent conflict and request further inspection rather than manufacture certainty.'
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
      schema:'zenomorph-vajra-dynamic-decomposition/v0.5',
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
      replaySuppression:{duplicateReplayCount},
      rejected,
      boundary:'Dynamic decomposition is a reversible routing/inspection plan. Exact qualifying receipt replays are suppressed before evidence counting and retained as explicit rejected replay audit entries, preventing metabolic echo from masquerading as evidence multiplicity. The legacy triageProvenance field remains present for contract compatibility while fingerprint and alias audit provide stable replay-resistant evidence identity. Canonical provenance aliases with distinct receipt fingerprints remain traceable as one structural source identity for decomposition agreement. The contested parent remains open; this does not decide which receipt is true, prove source independence, or claim GUT or MUTHER executed the generated facets.'
    };
  }

  api.qualifyContaminationTriageReceipt=qualifyTriageReceipt;
  api.planConflictDecomposition=planConflictDecomposition;
  api.dynamicDecompositionVersion='0.5';
})(typeof window!=='undefined'?window:globalThis);
