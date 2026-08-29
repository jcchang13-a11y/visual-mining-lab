/* NOSTROMO GUT v0.1 — deterministic digestion adapter */
(function(root){
  function flatten(value,out,path){
    out=out||[]; path=path||'root';
    if(value===null||value===undefined){out.push({path,value:null});return out;}
    if(typeof value==='string'||typeof value==='number'||typeof value==='boolean'){out.push({path,value});return out;}
    if(Array.isArray(value)){value.forEach((v,i)=>flatten(v,out,`${path}[${i}]`));return out;}
    if(typeof value==='object'){Object.keys(value).forEach(k=>flatten(value[k],out,`${path}.${k}`));return out;}
    return out;
  }
  function digest(input,options){
    options=options||{};
    const source=options.source||'unknown';
    const atoms=flatten(input).filter(x=>String(x.value??'').trim()!=='');
    const nutrients=[],waste=[];
    const seen=new Set();
    for(const atom of atoms){
      const text=String(atom.value).trim();
      const key=text.toLowerCase();
      const lowSignal=text.length<3 || /^(none|—|-|null|undefined)$/i.test(text);
      if(lowSignal || seen.has(key)) waste.push({...atom,reason:lowSignal?'low-signal':'duplicate'});
      else {seen.add(key);nutrients.push(atom);}
    }
    return {
      organ:'GUT',version:'0.1',source,
      ingested:atoms.length,absorbed:nutrients.length,excreted:waste.length,
      nutrients:nutrients.slice(0,80),waste:waste.slice(0,80),
      summary:nutrients.slice(0,12).map(x=>String(x.value)).join(' · ')
    };
  }
  root.GutEngine={digest};
})(typeof window!=='undefined'?window:globalThis);
