const clean=v=>String(v??'').replace(/\s+/g,' ').trim();
const fp=text=>{let h=2166136261;for(const ch of clean(text)){h^=ch.codePointAt(0);h=Math.imul(h,16777619)>>>0;}return h.toString(16).padStart(8,'0');};
const CONTEST='CONTESTED_BY_RECEIPTS';
const CONTEXTUAL_CONTEST='CONTESTED_WITH_ADJUDICATION_CONTEXT';
const REQUIRED_ADJUDICATION_ORGANS=['DROPLET','MUTHER','SHROOMING'];

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
function contentBoundReturnKey(packetId,sourceOrgan,provenance,material,relation){return fp(`${clean(packetId)}|${clean(sourceOrgan)}|${clean(provenance)}|${clean(material)}|${clean(relation)}`);}
function historicalPacketState(history,packets){
  const candidateIds=[];
  if(Array.isArray(history?.acceptedPacketIds))candidateIds.push(...history.acceptedPacketIds);
  if(Array.isArray(history?.accepted))candidateIds.push(...history.accepted.map(x=>x?.packetId));
  if(Array.isArray(history?.returnLedger?.acceptedPacketIds))candidateIds.push(...history.returnLedger.acceptedPacketIds);
  const knownIds=new Set(),rejectedHistoricalIds=[];
  for(const rawId of candidateIds){
    const id=clean(rawId); if(!id)continue;
    if(packets.has(id))knownIds.add(id); else rejectedHistoricalIds.push(id);
  }
  const rawRecords=[];
  if(Array.isArray(history?.accepted))rawRecords.push(...history.accepted);
  if(Array.isArray(history?.returnLedger?.acceptedRecords))rawRecords.push(...history.returnLedger.acceptedRecords);
  const attested=new Map(),rejectedHistoricalRecords=[];
  for(const raw of rawRecords){
    const packetId=clean(raw?.packetId),packet=packets.get(packetId);
    const sourceOrgan=clean(raw?.sourceOrgan||raw?.organ),targetRef=clean(raw?.targetRef),clauseRef=clean(raw?.clauseRef),returnKey=clean(raw?.returnKey);
    const provenance=returnProvenance(raw),material=returnMaterial(raw),relation=returnRelation(raw);
    const reasons=[];
    if(!packetId||!packet)reasons.push('UNKNOWN_PACKET');
    if(packet&&sourceOrgan!==clean(packet.targetOrgan))reasons.push('WRONG_RETURNING_ORGAN');
    if(packet&&targetRef!==clean(packet.targetRef))reasons.push('TARGET_REF_MISMATCH');
    if(packet&&clauseRef!==clean(packet.clauseRef))reasons.push('CLAUSE_REF_MISMATCH');
    if(!/^[0-9a-f]{8}$/i.test(returnKey))reasons.push('RETURN_KEY_ATTESTATION_REQUIRED');
    if(!provenance)reasons.push('HISTORICAL_PROVENANCE_REQUIRED');
    if(!substantive(material,24))reasons.push('HISTORICAL_MATERIAL_REQUIRED');
    if(!substantive(relation,12))reasons.push('HISTORICAL_RELATION_REQUIRED');
    const recomputed=contentBoundReturnKey(packetId,sourceOrgan,provenance,material,relation);
    if(returnKey&&recomputed!==returnKey)reasons.push('RETURN_KEY_CONTENT_MISMATCH');
    if(reasons.length){rejectedHistoricalRecords.push({packetId,sourceOrgan,targetRef,clauseRef,reasons:[...new Set(reasons)]});continue;}
    knownIds.add(packetId);
    attested.set(packetId,{packetId,sourceOrgan,targetRef,clauseRef,returnKey,provenance,material,relation});
  }
  return {blockIds:knownIds,attested,rejectedHistoricalIds:[...new Set(rejectedHistoricalIds)],rejectedHistoricalRecords};
}
function acceptedRecord(x){return {packetId:clean(x?.packetId),sourceOrgan:clean(x?.sourceOrgan),targetRef:clean(x?.targetRef),clauseRef:clean(x?.clauseRef),returnKey:clean(x?.returnKey),provenance:returnProvenance(x),material:returnMaterial(x),relation:returnRelation(x)};}

