/* 《剛吃飽》第八版｜爛尾樓版｜30320 回溯增補
 * 忠於正文既有回指，不改正文。
 */
(function(){
  'use strict';
  const unit=new URLSearchParams(location.search).get('u');
  if(unit!=='30320') return;
  const article=document.getElementById('article');
  if(!article) return;

  const key='retro-30320-13-10';
  const anchor='前面才剛說過：「佛說非身，是名大身。」這裡的「是名」不是普通貼標籤';
  const caption='第十三分以「般若波羅蜜即非般若波羅蜜」回看第十分「佛說非身，是名大身」的同一台是名機器：13 → 10';

  function makeFigure(){
    const figure=document.createElement('figure');
    figure.className='retro-figure';
    figure.dataset.gcbLayer='retrospective';
    figure.dataset.retroKey=key;
    const img=document.createElement('img');
    img.className='retro-figure__img';
    img.src='figures/retro-30320-13-10.svg';
    img.alt=caption;
    img.loading='lazy';
    img.decoding='async';
    const cap=document.createElement('figcaption');
    cap.className='retro-figure__caption';
    cap.textContent=caption;
    figure.append(img,cap);
    return figure;
  }

  function apply(){
    if(article.querySelector('[data-retro-key="'+key+'"]')) return true;
    const walker=document.createTreeWalker(article,NodeFilter.SHOW_TEXT);
    let node;
    while((node=walker.nextNode())){
      const at=(node.nodeValue||'').indexOf(anchor);
      if(at<0) continue;
      const tail=node.splitText(at+anchor.length);
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