/* ZENOMORPH / NOSTROMO relation provenance authority gate v0.1
 * Candidate only. No GUT mutation, no capability installation.
 * Cross-food pressure: OSM relations may be derived from source-encoded node order;
 * earthquake catalog temporal/spatial proximity must not be laundered into topology.
 */

const AUTHORITATIVE_ORIGINS = new Set(['source-explicit','source-schema-derived']);

function scalar(value,max=320){
  if(value===null||value===undefined)return null;
  if(['string','number','boolean','bigint'].includes(typeof value)){
    const text=String(value).replace(/\s+/g,' ').trim();
    return text?text.slice(0,max):null;
  }
  return null;
}

function sourceIdentity(specimen){
  return scalar(specimen?.source?.sourceBlobSha)
    || scalar(specimen?.source?.identity)
    || scalar(specimen?.source?.sha256)
    || scalar(specimen?.sampleIdentity?.sha256)
    || null;
}

export function assessRelationProvenanceAuthority(specimen,{relations=[],minimumRelations=2}={}){
  const identity=sourceIdentity(specimen);
  const normalized=(Array.isArray(relations)?relations:[]).map((r,index)=>({
    source:scalar(r?.source),
    target:scalar(r?.target),
    type:scalar(r?.type),
    origin:scalar(r?.origin),
    evidenceRef:scalar(r?.evidenceRef),
    index
  })).filter(r=>r.source&&r.target&&r.source!==r.target);

  const authoritative=normalized.filter(r=>
    AUTHORITATIVE_ORIGINS.has(r.origin)
    && Boolean(r.evidenceRef)
  );
  const rejected=normalized.filter(r=>!authoritative.includes(r));
  const threshold=Math.max(1,Math.floor(Number(minimumRelations)||2));
  const pass=Boolean(identity)&&authoritative.length>=threshold;

  return {
    schema:'zenomorph-relation-provenance-authority-gate/v0.1',
    organism:'ZENOMORPH',
    habitat:'NOSTROMO',
    sourceIdentity:identity,
    status:pass?'PASS':'HOLD',
    reason:pass?'enough-source-authorized-relations':'relation-origin-not-authorized-by-source',
    authoritativeRelationCount:authoritative.length,
    rejectedRelationCount:rejected.length,
    minimumRelations:threshold,
    rejectedOrigins:[...new Set(rejected.map(r=>r.origin||'missing'))].sort(),
    behaviorChangeCandidate:'RELATION_ORIGIN_MUST_PRECEDE_RELATION_TYPE_AND_NETWORK_NORMALIZATION',
    bodyAdmission:false,
    persistentMutation:false,
    promotion:'NONE',
    nextStage:pass?'CANDIDATE_FOR_CROSS_FOOD_DELAYED_TEST':'QUARANTINE_OR_RETAIN_AS_COUNTEREXAMPLE'
  };
}

export const relationProvenanceAuthorityBoundary=Object.freeze({
  version:'0.1',
  installsCapability:false,
  mutatesGut:false,
  acceptsAnalogyAsEvidence:false,
  acceptsHeuristicProximityAsSourceRelation:false,
  acceptedOrigins:[...AUTHORITATIVE_ORIGINS],
  evidenceReferenceRequired:true,
  rule:'可吃 ≠ 要吸收'
});
