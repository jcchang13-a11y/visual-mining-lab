/* 《剛吃飽》第八版｜爛尾樓版｜正式公式統一鷹架
 * 現行正式規格："S"/~S
 * "S" = 是名 S；~S = 即非 S；亦即只有在承認 S 不是死實體的基礎上，才說 "S"。
 * 不清場：明確標在 WORK／施工史中的舊公式仍保留原樣；其餘正式公式、{{...}} 公式與正文中的舊符號變體統一。
 */
(function(){
  'use strict';

  const article=document.getElementById('article');
  if(!article) return;

  const historyExcluded='.sutra-block,.work-note,.figure-slot,figure,figcaption,script,style';
  const explicitHistory=/(?:舊公式|歷史公式|舊寫法|以前寫成|曾經寫成|施工史|保留舊式)/;
  const oldBase=/^\s*S\s*=\s*[~〜～]\s*S\s*$/;
  const currentBase=/^\s*["“”]S["“”]\s*\/\s*[~〜～]\s*S\s*$/;
  const inlineOld=/S\s*=\s*[~〜～]\s*S/g;
  const inlineQuoted=/["“”]S["“”]\s*\/\s*[~〜～]\s*S/g;

  function official(label){
    const s=String(label||'').trim();
    return `"${s}"/~${s}`;
  }

  function normalizeRenderedFormula(el){
    if(!el || el.closest(historyExcluded)) return false;
    const name=el.querySelector('.gcb-name')?.textContent?.trim();
    const neg=el.querySelector('.gcb-neg')?.textContent?.trim();
    if(!name || !neg) return false;
    const label=name.replace(/^[「『“"]+|[」』”"]+$/g,'').trim();
    if(!label) return false;
    const span=document.createElement('span');
    span.className='gcb-basic-formula structure-code';
    span.setAttribute('data-formula','official');
    span.setAttribute('data-formula-reading','是名／即非');
    span.textContent=official(label);
    el.replaceWith(span);
    return true;
  }

  function makeOfficialSpan(label='S'){
    const span=document.createElement('span');
    span.className='gcb-basic-formula structure-code';
    span.setAttribute('data-formula','official');
    span.setAttribute('data-formula-reading','是名／即非');
    span.textContent=official(label);
    return span;
  }

  function normalizeWholeLine(line,frag){
    if(oldBase.test(line)||currentBase.test(line)){
      frag.append(makeOfficialSpan('S'));
      return true;
    }
    return false;
  }

  function normalizeTextNode(node){
    if(!node?.nodeValue || node.parentElement?.closest(historyExcluded)) return false;
    const value=node.nodeValue;
    if(!/[=~〜～\/“”"]/.test(value)) return false;

    const lines=value.split('\n');
    let changed=false;
    const frag=document.createDocumentFragment();

    lines.forEach((line,index)=>{
      if(explicitHistory.test(line)){
        frag.append(document.createTextNode(line));
      }else if(normalizeWholeLine(line,frag)){
        changed=true;
      }else{
        const normalized=line
          .replace(inlineQuoted,'"S"/~S')
          .replace(inlineOld,'"S"/~S');
        if(normalized!==line) changed=true;
        frag.append(document.createTextNode(normalized));
      }
      if(index<lines.length-1) frag.append(document.createTextNode('\n'));
    });

    if(!changed) return false;
    node.replaceWith(frag);
    return true;
  }

  function normalizeFooter(){
    const footer=document.querySelector('.footer');
    if(!footer) return;
    footer.childNodes.forEach(node=>{
      if(node.nodeType!==Node.TEXT_NODE) return;
      node.nodeValue=node.nodeValue
        .replace(/基本式固定為\s*S\s*=\s*[~〜～]\s*S/g,'基本式固定為 "S"/~S')
        .replace(/基本式固定為\s*["“”]S["“”]\s*\/\s*[~〜～]\s*S/g,'基本式固定為 "S"/~S')
        .replace(/名稱層次以\s*\{\{S\}\}\s*生成直式公式/g,'名稱層次以 {{S}} 生成 "S"/~S');
    });
  }

  function apply(){
    article.querySelectorAll('.gcb-formula').forEach(normalizeRenderedFormula);
    const walker=document.createTreeWalker(article,NodeFilter.SHOW_TEXT);
    const nodes=[];
    let node;
    while((node=walker.nextNode())) nodes.push(node);
    nodes.forEach(normalizeTextNode);
    normalizeFooter();
  }

  apply();
  const observer=new MutationObserver(()=>apply());
  observer.observe(article,{childList:true,subtree:true,characterData:true});
  setTimeout(()=>{apply();observer.disconnect();},15000);
})();
