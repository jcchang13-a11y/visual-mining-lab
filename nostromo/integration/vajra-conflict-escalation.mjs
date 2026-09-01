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
    returnContract:{
      required:['packetId','sourceOrgan','targetRef','clauseRef','status','provenance','material','relation'],
      status:'EXECUTED',
      closureAuthority:'NONE',
      boundary:'A qualifying return supplies auditable adjudication material only. It cannot certify truth or close the contested branch.'
    },
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
    organ:'VAJRA',capability:'CONFLICT_ESCALATION',version:'0.2.0',
    status:invalid.length?'CONFLICT_ESCALATION_WITH_QUARANTINE':escalations.length?'CONFLICT_ESCALATION_REQUIRED':'NO_CONTEST',
    contestedBranches:branches.length,escalatedBranches:escalations.length,quarantinedBranches:invalid.length,
    closureBlocked:branches.length>0,
    resolutionPolicy:'MULTI_ORGAN_ADJUDICATION_REQUIRED_NO_AUTOMATIC_TRUTH_CLOSURE',
    escalations,quarantine:invalid,
    boundary:'Deterministic structural escalation and guarded return-contract generation only. It preserves contested VAJRA branches and turns them into explicit DROPLET/MUTHER/SHROOMING work contracts. It does not weigh truth, infer real-world source independence, or resolve conflict automatically.'
  };
}

function returnMaterial(v){return clean(v?.material||v?.summary||v?.result||v?.evidence);}
function returnRelation(v){return clean(v?.relation||v?.relationToTarget||v?.assessment);}
function returnProvenance(v){return clean(v?.provenance||v?.provenanceFingerprint||v?.sourceFingerprint||v?.fingerprint);}
function substantive(text,min){const s=clean(text).normalize('NFKC').toLowerCase();if(s.length<min)return false;return !/^(done|checked|ok|complete|completed|returned|see above|已完成|已檢查|完成|有證據|證據已返回)$/i.test(s);}
function packetIndex(escalation){
  const map=new Map();
  for(const branch of escalation?.escalations||[])for(const p of branch?.packets||[])if(p?.packetId)map.set(clean(p.packetId),p);
  return map;
}

export function ingestConflictEscalationReturns(escalation,returns=[]){
  const packets=packetIndex(escalation),accepted=[],quarantine=[],seen=new Set();
  for(const raw of Array.isArray(returns)?returns:[]){
    const packetId=clean(raw?.packetId),sourceOrgan=clean(raw?.sourceOrgan||raw?.organ),targetRef=clean(raw?.targetRef),clauseRef=clean(raw?.clauseRef),status=clean(raw?.status),provenance=returnProvenance(raw),material=returnMaterial(raw),relation=returnRelation(raw);
    const packet=packets.get(packetId),reasons=[];
    if(!packetId||!packet)reasons.push('UNKNOWN_PACKET');
    if(packet&&sourceOrgan!==clean(packet.targetOrgan))reasons.push('WRONG_RETURNING_ORGAN');
    if(packet&&targetRef!==clean(packet.targetRef))reasons.push('TARGET_REF_MISMATCH');
    if(packet&&clauseRef!==clean(packet.clauseRef))reasons.push('CLAUSE_REF_MISMATCH');
    if(status!=='EXECUTED')reasons.push('NOT_EXECUTED');
    if(!provenance)reasons.push('PROVENANCE_REQUIRED');
    if(!substantive(material,24))reasons.push('INSUFFICIENT_RETURN_MATERIAL');
    if(!substantive(relation,12))reasons.push('INSUFFICIENT_TARGET_RELATION');
    const returnKey=fp(`${packetId}|${sourceOrgan}|${provenance}|${material}|${relation}`);
    if(seen.has(returnKey))reasons.push('REPLAY_DUPLICATE');
    if(reasons.length){quarantine.push({packetId,sourceOrgan,targetRef,clauseRef,status:'QUARANTINED_RETURN',reasons:[...new Set(reasons)],returnKey});continue;}
    seen.add(returnKey);
    accepted.push({
      packetId,sourceOrgan,targetRef,clauseRef,lens:packet.lens,purpose:packet.purpose,status:'ACCEPTED_RETURN',
      provenance,material,relation,returnKey,
      closureAuthority:'NONE',
      receipt:{targetRef,clauseRef,lens:packet.lens,organ:sourceOrgan,status:'EXECUTED',provenance,material,relation,packetId,closureAuthority:'NONE'},
      boundary:'Accepted as packet-correlated adjudication material only; this acceptance is not factual verification and grants no truth-closure authority.'
    });
  }
  const expected=[...packets.keys()],returned=new Set(accepted.map(x=>x.packetId)),missing=expected.filter(id=>!returned.has(id));
  const byOrgan=accepted.reduce((m,x)=>(m[x.sourceOrgan]=(m[x.sourceOrgan]||0)+1,m),{});
  return {
    organ:'VAJRA',capability:'CONFLICT_ESCALATION_RETURN_INTAKE',version:'0.1.0',
    status:quarantine.length?'RETURNS_ACCEPTED_WITH_QUARANTINE':accepted.length?'RETURNS_ACCEPTED_REVIEW_REQUIRED':'NO_QUALIFYING_RETURNS',
    closureBlocked:Boolean(escalation?.closureBlocked),
    closureAuthority:'NONE',
    expectedPackets:expected.length,acceptedReturns:accepted.length,quarantinedReturns:quarantine.length,missingPacketIds:missing,
    allPacketsReturned:expected.length>0&&missing.length===0,
    byOrgan,accepted,quarantine,
    next:'Feed accepted receipt objects back into VAJRA receipt guards; keep the contested branch open unless those guards independently establish a structurally qualifying resolution. Return intake itself never settles truth.',
    boundary:'Deterministic packet-correlation and return-quality guard. It blocks scope loss, wrong-organ substitution, replay duplicates, provenance-less returns and placeholder material. Even a complete three-organ return set remains REVIEW_REQUIRED and cannot close a contested VAJRA branch by itself.'
  };
}
