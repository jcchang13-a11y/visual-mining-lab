/* 《剛吃飽》第八版｜爛尾樓版｜30270B 回溯增補層
 * 不改正文；只在第九分明確出現「不入色聲香味觸法」處補回第四分「不住色聲香味觸法」。
 */
(function(){
  'use strict';
  const SPEC={
    key:'retro-30270B-9-4',
    src:'figures/retro-30270B-9-4.svg',
    caption:'第九分「不入色聲香味觸法」回看第四分「不住色聲香味觸法」：9 → 4',
    anchor:'經文說得很具體：不入色，不入聲，不入香，不入味，不入觸，不入法。這個「入」不能落在任何一個可以被拿來確認自己的對象上。'
  };

  function makeFigure(){
    const figure=document.createElement('figure');
    figure.className='retro-figure';
    figure.dataset.gcbLayer='retrospective';
    figure.dataset.retroKey=SPEC.key;
    const img=document.createElement('img');
    img.className='retro-figure__img';
    img.src=SPEC.src;
    img.alt=SPEC.caption;
    img.loading='lazy';
    img.decoding='async';
    const cap=document.createElement('figcaption');
    cap.className='retro-figure__caption';
    cap.textContent=SPEC.caption;
    figure.append(img,cap);
    return figure;
  }

  function apply(){
    if(new URLSearchParams(location.search).get('u')!=='30270B') return true;
    const root=document.getElementById('article');
    if(!root) return false;
    if(root.querySelector('[data-retro-key="'+SPEC.key+'"]')) return true;
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
    let node;
    while((node=walker.nextNode())){
      const at=(node.nodeValue||'').indexOf(SPEC.anchor);
      if(at<0) continue;
      const tail=node.splitText(at+SPEC.anchor.length);
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
