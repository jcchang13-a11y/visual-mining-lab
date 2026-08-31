// DROPLET claim verification executor v1.1
import crypto from 'node:crypto';

const hash=s=>crypto.createHash('sha256').update(String(s)).digest('hex').slice(0,16);
const clean=s=>String(s??'').replace(/\s+/g,' ').trim();
const canonical=s=>clean(s).toLowerCase().replace(/[\p{P}\p{S}\s]+/gu,'');
const authoritative=e=>['PRIMARY','OFFICIAL'].includes(e.sourceClass);

function normalizeEvidence(e,i){
  const source=clean(e.source||'unknown');
  const sourceClass=clean(e.sourceClass||'unknown').toUpperCase();
  const relation=['SUPPORTS','REFUTES','INDETERMINATE'].includes(e.relation)?e.relation:'INDETERMINATE';
  const fingerprint=clean(e.fingerprint||'');
  const sourceFamily=clean(e.sourceFamily||e.publisher||source||'unknown');
  return {
    id:e.id||`E${i+1}`,
    source,
    sourceClass,
    sourceFamily,
    relation,
    fingerprint,
    date:clean(e.date||''),
    identityKey:fingerprint?`fp:${fingerprint}`:`src:${canonical(sourceFamily)}|${relation}`,
    familyKey:canonical(sourceFamily)||'unknown'
  };
}

export function verifyClaim({claim='',evidence=[]}={}){
  const c=clean(claim); if(!c) throw new Error('DROPLET_CLAIM_REQUIRED');
  if(!Array.isArray(evidence)||evidence.length===0) throw new Error('DROPLET_EVIDENCE_REQUIRED');
  const normalized=evidence.map(normalizeEvidence);

  const fingerprintRelations=new Map();
  for(const e of normalized){
    if(!e.fingerprint) continue;
    if(!fingerprintRelations.has(e.fingerprint)) fingerprintRelations.set(e.fingerprint,new Set());
    fingerprintRelations.get(e.fingerprint).add(e.relation);
  }
  const contradictoryFingerprints=[...fingerprintRelations.entries()].filter(([,rels])=>rels.size>1).map(([fp])=>fp);

  const seen=new Set();
  const unique=[];
  const duplicates=[];
  for(const e of normalized){
    if(seen.has(e.identityKey)){ duplicates.push(e); continue; }
    seen.add(e.identityKey); unique.push(e);
  }

  const supports=unique.filter(e=>e.relation==='SUPPORTS');
  const refutes=unique.filter(e=>e.relation==='REFUTES');
  const authoritativeSupports=supports.filter(authoritative);
  const authoritativeRefutes=refutes.filter(authoritative);
  const supportFamilies=new Set(authoritativeSupports.map(e=>e.familyKey));
  const refuteFamilies=new Set(authoritativeRefutes.map(e=>e.familyKey));
  const authoritativeConflict=authoritativeSupports.length>0&&authoritativeRefutes.length>0;
  const integrityConflict=contradictoryFingerprints.length>0;

  let verdict='INDETERMINATE';
  if(!integrityConflict&&!authoritativeConflict){
    if(authoritativeRefutes.length>0&&supports.length===0) verdict='REFUTED';
    else if(authoritativeSupports.length>0&&refutes.length===0) verdict='SUPPORTED';
  }
  const evidenceFingerprint=hash(JSON.stringify(normalized));
  return {
    executor:'DROPLET_CLAIM_VERIFY',status:'EXECUTED',claim:c,claimFingerprint:hash(c),verdict,
    counts:{
      evidence:normalized.length,
      uniqueEvidence:unique.length,
      duplicatesSuppressed:duplicates.length,
      supports:supports.length,
      refutes:refutes.length,
      authoritativeSupports:authoritativeSupports.length,
      authoritativeRefutes:authoritativeRefutes.length,
      authoritativeSupportFamilies:supportFamilies.size,
      authoritativeRefuteFamilies:refuteFamilies.size
    },
    conflicts:{authoritativeConflict,integrityConflict,contradictoryFingerprints},
    evidenceFingerprint,
    evidence:normalized,
    uniqueEvidence:unique,
    boundary:'VERDICT IS COMPUTED ONLY FROM THE EXPLICIT EVIDENCE BUNDLE SUPPLIED BY AN ACTUAL CONNECTOR OR CALLER. EXACT REPLAYED EVIDENCE IS SUPPRESSED BY FINGERPRINT/IDENTITY, SOURCE-FAMILY COUNTS ARE AUDIT SIGNALS RATHER THAN PROOF OF INDEPENDENCE, AND CONFLICTING AUTHORITATIVE DIRECTIONS OR CONTRADICTORY USE OF ONE FINGERPRINT FORCE INDETERMINATE. THIS EXECUTOR DOES NOT SEARCH THE WEB, SCORE METHODOLOGICAL QUALITY, PROVE SOURCE INDEPENDENCE, OR TREAT ABSENCE OF REFUTATION AS GLOBAL TRUTH.'
  };
}
