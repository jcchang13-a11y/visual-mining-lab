/* 《剛吃飽》第八版｜爛尾樓版｜30450 後補施工區圖像逃生鷹架
 * 不改正文、不清施工區。
 * reading-layer-scaffold 會把「補這四塊就好」之後的直接子節點包成 L3；
 * 若回溯圖／既有 figure 稍後才插入，可能被 MutationObserver 一併包進 work-note。
 * 本層只把「被單獨包住的圖」移回同一閱讀位置的 L3 外側，保留圖自己的 retrospective／figure layer。
 */
(function(){
  'use strict';
  if(new URLSearchParams(location.search).get('u')!=='30450') return;
  const article=document.getElementById('article');
  if(!article) return;

  function escapeFigures(){
    let changed=false;
    const boxes=Array.from(article.querySelectorAll('.late-patch-range'));
    boxes.forEach(box=>{
      const children=Array.from(box.childNodes).filter(node=>
        !(node.nodeType===Node.TEXT_NODE && !(node.nodeValue||'').trim())
      );
      if(children.length!==1) return;
      const child=children[0];
      if(child.nodeType!==Node.ELEMENT_NODE) return;
      const isFigure=child.matches('figure,.figure-slot,[data-gcb-layer="retrospective"]');
      if(!isFigure) return;
      box.parentNode.insertBefore(child,box.nextSibling);
      box.dataset.gcbFigureEscaped='1';
      if(!(box.textContent||'').trim()) box.remove();
      changed=true;
    });
    return changed;
  }

  escapeFigures();
  const observer=new MutationObserver(()=>escapeFigures());
  observer.observe(article,{childList:true,subtree:true});
  setTimeout(()=>{escapeFigures();observer.disconnect();},15000);
})();
