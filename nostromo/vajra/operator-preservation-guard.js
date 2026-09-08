/* VAJRA arithmetic operator-preservation guard v0.4 — prevents replay identity from collapsing bounded arithmetic evidence, including common Unicode mathematical glyphs, caret/percent forms, and compact symbolic-variable expressions without promoting ambiguous compact slash/hyphen paths */
(function(root){
  const api=root.VajraEngine;
  if(!api||typeof api.applyHandoffResults!=='function'||typeof api.canonicalEvidenceMaterial!=='function'){
    throw new Error('VAJRA_ENGINE_REQUIRED_BEFORE_OPERATOR_PRESERVATION_GUARD');
  }
  if(api.operatorPreservationGuardVersion==='0.4') return;

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
    // Existing bounded forms: spaced symbolic operands or compact numeric operands.
    // U+2212 (−) and U+2215 (∕) are common in scientific/mathematical text and otherwise risk symbol stripping.
    s=s.replace(/([\p{L}\p{N}_])\s+([*\/×÷−∕^%])\s+([\p{L}\p{N}_])/gu,(_,a,op,b)=>`${a} ${tokenFor(op)} ${b}`);
    s=s.replace(/(\p{N})([*\/×÷−∕^%])(\p{N})/gu,(_,a,op,b)=>`${a} ${tokenFor(op)} ${b}`);

    // v0.4: compact symbolic-variable forms are also evidence-significant when the operator itself is comparatively unambiguous.
    // ASCII slash and ASCII hyphen are intentionally excluded here because compact a/b and a-b are common path/lexical forms.
    // Bounded identifier length prevents this structural guard from turning arbitrary long punctuation-bearing text into formulas.
    s=s.replace(/([\p{L}_][\p{L}\p{N}_]{0,15})([*×÷−∕^%])([\p{L}_][\p{L}\p{N}_]{0,15})/gu,(_,a,op,b)=>`${a} ${tokenFor(op)} ${b}`);
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
        version:'0.4',
        protected:['*','/','×','÷','−','∕','^','%'],
        scope:'spaced alphanumeric operands, compact numeric operands, and bounded compact symbolic-variable operands for non-ambiguous operators',
        boundary:'The guard preserves multiplication/division, common Unicode mathematical minus/division-slash glyphs, caret/percent operator identity in bounded arithmetic-looking contexts. Compact symbolic-variable forms are promoted only for *, ×, ÷, −, ∕, ^ and %. Compact ASCII slash and ASCII hyphen remain unpromoted because path and lexical ambiguity would otherwise create false arithmetic identity. The guard does not claim semantic parsing.'
      }
    };
  }

  wrappedApply.__operatorPreservationGuard=true;
  api.applyHandoffResults=wrappedApply;
  api.canonicalEvidenceMaterial=canonicalArithmeticMaterial;
  api.evidenceIdentity=evidenceIdentity;
  api.operatorPreservationGuardVersion='0.4';
})(typeof window!=='undefined'?window:globalThis);
