/* 《剛吃飽》第八版｜爛尾樓版｜30450 回溯圖閱讀層逃生鷹架
 * 第三十二分正式正文後的 late-patch 施工區會被標成 L3 工作語；
 * 若腳本載入競態使同心圓先被包進 late-patch work-note，這一層只把回溯圖移回獨立 retrospective layer。
 * 不改 Markdown、不改回溯 anchor、不刪任何原始施工文字；只移除因此競態產生且已空掉的 DOM 包裝盒。
 */
(function(){
  'use strict';
  if(new URLSearchParams(location.search).get('u')!=='30450') return;
  const article=document.getElementById('article');
  if(!article) return;

  function escapeFigure(fig){
    if(!fig || !article.contains(fig)) return false;
    const box=fig.closest('.late-patch-range[data-gcb-late-patch="1"],.work-note[data-gcb-late-patch="1"]');
    if(!box || !article.contains(box)) return false;
    fig.dataset.gcbLatePatchEscape='retrospective';
    fig.dataset.gcbLayer='retrospective';
    box.parentNode.insertBefore(fig,box.nextSibling);
    const meaningful=Array.from(box.childNodes).some(node=>{
      if(node.nodeType===Node.ELEMENT_NODE) return true;
      return node.nodeType===Node.TEXT_NODE && (node.nodeValue||'').trim();
    });
    if(!meaningful) box.remove();
    return true;
  }

  function apply(){
    let changed=false;
    article.querySelectorAll('.late-patch-range .retro-figure,.work-note[data-gcb-late-patch="1"] .retro-figure').forEach(fig=>{
      if(escapeFigure(fig)) changed=true;
    });
    return changed;
  }

  apply();
  const observer=new MutationObserver(()=>apply());
  observer.observe(article,{childList:true,subtree:true});
  setTimeout(()=>{apply();observer.disconnect();},15000);
})();
