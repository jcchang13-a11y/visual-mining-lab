/* 《剛吃飽》第八版｜爛尾樓版｜30320 第十三分「此經被一路吹大」尺度史回溯
 * 不改正文，不替代既有 13→10／13→7；只把本段明確重新叫回的前段現場逐一接出。
 * 圖沿用 30330 已有同一關係的同心圓原件，避免為同一條關係重畫一套。
 */
(function(){
  'use strict';
  const unit=new URLSearchParams(location.search).get('u');
  if(unit!=='30320') return;
  const article=document.getElementById('article');
  if(!article) return;

  const anchor='前面把此經一路吹大：須彌山、恆河沙、三千大千世界、七寶布施、天人阿修羅、佛塔廟、經典所在之處則為有佛，全部都被搬出來替此經墊高。';
  const specs=[
    {
      key:'retro-30320-13-12-scale-history',
      src:'figures/retro-30330-13-12.svg',
      caption:'第十三分在「此經被一路吹大」的回顧中，明確重新叫回第十二分經典所在之處如佛塔廟、則為有佛的現場：13 → 12'
    },
    {
      key:'retro-30320-13-11-scale-history',
      src:'figures/retro-30330-13-11.svg',
      caption:'第十三分在同一段尺度回顧中重新叫回第十一分恆河沙數世界與七寶布施：13 → 11'
    },
    {
      key:'retro-30320-13-8-scale-history',
      src:'figures/retro-30330-13-8.svg',
      caption:'第十三分把經典價值被放大的歷史再往前接回第八分七寶布施與受持四句偈的比較起點：13 → 8'
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

  function already(spec){
    return !!article.querySelector('[data-retro-key="'+spec.key+'"]');
  }

  function apply(){
    const missing=specs.filter(spec=>!already(spec));
    if(!missing.length) return true;
    const walker=document.createTreeWalker(article,NodeFilter.SHOW_TEXT);
    let node;
    while((node=walker.nextNode())){
      if(node.parentElement?.closest('.sutra-block')) continue;
      const at=(node.nodeValue||'').indexOf(anchor);
      if(at<0) continue;
      const tail=node.splitText(at+anchor.length);
      for(const spec of missing){
        tail.parentNode.insertBefore(document.createTextNode('\n'),tail);
        tail.parentNode.insertBefore(makeFigure(spec),tail);
      }
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
