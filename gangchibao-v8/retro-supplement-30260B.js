/* 《剛吃飽》第八版｜爛尾樓版｜30260B 回溯增補
 * 忠於正文既有回指，不改正文。
 * 2026-09-10：保留原 8 → 4 直返，再補正文已明說的「法」長鏈 8 → 7 → 6 → 4 → 3。
 */
(function(){
  'use strict';
  const unit=new URLSearchParams(location.search).get('u');
  if(unit!=='30260B') return;
  const article=document.getElementById('article');
  if(!article) return;

  const retros=[
    {
      key:'retro-30260B-8-7-6-4-3',
      anchor:'這樣看下來，「法」不是到第八分才突然變重要。',
      src:'figures/retro-30260B-8-7-6-4-3.svg',
      caption:'第八分把「法」這條線一路倒回第七分、第六分、第四分，再抵達第三分尚未命名的度眾生／無我結構：8 → 7 → 6 → 4 → 3'
    },
    {
      key:'retro-30260B-8-4',
      anchor:'這一句其實是第四分那個說法的複雜版。',
      src:'figures/retro-30260B-8-4.svg',
      caption:'第八分以「福德即非福德性」回看第四分不住相布施與福德不可思量：8 → 4'
    }
  ];

  function makeFigure(spec){
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

  function insertAfterAnchor(spec){
    if(article.querySelector('[data-retro-key="'+spec.key+'"]')) return true;
    const walker=document.createTreeWalker(article,NodeFilter.SHOW_TEXT);
    let node;
    while((node=walker.nextNode())){
      const at=(node.nodeValue||'').indexOf(spec.anchor);
      if(at<0) continue;
      const tail=node.splitText(at+spec.anchor.length);
      tail.parentNode.insertBefore(document.createTextNode('\n'),tail);
      tail.parentNode.insertBefore(makeFigure(spec),tail);
      tail.parentNode.insertBefore(document.createTextNode('\n'),tail);
      return true;
    }
    return false;
  }

  function apply(){
    let all=true;
    retros.forEach(spec=>{if(!insertAfterAnchor(spec)) all=false;});
    return all;
  }

  if(apply()) return;
  const observer=new MutationObserver(()=>{if(apply())observer.disconnect()});
  observer.observe(article,{childList:true,subtree:true,characterData:true});
  setTimeout(()=>observer.disconnect(),15000);
})();