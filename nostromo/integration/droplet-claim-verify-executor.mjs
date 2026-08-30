// DROPLET claim verification executor v1.0
import crypto from 'node:crypto';

const hash=s=>crypto.createHash('sha256').update(String(s)).digest('hex').slice(0,16);
const clean=s=>String(s??'').replace(/\s+/g,' ').trim();

export function verifyClaim({claim='',evidence=[]}={}){
  const c=clean(claim); if(!c) throw new Error('DROPLET_CLAIM_REQUIRED');
  if(!Array.isArray(evidence)||evidence.length===0) throw new Error('DROPLET_EVIDENCE_REQUIRED');
  const normalized=evidence.map((e,i)=>({
    id:e.id||`E${i+1}`,
    source:clean(e.source||'unknown'),
    sourceClass:clean(e.sourceClass||'unknown'),
    relation:['SUPPORTS','REFUTES','INDETERMINATE'].includes(e.relation)?e.relation:'INDETERMINATE',
    fingerprint:clean(e.fingerprint||''),
    date:clean(e.date||'')
  }));
  const supports=normalized.filter(e=>e.relation==='SUPPORTS');
  const refutes=normalized.filter(e=>e.relation==='REFUTES');
  const authoritativeSupports=supports.filter(e=>['PRIMARY','OFFICIAL'].includes(e.sourceClass));
  const authoritativeRefutes=refutes.filter(e=>['PRIMARY','OFFICIAL'].includes(e.sourceClass));
  let verdict='INDETERMINATE';
  if(authoritativeRefutes.length>0) verdict='REFUTED';
  else if(authoritativeSupports.length>=1 && refutes.length===0) verdict='SUPPORTED';
  const evidenceFingerprint=hash(JSON.stringify(normalized));
  return {
    executor:'DROPLET_CLAIM_VERIFY',status:'EXECUTED',claim:c,claimFingerprint:hash(c),verdict,
    counts:{evidence:normalized.length,supports:supports.length,refutes:refutes.length,authoritativeSupports:authoritativeSupports.length,authoritativeRefutes:authoritativeRefutes.length},
    evidenceFingerprint,
    evidence:normalized,
    boundary:'VERDICT IS COMPUTED ONLY FROM THE EXPLICIT EVIDENCE BUNDLE SUPPLIED BY AN ACTUAL CONNECTOR OR CALLER. THIS EXECUTOR DOES NOT SEARCH THE WEB ITSELF, DOES NOT TREAT ABSENCE OF REFUTATION AS GLOBAL TRUTH, AND DOES NOT UPGRADE STATIC STATE READING INTO CLAIM VERIFICATION.'
  };
}
