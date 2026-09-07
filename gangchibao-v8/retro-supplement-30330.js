/* 《剛吃飽》第八版｜爛尾樓版｜30330 回溯增補
 * 忠於正文既有尺度回指，不改正文。
 */
(function(){
  'use strict';
  const unit=new URLSearchParams(location.search).get('u');
  if(unit!=='30330') return;
  const article=document.getElementById('article');
  if(!article) return;

  const key='retro-30330-13-12-11-10-8';
  const anchor='前面才剛剛把此經吹到非常大。須彌山、恆河沙、三千大千世界、恆河沙數三千大千世界、七寶布施、佛塔廟、經典所在之處則為有佛，全部都被搬出來。';
  const caption='第十三分世界／微塵的尺度插題回看此前一路放大的經典現場與宇宙尺度：13 → 12 → 11 → 10 → 8';

  function makeFigure(){
    const figure=document.createElement('figure');
    figure.className='retro-figure';
    figure.dataset.gcbLayer='retrospective';
    figure.dataset.retroKey=key;
    const img=document.createElement('img');
    img.className='retro-figure__img';
    img.src='figures/retro-30330-13-12-11-10-8.svg';
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
