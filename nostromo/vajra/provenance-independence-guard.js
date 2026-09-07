/* VAJRA provenance-independence guard v0.1 — prevent one source from masquerading as independent opposing evidence */
(function(root){
  const api=root.VajraEngine;
  if(!api||typeof api.applyHandoffResults!=='function'||typeof api.canonicalEvidenceProvenance!=='function'||typeof api.relationPolarity!=='function'){
    throw new Error('VajraEngine provenance helpers must be loaded before provenance-independence-guard');
  }
  if(api.applyHandoffResults.__provenanceIndependenceGuard) return;

  const baseApply=api.applyHandoffResults;
  const clean=v=>String(v??'').replace(/\s+/g,' ').trim();
  function fingerprint(text){
    let h=2166136261;
    for(const ch of clean(text)){h^=ch.codePointAt(0);h=Math.imul(h,16777619)>>>0;}
    return h.toString(16).padStart(8,'0');
  }
  function provenanceOf(r){return clean(r?.provenance||r?.provenanceFingerprint||r?.sourceFingerprint||r?.fingerprint);}
  function branchKey(r){
    return [clean(r?.targetRef),clean(r?.clauseRef),clean(r?.lens),clean(r?.organ||r?.sourceOrgan)].join('|');
  }
  function auditReceipt(r,reasons){
    const provenance=provenanceOf(r);
    return {
      targetRef:clean(r?.targetRef),
      clauseRef:clean(r?.clauseRef),
      lens:clean(r?.lens),
      organ:clean(r?.organ||r?.sourceOrgan),
      provenanceFingerprint:provenance?fingerprint(api.canonicalEvidenceProvenance(provenance)):null,
      receiptFingerprint:fingerprint(JSON.stringify(r||{})),
      reasons:[...reasons]
    };
  }

  function wrapped(vajraResult,receipts=[]){
    const incoming=Array.isArray(receipts)?receipts:[];
    const groups=new Map();
    const passthrough=[];

    incoming.forEach((r,index)=>{
      const provenance=provenanceOf(r);
      if(!r||typeof r!=='object'||!provenance){passthrough.push({r,index});return;}
      const canonical=api.canonicalEvidenceProvenance(provenance);
      const key=`${branchKey(r)}|${canonical}`;
      if(!groups.has(key))groups.set(key,[]);
      groups.get(key).push({r,index,canonical});
    });

    const accepted=[...passthrough];
    const withheld=[];
    const sourceContradictions=[];

    for(const entries of groups.values()){
      entries.sort((a,b)=>a.index-b.index);
      if(entries.length===1){accepted.push(entries[0]);continue;}
      const polarities=new Set(entries.map(x=>api.relationPolarity(clean(x.r?.relation||x.r?.relationToTarget||x.r?.assessment))));
      const sourceInternalConflict=(polarities.has('SUPPORTS')&&polarities.has('REFUTES'))||polarities.has('MIXED');
      if(sourceInternalConflict){
        const first=entries[0];
        const record={
          targetRef:clean(first.r?.targetRef),
          clauseRef:clean(first.r?.clauseRef),
          lens:clean(first.r?.lens),
          organ:clean(first.r?.organ||first.r?.sourceOrgan),
          provenanceFingerprint:fingerprint(first.canonical),
          polarities:[...polarities].sort(),
          receiptCount:entries.length,
          status:'SOURCE_INTERNAL_CONTRADICTION'
        };
        sourceContradictions.push(record);
        for(const e of entries)withheld.push(auditReceipt(e.r,['SOURCE_INTERNAL_CONTRADICTION_SAME_PROVENANCE']));
        continue;
      }
      accepted.push(entries[0]);
      for(const e of entries.slice(1))withheld.push(auditReceipt(e.r,['DUPLICATE_PROVENANCE_WITHIN_BRANCH']));
    }

    accepted.sort((a,b)=>a.index-b.index);
    const out=baseApply(vajraResult,accepted.map(x=>x.r));
    const prior=out?.handoffResolution||{};
    const priorRejected=Array.isArray(prior.rejectedReceipts)?prior.rejectedReceipts:[];
    return {
      ...out,
      handoffResolution:{
        ...prior,
        received:incoming.length,
        rejected:(Number(prior.rejected)||0)+withheld.length,
        rejectedReceipts:[...priorRejected,...withheld]
      },
      provenanceIndependence:{
        version:'0.1',
        inspected:incoming.length,
        admittedToBase:accepted.length,
        withheld:withheld.length,
        duplicateProvenance:withheld.filter(x=>x.reasons.includes('DUPLICATE_PROVENANCE_WITHIN_BRANCH')).length,
        sourceContradictions,
        boundary:'Receipts sharing canonical provenance inside the same clause-scoped handoff are not independent evidence. Same-source opposing relations are quarantined as a source-internal contradiction and cannot create an inter-source contest or dynamic escalation. Same-source duplicate relations admit one receipt and audit the rest. This is structural provenance control, not semantic source identity, truth adjudication, or proof that differently named sources are independent.'
      }
    };
  }

  wrapped.__provenanceIndependenceGuard=true;
  api.applyHandoffResults=wrapped;
})(typeof window!=='undefined'?window:globalThis);
