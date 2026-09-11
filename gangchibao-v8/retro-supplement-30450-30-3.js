/* 《剛吃飽》第八版｜爛尾樓版｜30450 第三十分→第三分一合相回溯
 * 不清場、不改正文。正文已把「我」明確解成一種一合相；本層只把這條結構回返接進 LIVE。
 */
(function(){
  'use strict';
  const unit=new URLSearchParams(location.search).get('u');
  if(unit!=='30450') return;
  const spec={
    key:'retro-30450-30-3',
    src:'figures/retro-30450-30-3.svg',
    caption:'第三十分把「一合相」從世界推回整部經最早拆的「我相」：很多成分合成一個「我」，但這個整體也不能坐實：30 → 3',
    anchor:'這裡也可以回頭看《金剛經》整部。它一直拆「我」，但「我」其實也是一合相。很多記憶、身體、願望、功德、痛苦、角色、語言、名字合在一起，於是我說：這是我。這一合，就很像真的。凡夫之人貪著其事。'
  };
  function makeFigure(){
    const figure=document.createElement('figure');
    figure.className='retro-figure';
    figure.dataset.gcbLayer='retrospective';
    figure.dataset.retroKey=spec.key;
    const img=document.createElement('img'); img.className='retro-figure__img'; img.src=spec.src; img.alt=spec.caption; img.loading='lazy'; img.decoding='async';
    const cap=document.createElement('figcaption'); cap.className='retro-figure__caption'; cap.textContent=spec.caption;
    figure.append(img,cap); return figure;
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
