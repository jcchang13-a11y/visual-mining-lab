/* 《剛吃飽》第八版｜爛尾樓版｜基本式巡檢鷹架
 * 只處理「獨立成行」且可高信心判定為正式基本式的 S = ~S / S=～S 變體。
 * 正文句子、歷史錯誤公式、舊公式例證一律不碰。
 * 名稱層次 {{...}} 仍交給既有 gcb-formula renderer。
 */
(function(){
  'use strict';

  const article=document.getElementById('article');
  if(!article) return;

  const exactBase=/^\s*S\s*=\s*[~〜～]\s*S\s*$/;
  const excluded='.sutra-block,.gcb-formula,.gcb-basic-formula,.structure-code,.work-note,.figure-slot,figure,figcaption,script,style';

  function normalizeTextNode(node){
    if(!node?.nodeValue || node.parentElement?.closest(excluded)) return false;
    const value=node.nodeValue;
    if(!/[=~〜～]/.test(value)) return false;

    const lines=value.split('\n');
    if(!lines.some(line=>exactBase.test(line))) return false;

    const frag=document.createDocumentFragment();
    lines.forEach((line,index)=>{
      if(exactBase.test(line)){
        const span=document.createElement('span');
        span.className='gcb-basic-formula structure-code';
        span.setAttribute('data-formula','base');
        span.textContent='S = ～S';
        frag.append(span);
      }else{
        frag.append(document.createTextNode(line));
      }
      if(index<lines.length-1) frag.append(document.createTextNode('\n'));
    });
    node.replaceWith(frag);
    return true;
  }

  function apply(){
    const walker=document.createTreeWalker(article,NodeFilter.SHOW_TEXT);
    const nodes=[];
    let node;
    while((node=walker.nextNode())) nodes.push(node);
    nodes.forEach(normalizeTextNode);
  }

  apply();
  const observer=new MutationObserver(()=>apply());
  observer.observe(article,{childList:true,subtree:true,characterData:true});
  setTimeout(()=>observer.disconnect(),15000);
})();
