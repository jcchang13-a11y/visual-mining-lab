/* 《剛吃飽》第八版｜爛尾樓版｜30350A 第十四→第六分信心／實相回溯
 * 不改正文；保留既有「後五百歲」回溯，另補文本明示的淨信／實相回接。
 */
(function(){
  'use strict';
  const spec={
    key:'retro-30350A-14-6-faith',
    src:'figures/retro-30350A-14-6-faith.svg',
    caption:'第十四分以「信心清淨／實相」直接回接第六分「一念生淨信／以此為實」：14 → 6',
    anchor:'這裡的「信心清淨」，接的是第六分的「一念生淨信」；所謂淨信，就是能夠對「諸相非相」生信。也因此，第六分說這樣的人得「如是無量福德」，第十四分才說這樣的人「成就第一希有功德」。'
  };
  function makeFigure(){
    const figure=document.createElement('figure');
    figure.className='retro-figure';
    figure.dataset.gcbLayer='retrospective';
    figure.dataset.retroKey=spec.key;
    const img=document.createElement('img');
    img.className='retro-figure__img';
    img.src=spec.src;
    img.alt=spec.caption;
    img.loading='lazy';
    img.decoding='async';
    const cap=document.createElement('figcaption');
    cap.className='retro-figure__caption';
    cap.textContent=spec.caption;
    figure.append(img,cap);
    return figure;
  }
  function apply(){
    if(new URLSearchParams(location.search).get('u')!=='30350A') return true;
    const root=document.getElementById('article');
    if(!root) return false;
    if(root.querySelector('[data-retro-key="'+spec.key+'"]')) return true;
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
    let node;
    while((node=walker.nextNode())){
      const at=(node.nodeValue||'').indexOf(spec.anchor);
      if(at<0) continue;
      const tail=node.splitText(at+spec.anchor.length);
      tail.parentNode.insertBefore(document.createTextNode('\n'),tail);
      tail.parentNode.insertBefore(makeFigure(),tail);
      tail.parentNode.insertBefore(document.createTextNode('\n'),tail);
      return true;
    }
    return false;
  }
  const article=document.getElementById('article');
  if(!article) return;
  if(apply()) return;
  const observer=new MutationObserver(()=>{if(apply())observer.disconnect()});
  observer.observe(article,{childList:true,subtree:true,characterData:true});
  setTimeout(()=>observer.disconnect(),15000);
})();