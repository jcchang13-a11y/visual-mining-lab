/* VAJRA dynamic decomposition v1.3 — diagnostic replay identity is bound to target + clause + canonical organ + canonical provenance + triage classification, so decorative receipt changes cannot manufacture extra metabolic diagnoses. Existing organ-identity canonicalization, target qualification, classification-regulated decomposition, provenance containment, and conflict HOLD behavior remain bounded. */
(function(root){
  const api=root.VajraEngine;
  if(!api||typeof api.selectNextInspection!=='function') throw new Error('VajraEngine + dynamic-reinspection must be loaded before dynamic-decomposition');

  const TRIAGE_CLASSES=new Set(['PROVENANCE_COLLISION','DUPLICATE_CONTAMINATION','MIXED_CONTAMINATION']);
  const NON_EVIDENTIAL_TRANSPORT_KEYS=new Set(['receivedAt','received_at','attempt','retry','traceId','trace_id','transportId','transport_id','deliveryId','delivery_id']);
  const clean=v=>String(v??'').replace(/\s+/g,' ').trim();
  const fp=v=>{let h=2166136261;for(const ch of clean(v)){h^=ch.codePointAt(0);h=Math.imul(h,16777619)>>>0;}return h.toString(16).padStart(8,'0');};
  const canonicalOrgan=v=>clean(v).normalize('NFKC').toUpperCase();
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
  const diagnosticFingerprint=(targetRef,clauseRef,organCanonical,provenanceCanonical,classification)=>fp([clean(targetRef),clean(clauseRef),clean(organCanonical),clean(provenanceCanonical),clean(classification)].join('\u001f'));

  function organIdentity(receipt){
    const primary=clean(receipt?.organ),alias=clean(receipt?.sourceOrgan);
    const primaryCanonical=canonicalOrgan(primary),aliasCanonical=canonicalOrgan(alias);
    if(primaryCanonical&&aliasCanonical&&primaryCanonical!==aliasCanonical){
      return {ok:false,reason:'organ-alias-conflict',declared:{organ:primary,sourceOrgan:alias},canonical:{organ:primaryCanonical,sourceOrgan:aliasCanonical}};
    }
    const canonical=primaryCanonical||aliasCanonical;
    if(!canonical) return {ok:false,reason:'organ-required'};
    return {ok:true,canonical,declared:{organ:primary||null,sourceOrgan:alias||null}};
  }

  function qualifyTriageReceipt(branch,receipt){
    if(!branch||!receipt||typeof receipt!=='object') return {ok:false,reason:'missing-branch-or-receipt'};
    const targetRef=clean(receipt.targetRef),clauseRef=clean(receipt.clauseRef),status=clean(receipt.status),provenance=clean(receipt.provenance||receipt.provenanceFingerprint),classification=clean(receipt.triageClassification||receipt.classification).toUpperCase();
    if(targetRef!==clean(branch.targetRef)||clauseRef!==clean(branch.clauseRef)) return {ok:false,reason:'scope-mismatch'};
    const organ=organIdentity(receipt);
    if(!organ.ok) return {ok:false,reason:organ.reason,organIdentity:organ};
    if(organ.canonical!=='GUT') return {ok:false,reason:'gut-receipt-required',organIdentity:organ};
    if(status!=='COMPLETED') return {ok:false,reason:'completed-receipt-required'};
    if(!provenance) return {ok:false,reason:'provenance-required'};
    if(!TRIAGE_CLASSES.has(classification)) return {ok:false,reason:'non-decomposing-triage-class'};
    const canonical=canonicalProvenance(provenance);
    if(!canonical) return {ok:false,reason:'canonical-provenance-empty'};
    return {ok:true,classification,provenance,canonicalProvenance:canonical,receiptFingerprint:receiptFingerprint(receipt),diagnosticFingerprint:diagnosticFingerprint(targetRef,clauseRef,organ.canonical,canonical,classification),organIdentity:organ};
  }

  function auditQualifiedAliases(qualified){
    return qualified.map(item=>({provenance:item.q.provenance,provenanceFingerprint:fp(item.q.canonicalProvenance),diagnosticFingerprint:item.q.diagnosticFingerprint,receiptFingerprint:item.q.receiptFingerprint,organIdentity:item.q.organIdentity.canonical})).sort((a,b)=>a.provenanceFingerprint.localeCompare(b.provenanceFingerprint)||a.diagnosticFingerprint.localeCompare(b.diagnosticFingerprint)||a.receiptFingerprint.localeCompare(b.receiptFingerprint)||a.provenance.localeCompare(b.provenance));
  }
  function replayAudit(duplicateReplayCount){return {duplicateReplayCount,identity:'targetRef+clauseRef+canonical-organ+canonical-provenance+triage-classification',rawReceiptAudit:'stable-recursive-object-key-order+bounded-top-level-transport-projection',ignoredTopLevelTransportKeys:[...NON_EVIDENTIAL_TRANSPORT_KEYS].sort()};}

  function facetsForClassification(parent,classification,shared){
    const sourceIdentity={...shared,facetId:`${parent.clauseRef}:identity`,lens:'source_identity',preferredOrgan:'GUT',need:'isolate alias/provenance-collision structure without adjudicating claim truth',reason:'Provenance collision keeps source identity as a separate unresolved structural question.'};
    const duplicateCluster={...shared,facetId:`${parent.clauseRef}:duplicates`,lens:'duplicate_cluster',preferredOrgan:'GUT',need:'isolate replay/duplication structure and determine which copies must not count as independent evidence',reason:'Duplicate contamination requires explicit duplicate clustering before evidential relations are reconstructed.'};
    const claimRelation={...shared,facetId:`${parent.clauseRef}:relation`,lens:'claim_relation',preferredOrgan:'MUTHER',need:'re-evaluate how surviving material relates to the clause after contaminated copies are not counted as independent support/opposition',reason:'Source contamination changes the evidential relation that must be reconstructed from retained provenance.'};
    if(classification==='PROVENANCE_COLLISION') return [sourceIdentity,claimRelation];
    if(classification==='DUPLICATE_CONTAMINATION') return [duplicateCluster,claimRelation];
    if(classification==='MIXED_CONTAMINATION') return [sourceIdentity,duplicateCluster,claimRelation];
    return [];
  }

  function selectTargetParent(branches,receipts){
    const parents=branches.filter(b=>b?.status==='CONTESTED_BY_RECEIPTS'&&b?.lens==='source_quality');
    if(!parents.length) return {status:'NONE',parents:[]};
    if(parents.length===1) return {status:'SELECTED',parent:parents[0],parents};
    const matched=new Map();
    for(const receipt of Array.isArray(receipts)?receipts:[]){
      for(const parent of parents){
        const q=qualifyTriageReceipt(parent,receipt);
        if(q.ok) matched.set(`${clean(parent.targetRef)}\u0000${clean(parent.clauseRef)}`,parent);
      }
    }
    if(matched.size===1) return {status:'SELECTED',parent:[...matched.values()][0],parents};
    if(matched.size>1) return {status:'MULTIPLE',parents:[...matched.values()]};
    return {status:'AMBIGUOUS',parents};
  }

  function planConflictDecomposition(result,receipts=[]){
    const branches=Array.isArray(result?.unresolved)?result.unresolved:[];
    const targetSelection=selectTargetParent(branches,receipts);
    if(targetSelection.status==='NONE') return {status:'NO_DECOMPOSITION',reason:'no-contested-source-quality-parent',facets:[],rejected:[]};
    if(targetSelection.status==='MULTIPLE') return {schema:'zenomorph-vajra-dynamic-decomposition/v1.3',status:'HOLD',reason:'multiple-contested-parents-targeted',parents:targetSelection.parents.map(p=>({targetRef:p.targetRef,clauseRef:p.clauseRef,lens:p.lens,status:p.status,closed:false})),facets:[],rejected:[],boundary:'One bounded decomposition call may regulate only one contested parent. Only qualifying completed GUT contamination-triage receipts can establish target multiplicity; receipts targeting more than one parent then HOLD and require separate parent-scoped decomposition passes.'};
    if(targetSelection.status==='AMBIGUOUS') return {schema:'zenomorph-vajra-dynamic-decomposition/v1.3',status:'HOLD',reason:'targeted-contested-source-quality-parent-required',parents:targetSelection.parents.map(p=>({targetRef:p.targetRef,clauseRef:p.clauseRef,lens:p.lens,status:p.status,closed:false})),facets:[],rejected:[],boundary:'When more than one contested source-quality parent is open, exactly one parent must be identified by qualifying completed GUT contamination-triage evidence. Non-GUT, incomplete, provenance-empty, unauthorized-classification, or organ-alias-conflicted receipts cannot manufacture target selection or multiplicity.'};
    const parent=targetSelection.parent;

    const rejected=[],qualified=[],seenDiagnosticFingerprints=new Set(); let duplicateReplayCount=0;
    for(const receipt of Array.isArray(receipts)?receipts:[]){
      const q=qualifyTriageReceipt(parent,receipt);
      if(q.ok){
        if(seenDiagnosticFingerprints.has(q.diagnosticFingerprint)){duplicateReplayCount++;rejected.push({reason:'duplicate-diagnostic-receipt-replay',diagnosticFingerprint:q.diagnosticFingerprint,receiptFingerprint:q.receiptFingerprint,provenanceFingerprint:fp(q.canonicalProvenance)});continue;}
        seenDiagnosticFingerprints.add(q.diagnosticFingerprint);qualified.push({receipt,q});
      } else rejected.push({reason:q.reason,receiptFingerprint:receiptFingerprint(receipt||null),organIdentity:q.organIdentity});
    }
    if(!qualified.length) return {schema:'zenomorph-vajra-dynamic-decomposition/v1.3',status:'HOLD',reason:'qualifying-gut-contamination-triage-required',parent:{targetRef:parent.targetRef,clauseRef:parent.clauseRef,lens:parent.lens,status:parent.status},facets:[],rejected,replaySuppression:replayAudit(duplicateReplayCount),boundary:'Absence or rejection of a GUT triage receipt cannot change VAJRA decomposition behavior. Bounded organ identity canonicalization accepts case/Unicode-equivalent GUT aliases but rejects contradictory organ/sourceOrgan declarations. Diagnostic replay suppression ignores decorative/schema payload changes and cannot create qualifying evidence when no unique diagnostic identity remains.'};

    const classifications=new Map();
    for(const item of qualified){if(!classifications.has(item.q.classification)) classifications.set(item.q.classification,[]);classifications.get(item.q.classification).push({provenanceFingerprint:fp(item.q.canonicalProvenance),diagnosticFingerprint:item.q.diagnosticFingerprint,receiptFingerprint:item.q.receiptFingerprint});}
    if(classifications.size>1){
      const classificationAudit=[...classifications.entries()].map(([classification,items])=>({classification,items:[...items].sort((a,b)=>a.provenanceFingerprint.localeCompare(b.provenanceFingerprint)||a.diagnosticFingerprint.localeCompare(b.diagnosticFingerprint)||a.receiptFingerprint.localeCompare(b.receiptFingerprint))})).sort((a,b)=>a.classification.localeCompare(b.classification));
      return {schema:'zenomorph-vajra-dynamic-decomposition/v1.3',status:'HOLD',reason:'conflicting-qualifying-gut-triage-classifications',parent:{targetRef:parent.targetRef,clauseRef:parent.clauseRef,lens:parent.lens,status:parent.status,closed:false},facets:[],conflict:{classifications:classificationAudit,qualifyingReceiptCount:qualified.length},replaySuppression:replayAudit(duplicateReplayCount),rejected,boundary:'Multiple unique qualifying GUT triage diagnoses HOLD only when their contamination classifications disagree. Same target, clause, organ, canonical provenance, and classification remain one diagnostic identity regardless of decorative receipt fields. Provenance inequality alone is not diagnostic disagreement and must not manufacture a conflict.'};
    }

    const canonicalRepresentative=[...qualified].sort((a,b)=>a.q.canonicalProvenance.localeCompare(b.q.canonicalProvenance)||a.q.classification.localeCompare(b.q.classification)||a.q.diagnosticFingerprint.localeCompare(b.q.diagnosticFingerprint)||a.q.receiptFingerprint.localeCompare(b.q.receiptFingerprint))[0];
    const aliasAudit=auditQualifiedAliases(qualified),distinctProvenanceCount=new Set(qualified.map(x=>x.q.canonicalProvenance)).size;
    const triageProvenanceFingerprints=[...new Set(qualified.map(x=>fp(x.q.canonicalProvenance)))].sort();
    const triageDiagnosticFingerprints=[...new Set(qualified.map(x=>x.q.diagnosticFingerprint))].sort();
    const shared={targetRef:parent.targetRef,clauseRef:parent.clauseRef,parentLens:parent.lens,parentStatus:parent.status,triageClassification:canonicalRepresentative.q.classification,triageProvenanceFingerprint:fp(canonicalRepresentative.q.canonicalProvenance),triageProvenanceFingerprints,triageDiagnosticFingerprints,triageProvenanceContributorCount:qualified.length,triageDistinctProvenanceCount:distinctProvenanceCount,status:'OPEN'};
    const facets=facetsForClassification(parent,canonicalRepresentative.q.classification,shared);
    if(!facets.length) return {schema:'zenomorph-vajra-dynamic-decomposition/v1.3',status:'HOLD',reason:'no-bounded-profile-for-qualified-classification',parent:{targetRef:parent.targetRef,clauseRef:parent.clauseRef,lens:parent.lens,status:parent.status,closed:false},facets:[],replaySuppression:replayAudit(duplicateReplayCount),rejected,boundary:'A qualifying receipt may not create downstream behavior unless VAJRA has an explicit bounded decomposition profile for that classification.'};
    return {schema:'zenomorph-vajra-dynamic-decomposition/v1.3',status:'DECOMPOSED',reason:'qualifying-gut-contamination-diagnostic-agreement-selected-bounded-profile',parent:{targetRef:parent.targetRef,clauseRef:parent.clauseRef,lens:parent.lens,status:parent.status,closed:false},facets,behaviorRegulation:{classification:canonicalRepresentative.q.classification,profileFingerprint:fp(facets.map(f=>`${f.lens}:${f.preferredOrgan}`).join('|')),facetCount:facets.length},provenance:{triageClassification:canonicalRepresentative.q.classification,triageProvenance:canonicalRepresentative.q.provenance,triageProvenanceFingerprint:fp(canonicalRepresentative.q.canonicalProvenance),triageProvenanceFingerprints,triageDiagnosticFingerprints,qualifyingReceiptCount:qualified.length,distinctProvenanceCount,canonicalAliasCount:qualified.filter(x=>x.q.canonicalProvenance===canonicalRepresentative.q.canonicalProvenance).length,aliasAudit,preservedTargetRef:parent.targetRef,preservedClauseRef:parent.clauseRef,organIdentity:canonicalRepresentative.q.organIdentity.canonical,independenceClaimed:false},replaySuppression:replayAudit(duplicateReplayCount),rejected,boundary:'Dynamic decomposition is a reversible routing/inspection plan. Completed qualifying GUT receipts that agree on one authorized contamination classification may jointly select that bounded VAJRA decomposition profile even when their provenance differs. Every generated facet carries the deterministic de-identified set of qualifying provenance and diagnostic fingerprints so cross-organ routing cannot thin the contributor history to one representative source. Same-scope same-provenance same-classification decorative receipt variants collapse to one diagnostic identity; a genuine classification change remains visible as conflict. Organ/sourceOrgan spelling or case may not change qualification when canonical identity agrees; contradictory dual declarations are rejected. Provenance differences remain audited and are never promoted as proof of source independence. The contested parent remains open, and this does not decide source truth, prove source independence, or claim any generated facet was executed.'};
  }

  api.qualifyContaminationTriageReceipt=qualifyTriageReceipt;
  api.planConflictDecomposition=planConflictDecomposition;
  api.dynamicDecompositionVersion='1.3';
})(typeof window!=='undefined'?window:globalThis);
