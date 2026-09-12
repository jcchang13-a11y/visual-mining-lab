/* 《剛吃飽》第八版｜爛尾樓版｜30370 閱讀地層補釘
 * 不改正文，只把原檔中明確的改稿指令標成 L3 工作語。
 * 這句保留施工史，但不再冒充正式正文。
 */
(function(){
  'use strict';
  if(new URLSearchParams(location.search).get('u')!=='30370') return;
  const article=document.getElementById('article');
  if(!article) return;
  const anchor='對，這一段要從正文裡拿掉那種「正文先不展開」「詳細位置放註釋」的工作語言。重寫如下：';

  function apply(){
    if(article.querySelector('[data-gcb-work-rewrite-30370="1"]')) return true;
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
      span.dataset.gcbWorkRewrite30370='1';
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
