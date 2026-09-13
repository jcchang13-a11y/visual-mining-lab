/* 《剛吃飽》第八版｜爛尾樓版｜30340 開頭施工語閱讀層
 * 原 Markdown 保留。只把檔首「這一版要把兩件事分乾淨」到第一條 --- 之間
 * 標回 L3 工作語，避免它在 LIVE reader 裡冒充第十三分正式正文。
 */
(function(){
  'use strict';
  if(new URLSearchParams(location.search).get('u')!=='30340') return;
  const article=document.getElementById('article');
  if(!article || article.dataset.gcb30340OpeningWork==='1') return;

  function apply(){
    const nodes=Array.from(article.childNodes);
    const boundary=nodes.find(node=>
      node.nodeType===Node.ELEMENT_NODE &&
      node.classList.contains('structure-line') &&
      node.textContent.trim()==='---'
    );
    if(!boundary) return false;

    const firstText=nodes.find(node=>node.nodeType===Node.TEXT_NODE && (node.nodeValue||'').trim());
    if(!firstText || !(firstText.nodeValue||'').includes('這一版要把兩件事分乾淨')) return true;

    const box=document.createElement('div');
    box.className='work-note opening-work-range';
    box.dataset.gcbLayer='L3';
    box.dataset.gcb30340OpeningWork='1';

    let cursor=article.firstChild;
    let moved=false;
    while(cursor && cursor!==boundary){
      const next=cursor.nextSibling;
      box.append(cursor);
      moved=true;
      cursor=next;
    }
    if(!moved) return true;
    article.insertBefore(box,boundary);
    article.dataset.gcb30340OpeningWork='1';
    return true;
  }

  if(apply()) return;
  const observer=new MutationObserver(()=>{if(apply())observer.disconnect()});
  observer.observe(article,{childList:true,subtree:true,characterData:true});
  setTimeout(()=>observer.disconnect(),15000);
})();