export function ingestConflictEscalationReturns(escalation,returns=[],history={}){
  const packets=packetIndex(escalation),accepted=[],quarantine=[],seen=new Set(),seenPackets=new Set();
  const historical=historicalPacketState(history,packets),previouslyAccepted=historical.blockIds,previouslyAttested=new Set(historical.attested.keys());
  for(const raw of Array.isArray(returns)?returns:[]){
    const packetId=clean(raw?.packetId),sourceOrgan=clean(raw?.sourceOrgan||raw?.organ),targetRef=clean(raw?.targetRef),clauseRef=clean(raw?.clauseRef),status=clean(raw?.status),provenance=returnProvenance(raw),material=returnMaterial(raw),relation=returnRelation(raw);
    const packet=packets.get(packetId),reasons=[];
    if(!packetId||!packet)reasons.push('UNKNOWN_PACKET');
    if(packet&&sourceOrgan!==clean(packet.targetOrgan))reasons.push('WRONG_RETURNING_ORGAN');
    if(packet&&targetRef!==clean(packet.targetRef))reasons.push('TARGET_REF_MISMATCH');
    if(packet&&clauseRef!==clean(packet.clauseRef))reasons.push('CLAUSE_REF_MISMATCH');
    if(packet&&previouslyAccepted.has(packetId))reasons.push('PACKET_PREVIOUSLY_RETURNED');
    if(packet&&seenPackets.has(packetId))reasons.push('PACKET_ALREADY_RETURNED');
    if(status!=='EXECUTED')reasons.push('NOT_EXECUTED');
    if(!provenance)reasons.push('PROVENANCE_REQUIRED');
    if(!substantive(material,24))reasons.push('INSUFFICIENT_RETURN_MATERIAL');
    if(!substantive(relation,12))reasons.push('INSUFFICIENT_TARGET_RELATION');
    const returnKey=contentBoundReturnKey(packetId,sourceOrgan,provenance,material,relation);
    if(seen.has(returnKey))reasons.push('REPLAY_DUPLICATE');
    if(reasons.length){quarantine.push({packetId,sourceOrgan,targetRef,clauseRef,status:'QUARANTINED_RETURN',reasons:[...new Set(reasons)],returnKey});continue;}
    seen.add(returnKey);seenPackets.add(packetId);
    accepted.push({
      packetId,sourceOrgan,targetRef,clauseRef,lens:packet.lens,purpose:packet.purpose,status:'ACCEPTED_RETURN',
      provenance,material,relation,returnKey,
      closureAuthority:'NONE',
      receipt:{targetRef,clauseRef,lens:packet.lens,organ:sourceOrgan,status:'EXECUTED',provenance,material,relation,packetId,closureAuthority:'NONE'},
      boundary:'Accepted as packet-correlated adjudication material only; this acceptance is not factual verification and grants no truth-closure authority.'
    });
  }
  const expected=[...packets.keys()],returned=new Set(accepted.map(x=>x.packetId));
  const completedEvidence=new Set([...previouslyAttested,...returned]);
  const missing=expected.filter(id=>!completedEvidence.has(id));
  const byOrgan=accepted.reduce((m,x)=>(m[x.sourceOrgan]=(m[x.sourceOrgan]||0)+1,m),{});
  const acceptedPacketIds=[...new Set([...previouslyAccepted,...accepted.map(x=>x.packetId)])].sort();
  const acceptedRecords=[...historical.attested.values(),...accepted.map(acceptedRecord)].filter(x=>x.packetId).sort((a,b)=>a.packetId.localeCompare(b.packetId));
  const unattestedPacketIds=acceptedPacketIds.filter(id=>!completedEvidence.has(id));
  return {
    organ:'VAJRA',capability:'CONFLICT_ESCALATION_RETURN_INTAKE',version:'0.2.3',
    status:quarantine.length?'RETURNS_ACCEPTED_WITH_QUARANTINE':accepted.length?'RETURNS_ACCEPTED_REVIEW_REQUIRED':'NO_QUALIFYING_RETURNS',
    closureBlocked:Boolean(escalation?.closureBlocked),
    closureAuthority:'NONE',
    expectedPackets:expected.length,acceptedReturns:accepted.length,quarantinedReturns:quarantine.length,missingPacketIds:missing,
    allPacketsReturned:expected.length>0&&missing.length===0,
    byOrgan,accepted,quarantine,acceptedPacketIds,
    returnLedger:{acceptedPacketIds,acceptedRecords,previouslyAcceptedCount:previouslyAccepted.size,previouslyAttestedCount:previouslyAttested.size,newlyAcceptedCount:accepted.length,unattestedPacketIds,rejectedHistoricalIds:historical.rejectedHistoricalIds,rejectedHistoricalRecords:historical.rejectedHistoricalRecords},
    next:'Feed accepted receipt objects back into VAJRA conflict state as adjudication context; persist content-bound returnLedger.acceptedRecords as well as acceptedPacketIds between intakes. Bare packet IDs remain conservative replay blockers but cannot by themselves satisfy historical completion or allPacketsReturned. Keep the contested branch open and use returned organ differences to choose the next discriminating question.',
    boundary:'Deterministic packet-correlation, replay containment and content-bound history-attestation guard. Known bare acceptedPacketIds can conservatively block delayed replay, but historical completion requires packet scope plus provenance, substantive material, target relation and a returnKey that recomputes from that carried content. Unknown, malformed, truncated or content-mismatched historical ledger entries cannot create false allPacketsReturned. This is structural lineage integrity rather than cryptographic authenticity or factual verification; automatic truth closure remains forbidden.'
  };
}

