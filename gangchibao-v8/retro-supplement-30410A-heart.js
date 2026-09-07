/* 《剛吃飽》第八版｜爛尾樓版｜30410A 心線回溯增補
 * 忠於正文：第十八分明講「真正接回第十七分的，是下一句」。
 * 不改正文，只在唯一 anchor 後接同心圓圖。
 */
(function(){
  'use strict';
  const SPEC={
    key:'retro-30410A-heart-17',
    src:'figures/retro-30410A-heart-17.svg',
    caption:'第十八分把「諸心皆為非心，是名為心」接回第十七分的發心者拆解：18 → 17',
    anchor:'真正接回第十七分的，是下一句：「何以故？如來說諸心，皆為非心，是名為心。」'
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
    if(new URLSearchParams(location.search).get('u')!=='30410A') return true;
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
