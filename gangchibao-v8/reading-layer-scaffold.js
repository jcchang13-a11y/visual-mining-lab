/* 《剛吃飽》第八版｜爛尾樓版｜閱讀地層自動鷹架
 * 不改單元 Markdown；只在 reader DOM 中標記高信心的施工語與結構代碼。
 * 經文、正文、公式沿用既有 renderer；這裡只補 L3／L4 的可逆辨識層。
 */
(function(){
  'use strict';

  const article=document.getElementById('article');
  if(!article) return;

  const structureLine=/^\s*(?:PLS|P|L|S|N|F)\s*[：:]/;
  const workLine=/^\s*(?:施工註記|工作註記|暫記|待查|未決|停工|死路)\s*[：:]/;
  const excluded='.sutra-block,.gcb-formula,.structure-code,.work-note,.figure-slot,figure,figcaption,script,style';

  function classify(line){
    if(structureLine.test(line)) return 'structure-code structure-line';
    if(workLine.test(line)) return 'work-note work-note-line';
    return '';
  }

  function markTextNode(node){
    if(!node?.nodeValue || node.parentElement?.closest(excluded)) return false;
    const value=node.nodeValue;
    if(!/[：:]/.test(value)) return false;
    const lines=value.split('\n');
    if(!lines.some(line=>classify(line))) return false;

    const frag=document.createDocumentFragment();
    lines.forEach((line,index)=>{
      const cls=classify(line);
      if(cls){
        const span=document.createElement('span');
        span.className=cls;
        span.textContent=line;
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
    nodes.forEach(markTextNode);
  }

  apply();
  const observer=new MutationObserver(()=>apply());
  observer.observe(article,{childList:true,subtree:true,characterData:true});
  setTimeout(()=>observer.disconnect(),15000);
})();
