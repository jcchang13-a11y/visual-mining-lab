/* VAJRA dynamic reinspection capability v0.5 — receipt feedback changes next inspection priority without altering source evidence; terminal quarantine cannot starve unrelated runnable contested branches */
(function(root){
  const api=root.VajraEngine;
  if(!api||typeof api.applyHandoffResults!=='function') throw new Error('VajraEngine must be loaded before dynamic-reinspection');
  if(api.applyHandoffResults.__dynamicReinspection) return;
  const baseApply=api.applyHandoffResults;
  const runnableContestPriority=lens=>lens==='source_quality'?2:1;

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
      provenancePolicy:'Preserve every contest evidence key, receipt provenance, source-quality inspection record, and metabolic-contamination triage record. Quarantine is a containment state, not adjudication.',
      boundary:'Repeated metabolic contest must not automatically route back to DROPLET or GUT. HOLD does not decide which receipt is true, does not discard either side, and does not authorize capability incorporation. A quarantined branch is locally contained and must not starve unrelated runnable contested branches.'
    };
  }

  function selectNextInspection(result){
    const branches=Array.isArray(result?.unresolved)?result.unresolved:[];
    const contested=branches.map((branch,index)=>({branch,index})).filter(x=>x.branch?.status==='CONTESTED_BY_RECEIPTS');
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
    return {...out,nextInspection,dynamicReinspection:{version:'0.5',triggered:['CONTESTED_RETURN','REPEATED_SOURCE_CONTEST','REPEATED_METABOLIC_CONTEST'].includes(nextInspection?.trigger),quarantineDeferred,policy:'RUNNABLE_CONFLICT_FIRST_WITH_LOCAL_QUARANTINE_ECHO_BREAK',boundary:'A qualifying inter-organ receipt conflict changes VAJRA next-step behavior. Repeated metabolic_contamination conflict is locally quarantined and preserved, but terminal quarantine is not runnable work and therefore cannot starve unrelated contested branches. Among runnable contests, source_quality outranks generic contested lenses and equal-priority branches retain stable source order. First conflict routes to clause-scoped source-quality inspection; a conflict already at source_quality is diverted to GUT contamination triage; if no other runnable contested branch exists, a repeated metabolic_contamination conflict becomes provenance-preserving HOLD/quarantine. Missing, malformed, replayed, or otherwise rejected receipts cannot trigger escalation.'}};
  }
  wrapped.__dynamicReinspection=true;
  api.applyHandoffResults=wrapped;
  api.selectNextInspection=selectNextInspection;
})(typeof window!=='undefined'?window:globalThis);
