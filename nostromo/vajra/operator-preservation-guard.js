/* VAJRA arithmetic operator-preservation guard v0.3 — prevents replay identity from collapsing bounded arithmetic evidence, including common Unicode mathematical glyphs plus caret/percent operator forms */
(function(root){
  const api=root.VajraEngine;
  if(!api||typeof api.applyHandoffResults!=='function'||typeof api.canonicalEvidenceMaterial!=='function'){
    throw new Error('VAJRA_ENGINE_REQUIRED_BEFORE_OPERATOR_PRESERVATION_GUARD');
  }
  if(api.operatorPreservationGuardVersion==='0.3') return;

  const baseApply=api.applyHandoffResults.bind(api);
  const baseCanonical=api.canonicalEvidenceMaterial.bind(api);
  const clean=v=>String(v??'').replace(/\s+/g,' ').trim();
  const tokenFor=op=>{
    if(op==='*'||op==='×') return 'opmul';
    if(op==='/'||op==='÷'||op==='∕') return 'opdiv';
    if(op==='−') return 'opsub';
    if(op==='^') return 'opcaret';
    if(op==='%') return 'oppercent';
    return `op${op.codePointAt(0).toString(16)}`;
  };

  function protectArithmeticMaterial(text){
    let s=String(text??'').normalize('NFKC');
    // Match only explicit arithmetic-looking contexts: spaced symbolic operands or compact numeric operands.
    // U+2212 (−) and U+2215 (∕) are common in scientific/mathematical text and otherwise risk symbol stripping.
    // Caret and percent are preserved structurally, not interpreted semantically: 2^8 / 17%5 qualify; trailing 95% does not.
    s=s.replace(/([\p{L}\p{N}_])\s+([*\/×÷−∕^%])\s+([\p{L}\p{N}_])/gu,(_,a,op,b)=>`${a} ${tokenFor(op)} ${b}`);
    s=s.replace(/(\p{N})([*\/×÷−∕^%])(\p{N})/gu,(_,a,op,b)=>`${a} ${tokenFor(op)} ${b}`);
    return s;
  }

  function canonicalArithmeticMaterial(text){
    return baseCanonical(protectArithmeticMaterial(text));
  }

  function fingerprint(text){
    let h=2166136261;
    for(const ch of clean(text)){h^=ch.codePointAt(0);h=Math.imul(h,16777619)>>>0;}
    return h.toString(16).padStart(8,'0');
  }

  function canonicalProvenance(text){
    if(typeof api.canonicalEvidenceProvenance==='function') return api.canonicalEvidenceProvenance(text);
    return clean(text).normalize('NFKC').toLowerCase().replace(/[\p{P}\p{S}\s]+/gu,'');
  }

  function evidenceIdentity(provenance,material){
    return fingerprint(`${canonicalProvenance(provenance)}|${canonicalArithmeticMaterial(material)}`);
  }

  function wrappedApply(vajraResult,receipts=[]){
    const incoming=Array.isArray(receipts)?receipts:[];
    const restoration=new Map();
    const protectedReceipts=incoming.map(r=>{
      if(!r||typeof r!=='object') return r;
      const originalMaterial=r.material??r.summary??r.evidence??r.result;
      if(originalMaterial==null) return r;
      const clone={...r};
      if('material' in r) clone.material=protectArithmeticMaterial(r.material);
      else if('summary' in r) clone.summary=protectArithmeticMaterial(r.summary);
      else if('evidence' in r) clone.evidence=protectArithmeticMaterial(r.evidence);
      else clone.result=protectArithmeticMaterial(r.result);
      restoration.set(fingerprint(JSON.stringify(clone)),r);
      return clone;
    });

    const out=baseApply(vajraResult,protectedReceipts);
    if(!out||typeof out!=='object') return out;
    const hr=out.handoffResolution;
    if(hr&&Array.isArray(hr.rejectedReceipts)){
      hr.rejectedReceipts=hr.rejectedReceipts.map(x=>{
        const original=restoration.get(String(x?.receiptFingerprint||''));
        if(!original) return x;
        const restored={...x};
        if('material' in original) restored.material=original.material;
        else if('summary' in original) restored.material=original.summary;
        else if('evidence' in original) restored.material=original.evidence;
        else if('result' in original) restored.material=original.result;
        return restored;
      });
    }
    return {
      ...out,
      operatorPreservation:{
        version:'0.3',
        protected:['*','/','×','÷','−','∕','^','%'],
        scope:'arithmetic-looking contexts only',
        boundary:'The guard preserves multiplication/division, common Unicode mathematical minus/division-slash glyphs, and caret/percent operator identity only when symbols occur between spaced alphanumeric operands or compact numeric operands. It does not claim semantic parsing; trailing percentages and arbitrary path/URL punctuation are intentionally not promoted to arithmetic.'
      }
    };
  }

  wrappedApply.__operatorPreservationGuard=true;
  api.applyHandoffResults=wrappedApply;
  api.canonicalEvidenceMaterial=canonicalArithmeticMaterial;
  api.evidenceIdentity=evidenceIdentity;
  api.operatorPreservationGuardVersion='0.3';
})(typeof window!=='undefined'?window:globalThis);
