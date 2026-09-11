/* 《剛吃飽》第八版｜爛尾樓版｜30450 第三十一分→第三十分直接回溯
 * 不清場、不改正文。正文自己把一合相的貪著接到「見」與診斷位置；本層只把這條緊鄰回返接進 LIVE。
 */
(function(){
  'use strict';
  const unit=new URLSearchParams(location.search).get('u');
  if(unit!=='30450') return;
  const spec={
    key:'retro-30450-31-30',
    src:'figures/retro-30450-31-30.svg',
    caption:'第三十一分從第三十分「凡夫貪著一合相」緊接到「凡夫也貪著自己的見與診斷」：31 → 30',
    anchor:'第三十分剛說，一合相不可說，但凡夫之人貪著其事。第三十一分馬上把「見」抓出來。因為凡夫不只貪著東西，也貪著自己的看法。貪著我看到的世界，貪著我診斷出來的問題，貪著我掌握的概念。甚至連「我見」這個本來用來拆我的概念，也會被拿來貪著。'
  };
  function makeFigure(){
    const figure=document.createElement('figure'); figure.className='retro-figure'; figure.dataset.gcbLayer='retrospective'; figure.dataset.retroKey=spec.key;
    const img=document.createElement('img'); img.className='retro-figure__img'; img.src=spec.src; img.alt=spec.caption; img.loading='lazy'; img.decoding='async';
    const cap=document.createElement('figcaption'); cap.className='retro-figure__caption'; cap.textContent=spec.caption; figure.append(img,cap); return figure;
  }
  function apply(){
    const root=document.getElementById('article'); if(!root) return false;
    if(root.querySelector('[data-retro-key="'+spec.key+'"]')) return true;
    if(Array.from(root.querySelectorAll('.retro-figure__img')).some(img=>{const raw=img.getAttribute('src')||'';return raw===spec.src||raw.endsWith('/'+spec.src)})) return true;
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT); let node;
    while((node=walker.nextNode())){
      const at=(node.nodeValue||'').indexOf(spec.anchor); if(at<0) continue;
      const tail=node.splitText(at+spec.anchor.length);
      tail.parentNode.insertBefore(document.createTextNode('\n'),tail); tail.parentNode.insertBefore(makeFigure(),tail); tail.parentNode.insertBefore(document.createTextNode('\n'),tail); return true;
    }
    return false;
  }
  const article=document.getElementById('article'); if(!article) return;
  if(apply()) return;
  const observer=new MutationObserver(()=>{if(apply())observer.disconnect()}); observer.observe(article,{childList:true,subtree:true,characterData:true}); setTimeout(()=>observer.disconnect(),15000);
})();
