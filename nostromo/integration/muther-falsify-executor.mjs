// MU/TH/UR repository-scoped falsification probe v0.1
// Evidence-honest: searches declared public-repository scope for caller-declared contradiction markers.
// It never treats absence of counterevidence as proof that a claim is true.
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT=process.cwd();
const hash=s=>crypto.createHash('sha256').update(String(s)).digest('hex').slice(0,16);
const compact=(s,n=360)=>String(s??'').replace(/\s+/g,' ').trim().slice(0,n);

export async function mutherFalsifyRepo({claim='',contradictionMarkers=[],scopePaths=['nostromo/integration/organ-registry.json']}={}){
  const c=compact(claim,1200);
  if(!c) throw new Error('MUTHER_FALSIFY_CLAIM_REQUIRED');
  const markers=(Array.isArray(contradictionMarkers)?contradictionMarkers:[]).map(x=>compact(x,160)).filter(Boolean);
  if(!markers.length) throw new Error('MUTHER_FALSIFY_MARKERS_REQUIRED');
  const scopes=(Array.isArray(scopePaths)?scopePaths:[]).map(x=>String(x||'').trim()).filter(Boolean);
  if(!scopes.length) throw new Error('MUTHER_FALSIFY_SCOPE_REQUIRED');

  const evidence=[];
  for(const rel of scopes){
    const full=path.resolve(ROOT,rel);
    if(!full.startsWith(path.resolve(ROOT)+path.sep)) throw new Error('MUTHER_FALSIFY_SCOPE_OUTSIDE_REPO');
    const text=await fs.readFile(full,'utf8');
    for(const marker of markers){
      const low=text.toLowerCase(), needle=marker.toLowerCase();
      let at=0,count=0,first=-1;
      while((at=low.indexOf(needle,at))>=0){if(first<0)first=at;count++;at+=Math.max(1,needle.length);}
      if(count>0){
        evidence.push({path:rel,marker,occurrenceCount:count,contentFingerprint:hash(text),snippet:compact(text.slice(Math.max(0,first-120),first+marker.length+240))});
      }
    }
  }

  return {
    executor:'MUTHER_REPO_FALSIFICATION_PROBE',
    status:'EXECUTED',
    claimFingerprint:hash(c),
    declaredMarkers:markers,
    declaredScope:scopes,
    evidenceCount:evidence.length,
    classification:evidence.length?'COUNTEREVIDENCE_FOUND':'NO_COUNTEREVIDENCE_FOUND_IN_DECLARED_SCOPE',
    evidence,
    boundary:'REPOSITORY-SCOPED COUNTEREVIDENCE PROBE ONLY. CONTRADICTION MARKERS ARE EXPLICIT CALLER-SUPPLIED TEST CRITERIA. COUNTEREVIDENCE FOUND DOES NOT BY ITSELF PROVE GLOBAL FALSITY; NO COUNTEREVIDENCE FOUND DOES NOT PROVE THE CLAIM TRUE. THIS EXECUTOR DOES NOT SEARCH PRIVATE GOOGLE DRIVE OR THE OPEN WEB.'
  };
}
