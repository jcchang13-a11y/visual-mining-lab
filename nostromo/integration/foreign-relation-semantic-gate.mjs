/* ZENOMORPH / NOSTROMO unfamiliar-material semantic relation gate v0.1
 * Candidate only. Does not mutate GUT or install a capability.
 * Purpose: distinguish "this specimen contains explicit relations" from
 * "these relations are evidence of network/topological connectivity".
 */

const TOPOLOGICAL_TYPES = new Set(['adjacency','parent-child','directed-connectivity','undirected-connectivity']);

function scalar(value,max=240){
  if(value===null||value===undefined)return null;
  if(['string','number','boolean','bigint'].includes(typeof value)){
    const text=String(value).replace(/\s+/g,' ').trim();
    return text?text.slice(0,max):null;
  }
  return null;
}

export function assessTypedRelationSpecimen(specimen,{minimumRelations=2,minimumTopologicalRelations=2}={}){
  const sourceIdentity=scalar(specimen?.source?.identity)||scalar(specimen?.source?.sourceBlobSha)||null;
  const relations=(Array.isArray(specimen?.relations)?specimen.relations:[])
    .map((r,index)=>({source:scalar(r?.source),target:scalar(r?.target),type:scalar(r?.type),index}))
    .filter(r=>r.source&&r.target&&r.source!==r.target&&r.type);

  const threshold=Math.max(1,Math.floor(Number(minimumRelations)||2));
  const topologyThreshold=Math.max(1,Math.floor(Number(minimumTopologicalRelations)||2));
  const topologicalRelations=relations.filter(r=>TOPOLOGICAL_TYPES.has(r.type));
  const relationStatus=sourceIdentity&&relations.length>=threshold?'PASS':'HOLD';
  const topologyStatus=relationStatus==='PASS'&&topologicalRelations.length>=topologyThreshold?'PASS':'HOLD';
  const relationTypes=[...new Set(relations.map(r=>r.type))].sort();

  return {
    schema:'zenomorph-foreign-relation-semantic-gate/v0.1',
    organism:'ZENOMORPH',
    habitat:'NOSTROMO',
    sourceIdentity,
    relationStatus,
    topologyStatus,
    relationCount:relations.length,
    topologicalRelationCount:topologicalRelations.length,
    relationTypes,
    behaviorChangeCandidate:'RELATION_TYPE_PRECEDES_NETWORK_NORMALIZATION',
    interpretation: topologyStatus==='PASS'
      ? 'The specimen contains traceable explicitly typed topological relations.'
      : relationStatus==='PASS'
        ? 'The specimen contains traceable explicit relations, but their types do not warrant a topology/network claim.'
        : 'The specimen lacks enough traceable explicit typed relations.',
    bodyAdmission:false,
    persistentMutation:false,
    promotion:'NONE'
  };
}

export const semanticRelationGateBoundary=Object.freeze({
  version:'0.1',
  installsCapability:false,
  mutatesGut:false,
  acceptsUntypedRelationAsTopology:false,
  relationEvidenceDistinctFromTopologyEvidence:true,
  topologicalTypes:[...TOPOLOGICAL_TYPES]
});