function contestKey(targetRef,clauseRef,lens){return [clean(targetRef),clean(clauseRef||targetRef),clean(lens)].join('|');}
function adjudicationContextFromReturns(returns){
  const byOrgan={};
  for(const r of returns){
    if(!REQUIRED_ADJUDICATION_ORGANS.includes(r.sourceOrgan))continue;
    byOrgan[r.sourceOrgan]={
      sourceOrgan:r.sourceOrgan,purpose:r.purpose,packetId:r.packetId,returnKey:r.returnKey,
      provenance:r.provenance,material:r.material,relation:r.relation,status:'CONTEXT_ACCEPTED',closureAuthority:'NONE'
    };
  }
  const receivedOrgans=REQUIRED_ADJUDICATION_ORGANS.filter(o=>byOrgan[o]);
  const missingOrgans=REQUIRED_ADJUDICATION_ORGANS.filter(o=>!byOrgan[o]);
  return {
    status:missingOrgans.length?'PARTIAL_ADJUDICATION_CONTEXT':'ADJUDICATION_CONTEXT_COMPLETE',
    requiredOrgans:[...REQUIRED_ADJUDICATION_ORGANS],receivedOrgans,missingOrgans,complete:missingOrgans.length===0,
    byOrgan,
    closureAuthority:'NONE',
    boundary:'This context records how other organs changed the VAJRA conflict state. Completeness means all required organ returns are present, not that the dispute is resolved or that any return is true.'
  };
}

export function integrateConflictAdjudicationContext(vajra,intake){
  const source=vajra&&typeof vajra==='object'?vajra:{unresolved:[]};
  const accepted=Array.isArray(intake?.accepted)?intake.accepted:[];
  const grouped=new Map();
  for(const r of accepted){
    const key=contestKey(r.targetRef,r.clauseRef,r.lens);
    if(!grouped.has(key))grouped.set(key,[]);
    grouped.get(key).push(r);
  }
  const attachedKeys=new Set(),quarantine=[];let contextualized=0,completeContexts=0;
  const unresolved=(source.unresolved||[]).map(branch=>{
    const isContest=branch?.status===CONTEST||branch?.contest?.status===CONTEST||branch?.status===CONTEXTUAL_CONTEST;
    if(!isContest)return branch;
    const key=contestKey(branch?.targetRef||branch?.contest?.targetRef,branch?.clauseRef||branch?.contest?.clauseRef,branch?.lens||branch?.contest?.lens);
    const returns=grouped.get(key)||[];
    if(!returns.length)return branch;
    attachedKeys.add(key);contextualized++;
    const adjudicationContext=adjudicationContextFromReturns(returns);
    if(adjudicationContext.complete)completeContexts++;
    const nextAction=adjudicationContext.complete?'REASSESS_CONFLICT_WITH_DISCRIMINATING_CONDITION':'WAIT_FOR_ADDITIONAL_ADJUDICATION_CONTEXT';
    const nextQuestion=adjudicationContext.complete
      ?'在保留原支持／反駁證據的前提下，綜合來源品質、方法／語境與邊界判準三種回傳，哪一個最小可檢查條件最能區分這些相反結果？'
      :`衝突仍缺 ${adjudicationContext.missingOrgans.join('、')} 的回傳；不得因目前已收到的材料先行關閉分支。`;
    return {
      ...branch,status:CONTEXTUAL_CONTEST,
      contest:{...(branch.contest||{}),status:CONTEST,evidence:evidenceList(branch)},
      adjudicationContext,
      nextAction,nextQuestion,
      closureBlocked:true,closureAuthority:'NONE',
      boundary:'Multi-organ adjudication returns have changed the next VAJRA action, but the original opposing evidence and provenance remain preserved. Context integration is not truth adjudication.'
    };
  });
  for(const [key,returns] of grouped){
    if(attachedKeys.has(key))continue;
    for(const r of returns)quarantine.push({returnKey:r.returnKey,packetId:r.packetId,sourceOrgan:r.sourceOrgan,targetRef:r.targetRef,clauseRef:r.clauseRef,lens:r.lens,status:'QUARANTINED_CONTEXT_RETURN',reasons:['NO_MATCHING_CONTESTED_BRANCH']});
  }
  const status=quarantine.length&&contextualized?'ADJUDICATION_CONTEXT_INTEGRATED_WITH_QUARANTINE':contextualized?'ADJUDICATION_CONTEXT_INTEGRATED':quarantine.length?'NO_CONTEXT_INTEGRATED_WITH_QUARANTINE':'NO_ADJUDICATION_CONTEXT';
  return {
    ...source,organ:'VAJRA',capability:'CONFLICT_ADJUDICATION_CONTEXT',version:'0.1.0',status,
    unresolved,
    handoffs:unresolved.map(x=>x.handoff).filter(Boolean),
    adjudicationIntegration:{received:accepted.length,contextualizedBranches:contextualized,completeContexts,quarantinedReturns:quarantine.length,quarantine},
    closureBlocked:unresolved.some(b=>b?.status===CONTEST||b?.status===CONTEXTUAL_CONTEST||b?.contest?.status===CONTEST),
    closureAuthority:'NONE',
    boundary:'Deterministic conflict-context integration. Accepted DROPLET/MUTHER/SHROOMING returns can change VAJRA nextAction and nextQuestion only when targetRef, clauseRef and lens match a preserved contested branch. The original opposing evidence and provenance are retained. Complete three-organ context means coverage is complete, not truth is settled; automatic closure remains forbidden.'
  };
}
