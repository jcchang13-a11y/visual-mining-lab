/* VAJRA dynamic reinspection capability v0.7 — receipt feedback changes next inspection priority without altering source evidence; terminal quarantine cannot starve unrelated runnable contested branches; quarantine may reopen only on explicit post-quarantine novelty proven by one aligned evidence item whose key and fingerprint are both novel */
(function(root){
  const api=root.VajraEngine;
  if(!api||typeof api.applyHandoffResults!=='function') throw new Error('VajraEngine must be loaded before dynamic-reinspection');
  if(api.applyHandoffResults.__dynamicReinspection) return;
  const baseApply=api.applyHandoffResults;
  const runnableContestPriority=lens=>lens==='source_quality'?2:1;

  function normalizedSet(values){
    return new Set((Array.isArray(values)?values:[]).filter(v=>typeof v==='string'&&v.length));
  }

  function normalizedArray(values){
    return (Array.isArray(values)?values:[]).filter(v=>typeof v==='string'&&v.length);
  }

  function quarantineNovelty(branch){
    const baselineKeyList=normalizedArray(branch?.quarantineBaselineEvidenceKeys);
    const baselineFingerprintList=normalizedArray(branch?.quarantineBaselineFingerprints);
    const currentKeyList=normalizedArray(branch?.evidenceKeys);
    const currentFingerprintList=normalizedArray(branch?.evidenceFingerprints);
    const baselineKeys=new Set(baselineKeyList);
    const baselineFingerprints=new Set(baselineFingerprintList);
    const hasExplicitBaseline=baselineKeyList.length>0&&baselineFingerprintList.length>0;
    const pairingValid=hasExplicitBaseline&&baselineKeyList.length===baselineFingerprintList.length&&currentKeyList.length===currentFingerprintList.length;
    const novelKeys=currentKeyList.filter(v=>!baselineKeys.has(v));
    const novelFingerprints=currentFingerprintList.filter(v=>!baselineFingerprints.has(v));
    const novelPairs=[];
    if(pairingValid){
      for(let i=0;i<currentKeyList.length;i++){
        const key=currentKeyList[i],fingerprint=currentFingerprintList[i];
        if(!baselineKeys.has(key)&&!baselineFingerprints.has(fingerprint)) novelPairs.push({key,fingerprint,index:i});
      }
    }
    return {
      hasExplicitBaseline,
      pairingValid,
      novelKeys,
      novelFingerprints,
      novelPairs,
      qualifies:pairingValid&&novelPairs.length>0
    };
  }

  function quarantineInspection(contested){
    return {
      trigger:'REPEATED_METABOLIC_CONTEST',
      targetRef:contested.targetRef,
      clauseRef:contested.clauseRef,
      priorLens:contested.lens,
      lens:'quarantine_review',
      preferredOrgan:null,
      status:'HOLD',
      reason:'A branch remains contested after both source-quality inspection and GUT metabolic-contamination triage. Routing it back to DROPLET or GUT would create a two-organ echo without adding a new diagnostic state, so VAJRA quarantines the branch until genuinely new evidence or an explicit later review policy is available.',
      provenancePolicy:'Preserve every contest evidence key, evidence fingerprint, receipt provenance, source-quality inspection record, and metabolic-contamination triage record. Quarantine is a containment state, not adjudication. Any later reactivation must compare aligned evidence key/fingerprint pairs against an explicit quarantine baseline.',
      boundary:'Repeated metabolic contest must not automatically route back to DROPLET or GUT. HOLD does not decide which receipt is true, does not discard either side, and does not authorize capability incorporation. A quarantined branch is locally contained and must not starve unrelated runnable contested branches.'
    };
  }

  function reactivatedInspection(contested,novelty){
    return {
      trigger:'NOVEL_POST_QUARANTINE_EVIDENCE',
      targetRef:contested.targetRef,
      clauseRef:contested.clauseRef,
      priorLens:contested.lens,
      lens:'source_quality',
      preferredOrgan:'DROPLET',
      status:'OPEN',
      reason:'A previously quarantined metabolic contest now contains at least one aligned evidence item whose identity and content fingerprint are both novel relative to the explicit quarantine baseline. VAJRA reopens only clause-scoped source-quality inspection so the new material can be checked without treating novelty as truth.',
      provenancePolicy:'Preserve the quarantine baseline, every prior contest/triage record, and the newly observed aligned evidence key/fingerprint pairs. Reactivation records information gain but does not claim source independence, correctness, or resolution.',
      novelty:{novelEvidenceKeys:novelty.novelKeys,novelEvidenceFingerprints:novelty.novelFingerprints,novelEvidencePairs:novelty.novelPairs},
      boundary:'Reactivation requires one aligned evidence item with both a new evidence key and a new evidence fingerprint relative to explicit aligned baseline arrays. Split novelty across different items, a new key with an old fingerprint, a new fingerprint with an old key, replay, duplicate aliases, missing baseline, or misaligned pairing data stays quarantined. Reopening does not erase the prior HOLD and does not authorize capability incorporation.'
    };
  }

  function selectNextInspection(result){
    const branches=Array.isArray(result?.unresolved)?result.unresolved:[];
    const contested=branches.map((branch,index)=>({branch,index})).filter(x=>x.branch?.status==='CONTESTED_BY_RECEIPTS');

    const reactivated=contested
      .filter(x=>x.branch?.lens==='metabolic_contamination')
      .map(x=>({...x,novelty:quarantineNovelty(x.branch)}))
      .filter(x=>x.novelty.qualifies)
      .sort((a,b)=>a.index-b.index)[0];
    if(reactivated) return reactivatedInspection(reactivated.branch,reactivated.novelty);

    const runnable=contested
      .filter(x=>x.branch?.lens!=='metabolic_contamination')
      .map(x=>({...x,priority:runnableContestPriority(x.branch?.lens)}))
      .sort((a,b)=>b.priority-a.priority||a.index-b.index)[0]?.branch;

    if(runnable){
      if(runnable.lens==='source_quality'){
        return {
          trigger:'REPEATED_SOURCE_CONTEST',
          targetRef:runnable.targetRef,
          clauseRef:runnable.clauseRef,
          priorLens:runnable.lens,
          lens:'metabolic_contamination',
          preferredOrgan:'GUT',
          status:'OPEN',
          reason:'Source-quality reinspection returned an unresolved qualifying conflict. Repeating the same DROPLET route risks metabolic echo, so the branch is diverted to GUT for isolation, duplicate/provenance inspection, and contamination triage before any further external search.',
          provenancePolicy:'Preserve every contest evidence key, receipt provenance, and prior source-quality inspection record. Diversion is a containment/routing decision, not adjudication.',
          boundary:'Repeated source-quality conflict must not recursively schedule the same source-quality route. GUT may isolate or re-route the material but this capability does not decide which receipt is true. Existing quarantined branches remain preserved but cannot monopolize nextInspection scheduling.'
        };
      }
      return {
        trigger:'CONTESTED_RETURN',
        targetRef:runnable.targetRef,
        clauseRef:runnable.clauseRef,
        priorLens:runnable.lens,
        lens:'source_quality',
        preferredOrgan:'DROPLET',
        status:'OPEN',
        reason:'Opposing qualifying receipts require source-independence and method-quality inspection before the disputed branch may close.',
        provenancePolicy:'Preserve all contest evidence keys and provenance; escalation is a routing decision, not adjudication.',
        boundary:'Dynamic reprioritization is deterministic and structural. It does not decide which receipt is true and does not erase the contested branch. Existing quarantined branches remain contained without starving runnable work.'
      };
    }

    const quarantined=contested.find(x=>x.branch?.lens==='metabolic_contamination')?.branch;
    if(quarantined) return quarantineInspection(quarantined);

    const open=branches.find(b=>b?.status==='UNRESOLVED');
    if(open){
      return {
        trigger:'OPEN_BRANCH',
        targetRef:open.targetRef,
        clauseRef:open.clauseRef,
        priorLens:open.lens,
        lens:open.lens,
        preferredOrgan:open?.handoff?.preferredOrgan||null,
        status:'OPEN',
        reason:'Continue the earliest unresolved clause-scoped inspection contract.',
        boundary:'No dynamic escalation was triggered because no structurally qualifying conflict is present.'
      };
    }
    return null;
  }

  function wrapped(vajraResult,receipts=[]){
    const out=baseApply(vajraResult,receipts);
    const nextInspection=selectNextInspection(out);
    const unresolved=Array.isArray(out?.unresolved)?out.unresolved:[];
    const quarantineDeferred=unresolved.filter(b=>b?.status==='CONTESTED_BY_RECEIPTS'&&b?.lens==='metabolic_contamination').map(b=>({targetRef:b.targetRef,clauseRef:b.clauseRef,lens:b.lens,status:'HOLD'}));
    return {...out,nextInspection,dynamicReinspection:{version:'0.7',triggered:['CONTESTED_RETURN','REPEATED_SOURCE_CONTEST','REPEATED_METABOLIC_CONTEST','NOVEL_POST_QUARANTINE_EVIDENCE'].includes(nextInspection?.trigger),quarantineDeferred,policy:'RUNNABLE_CONFLICT_FIRST_WITH_PAIR_BOUND_PROVENANCE_GATED_QUARANTINE_REACTIVATION',boundary:'A qualifying inter-organ receipt conflict changes VAJRA next-step behavior. Repeated metabolic_contamination conflict is locally quarantined and preserved. Quarantine can become runnable again only when explicit aligned baseline comparison proves at least one evidence item whose key and content fingerprint are both previously unseen. Split novelty across different items, key-only aliases, fingerprint-only drift, replay, duplicate pollution, missing baseline, or misaligned pairing data cannot reopen it. Reactivation returns only to clause-scoped DROPLET source-quality inspection and does not treat novelty as truth. Terminal quarantine cannot starve unrelated contested branches. Missing, malformed, replayed, or otherwise rejected receipts cannot trigger escalation.'}};
  }
  wrapped.__dynamicReinspection=true;
  api.applyHandoffResults=wrapped;
  api.selectNextInspection=selectNextInspection;
  api.quarantineNovelty=quarantineNovelty;
})(typeof window!=='undefined'?window:globalThis);
