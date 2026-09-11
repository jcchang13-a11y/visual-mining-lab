/* 《剛吃飽》第八版｜爛尾樓版｜正式公式巡檢鷹架
 * 現行正式規格："S"/~S
 * "S" = 是名 S；~S = 即非 S；亦即只有在承認 S 不是死實體的基礎上，才說 "S"。
 * 不清場：正文裡已存在的 S = ～S、X = ～X 等舊公式不再被 LIVE reader 偷偷覆寫；
 * 它們保留作施工斷面。只有 {{...}} renderer 與已採現行引號／斜線語法的公式，才統一成正式顯示。
 */
(function(){
  'use strict';

  const article=document.getElementById('article');
  if(!article) return;

  const historyExcluded='.sutra-block,.work-note,.figure-slot,figure,figcaption,script,style';
  const currentBase=/^\s*["“”]S["“”]\s*\/\s*[~〜～]\s*S\s*$/;
  const inlineQuoted=/["“”]S["“”]\s*\/\s*[~〜～]\s*S/g;
  const labelToken='[A-Za-z0-9_\u3400-\u9FFF]+';
  const namedQuoted=new RegExp(`["“”](${labelToken})["“”]\\s*\\/\\s*[~〜～]\\s*\\1`,'g');
  const namedCurrentWhole=new RegExp(`^\\s*["“”](${labelToken})["“”]\\s*\\/\\s*[~〜～]\\s*\\1\\s*$`);

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
    if(currentBase.test(line)){
      frag.append(makeOfficialSpan('S'));
      return true;
    }
    const match=line.match(namedCurrentWhole);
    if(match){
      frag.append(makeOfficialSpan(match[1]));
      return true;
    }
    return false;
  }

  function normalizeTextNode(node){
    if(!node?.nodeValue || node.parentElement?.closest(historyExcluded)) return false;
    const value=node.nodeValue;
    if(!/[~〜～\/“”"]/.test(value)) return false;

    const lines=value.split('\n');
    let changed=false;
    const frag=document.createDocumentFragment();

    lines.forEach((line,index)=>{
      if(normalizeWholeLine(line,frag)){
        changed=true;
      }else{
        /* 注意：這裡故意不碰 S = ～S／X = ～X 等舊公式。
           它們可能是正文殘留，也可能是施工史；爛尾樓版一律先保留表面，不替作者事後洗乾淨。 */
        const normalized=line
          .replace(namedQuoted,(_m,label)=>official(label))
          .replace(inlineQuoted,'"S"/~S');
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
