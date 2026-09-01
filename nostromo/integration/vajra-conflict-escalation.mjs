const clean=v=>String(v??'').replace(/\s+/g,' ').trim();
const fp=text=>{let h=2166136261;for(const ch of clean(text)){h^=ch.codePointAt(0);h=Math.imul(h,16777619)>>>0;}return h.toString(16).padStart(8,'0');};
const CONTEST='CONTESTED_BY_RECEIPTS';

function evidenceList(branch){
  const raw=branch?.contest?.evidence || branch?.evidence || [];
  return raw.map((e,i)=>({
    index:i,
    evidenceKey:clean(e?.evidenceKey),
    provenance:clean(e?.provenance),
    polarity:clean(e?.polarity),
    relation:clean(e?.relation)
  }));
}
function contestBranches(vajra){
  const fromUnresolved=(vajra?.unresolved||[]).filter(b=>b?.status===CONTEST || b?.contest?.status===CONTEST);
  if(fromUnresolved.length)return fromUnresolved;
  return (vajra?.handoffResolution?.contestedBranches||[]).map(c=>({
    lens:c.lens,targetRef:c.targetRef,clauseRef:c.clauseRef,status:CONTEST,contest:c
  }));
}
function packet(branch,evidence,targetOrgan,purpose,need){
  const targetRef=clean(branch?.targetRef||branch?.contest?.targetRef);
  const clauseRef=clean(branch?.clauseRef||branch?.contest?.clauseRef||targetRef);
  const lens=clean(branch?.lens||branch?.contest?.lens);
  const provenanceRefs=evidence.map(e=>e.provenance).filter(Boolean);
  const evidenceKeys=evidence.map(e=>e.evidenceKey).filter(Boolean);
  return {
    packetId:fp([targetRef,clauseRef,lens,targetOrgan,purpose,...provenanceRefs,...evidenceKeys].join('|')),
    sourceOrgan:'VAJRA',targetOrgan,targetRef,clauseRef,lens,purpose,need,
    evidenceKeys,provenanceRefs,
    status:'OPEN',
    closureAuthority:'NONE',
    boundary:'This packet requests adjudication material. It cannot resolve the VAJRA branch or certify truth by itself.'
  };
}
export function escalateVajraConflicts(vajra){
  const branches=contestBranches(vajra),escalations=[],invalid=[];
  for(const branch of branches){
    const targetRef=clean(branch?.targetRef||branch?.contest?.targetRef);
    const clauseRef=clean(branch?.clauseRef||branch?.contest?.clauseRef||targetRef);
    const lens=clean(branch?.lens||branch?.contest?.lens);
    const evidence=evidenceList(branch);
    const missing=[];
    if(!targetRef)missing.push('TARGET_REF');
    if(!clauseRef)missing.push('CLAUSE_REF');
    if(!lens)missing.push('LENS');
    if(evidence.length<2)missing.push('MULTI_EVIDENCE');
    if(evidence.some(e=>!e.provenance))missing.push('PROVENANCE');
    if(evidence.some(e=>!e.evidenceKey))missing.push('EVIDENCE_KEY');
    const polarities=new Set(evidence.map(e=>e.polarity));
    if(!(polarities.has('SUPPORTS')&&polarities.has('REFUTES')))missing.push('OPPOSING_POLARITY');
    if(missing.length){
      invalid.push({targetRef,clauseRef,lens,reasons:[...new Set(missing)],status:'QUARANTINED_CONTEST'});
      continue;
    }
    const packets=[
      packet(branch,evidence,'DROPLET','SOURCE_QUALITY_ADJUDICATION','Check source independence, freshness, method quality, derivative-source overlap, and whether the opposing evidence actually covers comparable conditions.'),
      packet(branch,evidence,'MUTHER','CONTEXT_AND_METHOD_AUDIT','Mine available source context, definitions, methods, and omitted qualifiers that could explain the disagreement without erasing either side.'),
      packet(branch,evidence,'SHROOMING','CRITERION_AND_BOUNDARY_STRESS','Generate competing criteria and boundary readings that would discriminate the opposing evidence positions, preserving unresolved disagreement.')
    ];
    escalations.push({targetRef,clauseRef,lens,status:'ESCALATION_REQUIRED',closureBlocked:true,evidence,packets});
  }
  return {
    organ:'VAJRA',capability:'CONFLICT_ESCALATION',version:'0.1.0',
    status:invalid.length?'CONFLICT_ESCALATION_WITH_QUARANTINE':escalations.length?'CONFLICT_ESCALATION_REQUIRED':'NO_CONTEST',
    contestedBranches:branches.length,escalatedBranches:escalations.length,quarantinedBranches:invalid.length,
    closureBlocked:branches.length>0,
    resolutionPolicy:'MULTI_ORGAN_ADJUDICATION_REQUIRED_NO_AUTOMATIC_TRUTH_CLOSURE',
    escalations,quarantine:invalid,
    boundary:'Deterministic structural escalation only. It preserves contested VAJRA branches and turns them into explicit DROPLET/MUTHER/SHROOMING work contracts. It does not weigh truth, infer real-world source independence, or resolve conflict automatically.'
  };
}
