/* 《剛吃飽》第八版｜爛尾樓版｜30450 第三十二分聞法散場→第一分如是我聞
 * 不清場、不改正文。只接正文註釋已明說的全經封口：從「如是我聞」開始，以「聞佛所說」收束。
 */
(function(){
  'use strict';
  const unit=new URLSearchParams(location.search).get('u');
  if(unit!=='30450') return;

  const spec={
    key:'retro-30450-32-1-hearing',
    src:'figures/retro-30450-32-1-hearing.svg',
    caption:'第三十二分以「聞佛所說，皆大歡喜，信受奉行」回扣第一分「如是我聞」：全經從聞開始，也從聞收束。32 → 1',
    anchor:'最後「聞佛所說，皆大歡喜，信受奉行」應回扣第一分「如是我聞」。全經從聞開始，也從聞收束。第一分的飯後身體與第三十二分的聞法大眾互相封口：經文不是逃離現場，而是在現場中不住於相。'
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

  function alreadyHas(root){
    if(root.querySelector('[data-retro-key="'+spec.key+'"]')) return true;
    return Array.from(root.querySelectorAll('.retro-figure__img')).some(img=>{
      const raw=img.getAttribute('src')||'';
      return raw===spec.src || raw.endsWith('/'+spec.src);
    });
  }

  function apply(){
    const root=document.getElementById('article');
    if(!root) return false;
    if(alreadyHas(root)) return true;
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
