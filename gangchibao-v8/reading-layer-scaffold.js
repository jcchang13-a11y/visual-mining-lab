/* 《剛吃飽》第八版｜爛尾樓版｜閱讀地層自動鷹架
 * 不改單元 Markdown；只在 reader DOM 中標記高信心的施工語與結構代碼。
 * 經文、正文、公式沿用既有 renderer；這裡只補 L3／L4 的可逆辨識層。
 */
(function(){
  'use strict';

  const article=document.getElementById('article');
  if(!article) return;

  const structureLine=/^\s*(?:PLS|P|L|S|N|F)\s*[：:]/;
  const bracketStructureLine=/^\s*\[\[(?!\/?(?:SUTRA|WORK|FIGURE)\b)[^\]\n]+\]\]\s*$/i;
  const sectionLabelLine=/^\s*［(?:正文|註釋|經文)］\s*$/;
  const pageCounterLine=/^\s*\d+\/\d+\s*$/;
  const workLine=/^\s*(?:施工註記|工作註記|暫記|待查|未決|停工|死路)\s*[：:]/;
  /* 只抓明確的排版／製作指令；一般【章名】與經文標題不碰。經文區本來也在 excluded 內。 */
  const productionDirectiveLine=/^\s*【(?=[^】]*(?:換頁|字體|排版|版面|插圖|待接|圖位|圖檔|印刷|列印|跨頁|留白))[^】]+】\s*$/;
  const excluded='.sutra-block,.gcb-formula,.structure-code,.work-note,.figure-slot,figure,figcaption,script,style';

  function classify(line){
    if(structureLine.test(line)||bracketStructureLine.test(line)||sectionLabelLine.test(line)||pageCounterLine.test(line)) return {cls:'structure-code structure-line',layer:'L4'};
    if(workLine.test(line)||productionDirectiveLine.test(line)) return {cls:'work-note work-note-line',layer:'L3'};
    return null;
  }

  function markTextNode(node){
    if(!node?.nodeValue || node.parentElement?.closest(excluded)) return false;
    const value=node.nodeValue;
    if(!/[：:\[\]［］\/【】]/.test(value)) return false;
    const lines=value.split('\n');
    if(!lines.some(line=>classify(line))) return false;

    const frag=document.createDocumentFragment();
    lines.forEach((line,index)=>{
      const mark=classify(line);
      if(mark){
        const span=document.createElement('span');
        span.className=mark.cls;
        span.dataset.gcbLayer=mark.layer;
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

/* 施工接線：30440 的結構性回扣另掛可逆鷹架，不改正文，也不塞回既有 direct/complete 檔。 */
(function(){
  'use strict';
  const unit=new URLSearchParams(location.search).get('u');
  if(unit!=='30440') return;
  if(document.querySelector('script[data-gcb-retro-30440-structural]')) return;
  const script=document.createElement('script');
  script.src='retro-supplement-30440-structural.js?v=20260911-1';
  script.dataset.gcbRetro30440Structural='1';
  document.head.appendChild(script);
})();
