/* 《剛吃飽》第八版｜爛尾樓版｜30430 第十九分因緣時間網回溯
 * 不改正文；只把正文明確回看第十六分的因緣時間線接入閱讀層。
 */
(function(){
  'use strict';
  if(new URLSearchParams(location.search).get('u')!=='30430') return;
  const SPEC={
    key:'retro-30430-19-16',
    src:'figures/retro-30430-19-16.svg',
    caption:'第十九分解釋「以是因緣」時回到第十六分的跨世因果時間網：19 → 16',
    anchor:'第十六分已經把時間線弄得很複雜了：先世罪業，今世被人輕賤，先世罪業即為消滅，當得阿耨多羅三藐三菩提。那不是一條平面的交易線，不是我現在做 A，所以明天得到 B。它是一張跨過過去、現在、未來，甚至多生多世的因果網。'
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
