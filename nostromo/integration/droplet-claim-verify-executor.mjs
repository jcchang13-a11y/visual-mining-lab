// DROPLET claim verification executor v1.5
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
  const declaredSourceFamily=clean(e.sourceFamily||e.publisher||'');
  const familyDeclared=!!declaredSourceFamily;
  const sourceFamily=declaredSourceFamily||source||'unknown';
  return {
    id:e.id||`E${i+1}`,
    source,
    sourceClass,
    sourceFamily,
    familyDeclared,
    relation,
    fingerprint,
    date:clean(e.date||''),
    identityKey:fingerprint?`fp:${fingerprint}`:`src:${canonical(sourceFamily)}|${relation}`,
    familyKey:familyDeclared?(canonical(declaredSourceFamily)||'unknown'):'unknown'
  };
}

function parseAsOf(value){
  const m=clean(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if(!m) return null;
  const d=new Date(`${m[1]}-${m[2]}-${m[3]}T23:59:59.999Z`);
  return Number.isNaN(d.getTime())?null:d;
}

function parseEvidenceDateRange(value){
  const s=clean(value);
  let m=s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if(m){
    const start=new Date(`${m[1]}-${m[2]}-${m[3]}T00:00:00.000Z`);
    const end=new Date(`${m[1]}-${m[2]}-${m[3]}T23:59:59.999Z`);
    return Number.isNaN(start.getTime())?null:{start,end,precision:'DAY'};
  }
  m=s.match(/^(\d{4})-(\d{2})$/);
  if(m){
    const year=Number(m[1]), month=Number(m[2]);
    if(month<1||month>12) return null;
    const start=new Date(Date.UTC(year,month-1,1,0,0,0,0));
    const end=new Date(Date.UTC(year,month,0,23,59,59,999));
    return {start,end,precision:'MONTH'};
  }
  return null;
}

function buildFreshnessAudit(unique,{asOf='',maxAgeDays=null}={}){
  const asOfDate=parseAsOf(asOf);
  const ageLimit=Number(maxAgeDays);
  const active=!!asOfDate&&Number.isFinite(ageLimit)&&ageLimit>=0;
  const rows=unique.map(e=>{
    if(!active) return {id:e.id,status:'NOT_APPLIED',date:e.date,ageDays:null,precision:null};
    const range=parseEvidenceDateRange(e.date);
    if(!range) return {id:e.id,status:'UNKNOWN_DATE',date:e.date,ageDays:null,precision:null};
    if(range.start.getTime()>asOfDate.getTime()) return {id:e.id,status:'FUTURE',date:e.date,ageDays:null,precision:range.precision};
    if(range.end.getTime()>asOfDate.getTime()) return {id:e.id,status:'OVERLAPS_AS_OF',date:e.date,ageDays:null,precision:range.precision};
    const ageDays=Math.max(0,Math.floor((asOfDate.getTime()-range.end.getTime())/86400000));
    return {id:e.id,status:ageDays>ageLimit?'STALE':'FRESH',date:e.date,ageDays,precision:range.precision};
  });
  return {active,asOf:active?clean(asOf):'',maxAgeDays:active?ageLimit:null,rows};
}

function buildDiversityAudit(eligibleSupports,eligibleRefutes,{minAuthoritativeFamilies=null}={}){
  const minFamilies=Number(minAuthoritativeFamilies);
  const active=Number.isInteger(minFamilies)&&minFamilies>=2;
  const familySet=rows=>new Set(rows.filter(e=>e.familyDeclared).map(e=>e.familyKey).filter(k=>k&&k!=='unknown'));
  const supportFamilies=familySet(eligibleSupports);
  const refuteFamilies=familySet(eligibleRefutes);
  const undeclaredSupportCount=eligibleSupports.filter(e=>!e.familyDeclared).length;
  const undeclaredRefuteCount=eligibleRefutes.filter(e=>!e.familyDeclared).length;
  return {
    active,
    minAuthoritativeFamilies:active?minFamilies:null,
    eligibleAuthoritativeSupportFamilies:supportFamilies.size,
    eligibleAuthoritativeRefuteFamilies:refuteFamilies.size,
    undeclaredEligibleAuthoritativeSupports:undeclaredSupportCount,
    undeclaredEligibleAuthoritativeRefutes:undeclaredRefuteCount,
    supportSatisfied:!active||supportFamilies.size>=minFamilies,
    refuteSatisfied:!active||refuteFamilies.size>=minFamilies,
    boundary:'SOURCE-FAMILY DIVERSITY IS AN OPT-IN CORROBORATION GATE OVER EXPLICIT CALLER-SUPPLIED FAMILY/PUBLISHER LABELS. UNDECLARED FAMILY IDENTITY CANNOT BE INFERRED FROM SOURCE DISPLAY NAMES TO SATISFY THE GATE. THIS LIMITS FALSE CERTAINTY FROM SOURCE-NAME FRAGMENTATION BUT DOES NOT PROVE REAL-WORLD SOURCE INDEPENDENCE OR DERIVATIVE-SOURCE STATUS.'
  };
}

export function verifyClaim({claim='',evidence=[],freshnessPolicy={},diversityPolicy={}}={}){
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

  const freshness=buildFreshnessAudit(unique,freshnessPolicy);
  const freshnessById=new Map(freshness.rows.map(row=>[row.id,row.status]));
  const eligibleForCertainty=e=>!freshness.active||freshnessById.get(e.id)==='FRESH';

  const supports=unique.filter(e=>e.relation==='SUPPORTS');
  const refutes=unique.filter(e=>e.relation==='REFUTES');
  const authoritativeSupports=supports.filter(authoritative);
  const authoritativeRefutes=refutes.filter(authoritative);
  const eligibleAuthoritativeSupports=authoritativeSupports.filter(eligibleForCertainty);
  const eligibleAuthoritativeRefutes=authoritativeRefutes.filter(eligibleForCertainty);
  const staleEvidence=freshness.rows.filter(r=>r.status==='STALE');
  const unknownDateEvidence=freshness.rows.filter(r=>r.status==='UNKNOWN_DATE');
  const futureEvidence=freshness.rows.filter(r=>r.status==='FUTURE');
  const overlappingDateEvidence=freshness.rows.filter(r=>r.status==='OVERLAPS_AS_OF');
  const supportFamilies=new Set(authoritativeSupports.filter(e=>e.familyDeclared).map(e=>e.familyKey));
  const refuteFamilies=new Set(authoritativeRefutes.filter(e=>e.familyDeclared).map(e=>e.familyKey));
  const diversity=buildDiversityAudit(eligibleAuthoritativeSupports,eligibleAuthoritativeRefutes,diversityPolicy);
  const authoritativeConflict=authoritativeSupports.length>0&&authoritativeRefutes.length>0;
  const integrityConflict=contradictoryFingerprints.length>0;

  let verdict='INDETERMINATE';
  if(!integrityConflict&&!authoritativeConflict){
    if(eligibleAuthoritativeRefutes.length>0&&supports.length===0&&diversity.refuteSatisfied) verdict='REFUTED';
    else if(eligibleAuthoritativeSupports.length>0&&refutes.length===0&&diversity.supportSatisfied) verdict='SUPPORTED';
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
      eligibleAuthoritativeSupports:eligibleAuthoritativeSupports.length,
      eligibleAuthoritativeRefutes:eligibleAuthoritativeRefutes.length,
      staleEvidence:staleEvidence.length,
      unknownDateEvidence:unknownDateEvidence.length,
      futureEvidence:futureEvidence.length,
      overlappingDateEvidence:overlappingDateEvidence.length,
      authoritativeSupportFamilies:supportFamilies.size,
      authoritativeRefuteFamilies:refuteFamilies.size,
      eligibleAuthoritativeSupportFamilies:diversity.eligibleAuthoritativeSupportFamilies,
      eligibleAuthoritativeRefuteFamilies:diversity.eligibleAuthoritativeRefuteFamilies,
      undeclaredEligibleAuthoritativeSupports:diversity.undeclaredEligibleAuthoritativeSupports,
      undeclaredEligibleAuthoritativeRefutes:diversity.undeclaredEligibleAuthoritativeRefutes
    },
    conflicts:{authoritativeConflict,integrityConflict,contradictoryFingerprints},
    freshness,
    diversity,
    evidenceFingerprint,
    evidence:normalized,
    uniqueEvidence:unique,
    boundary:'VERDICT IS COMPUTED ONLY FROM THE EXPLICIT EVIDENCE BUNDLE SUPPLIED BY AN ACTUAL CONNECTOR OR CALLER. EXACT REPLAYED EVIDENCE IS SUPPRESSED BY FINGERPRINT/IDENTITY. WHEN AN EXPLICIT AS-OF DATE AND MAX-AGE POLICY ARE SUPPLIED, STALE, UNDATED, FUTURE-DATED, OR DATE-RANGE-OVERLAPPING EVIDENCE REMAINS AUDITABLE BUT CANNOT CREATE CERTAINTY. WHEN AN OPT-IN MINIMUM AUTHORITATIVE SOURCE-FAMILY POLICY IS SUPPLIED, ONLY EXPLICIT FAMILY/PUBLISHER LABELS CAN SATISFY THE DIVERSITY GATE; SOURCE DISPLAY NAMES ARE NOT SILENTLY PROMOTED INTO INDEPENDENT FAMILIES. SOURCE-FAMILY LABELS REMAIN CALLER-SUPPLIED AUDIT SIGNALS, NOT PROOF OF INDEPENDENCE. CONFLICTING AUTHORITATIVE DIRECTIONS OR CONTRADICTORY USE OF ONE FINGERPRINT FORCE INDETERMINATE. THIS EXECUTOR DOES NOT SEARCH THE WEB, INFER WHETHER A CLAIM IS TIME-SENSITIVE, SCORE METHODOLOGICAL QUALITY, PROVE SOURCE INDEPENDENCE, DETECT DERIVATIVE SOURCES, OR TREAT ABSENCE OF REFUTATION AS GLOBAL TRUTH.'
  };
}
