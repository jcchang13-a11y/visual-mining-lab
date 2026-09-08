/* 《剛吃飽》第八版｜爛尾樓版｜30370 第十五分場所回溯增補
 * 不清正文；只把正文已明確點出的第十二分「經典所在之處」力線接回。
 */
(function(){
  'use strict';
  const unit=new URLSearchParams(location.search).get('u');
  if(unit!=='30370') return;
  const article=document.getElementById('article');
  if(!article) return;

  const spec={
    key:'retro-30370-15-12',
    src:'figures/retro-30370-15-12.svg',
    caption:'第十五分「在在處處，若有此經／此處則為是塔」把經典所在之處與供養場所的力線重新接回第十二分：15 → 12',
    anchor:'這一段延續第十二分「經典所在之處，即為有佛，若尊重弟子」的力線：此經一旦被受持、讀誦、為人解說，就不再只停留於原初法會現場，而會在新的地方形成新的經文現場。'
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

  function alreadyHasFigure(){
    if(article.querySelector('[data-retro-key="'+spec.key+'"]')) return true;
    return Array.from(article.querySelectorAll('.retro-figure__img')).some(img=>{
      const raw=img.getAttribute('src')||'';
      return raw===spec.src || raw.endsWith('/'+spec.src);
    });
  }

  function apply(){
    if(alreadyHasFigure()) return true;
    const walker=document.createTreeWalker(article,NodeFilter.SHOW_TEXT);
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

  if(apply()) return;
  const observer=new MutationObserver(()=>{if(apply())observer.disconnect()});
  observer.observe(article,{childList:true,subtree:true,characterData:true});
  setTimeout(()=>observer.disconnect(),15000);
})();
