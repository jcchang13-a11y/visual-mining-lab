/* 《剛吃飽》第八版｜爛尾樓版｜30390 閱讀地層補釘
 * 不改正文，只把原檔中明確的未決判斷／工作語標成 L3。
 * 這段保留「目前不清楚／正文暫時不強解」的施工現場，但不再冒充已定稿論述。
 */
(function(){
  'use strict';
  if(new URLSearchParams(location.search).get('u')!=='30390') return;
  const article=document.getElementById('article');
  if(!article) return;
  const anchor='這裡為什麼需要先用「大身」作為轉折例子，目前不清楚。感覺經文似乎也可以直接用菩薩舉例；除非「大身」和「菩薩」之間還有某種關係，但這個關係目前不明，所以正文暫時不強解。';

  function apply(){
    if(article.querySelector('[data-gcb-work-unresolved-30390="1"]')) return true;
    const walker=document.createTreeWalker(article,NodeFilter.SHOW_TEXT);
    let node;
    while((node=walker.nextNode())){
      const value=node.nodeValue||'';
      const at=value.indexOf(anchor);
      if(at<0) continue;
      const before=node.splitText(at);
      const after=before.splitText(anchor.length);
      const span=document.createElement('span');
      span.className='work-note work-note-line';
      span.dataset.gcbLayer='L3';
      span.dataset.gcbWorkUnresolved30390='1';
      span.textContent=anchor;
      before.replaceWith(span);
      return true;
    }
    return false;
  }

  if(apply()) return;
  const observer=new MutationObserver(()=>{if(apply())observer.disconnect()});
  observer.observe(article,{childList:true,subtree:true,characterData:true});
  setTimeout(()=>observer.disconnect(),15000);
})();
