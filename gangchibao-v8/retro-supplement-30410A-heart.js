/* 《剛吃飽》第八版｜爛尾樓版｜30410A 回溯增補
 * 忠於正文：第十八分明講「真正接回第十七分的，是下一句」；也直接把第一分近景重新打開成超維現場。
 * 不改正文，只在唯一 anchor 後接同心圓圖；保留既有空間鏈與時間鏈。
 */
(function(){
  'use strict';
  const SPECS=[
    {
      key:'retro-30410A-heart-17',
      src:'figures/retro-30410A-heart-17.svg',
      caption:'第十八分把「諸心皆為非心，是名為心」接回第十七分的發心者拆解：18 → 17',
      anchor:'真正接回第十七分的，是下一句：「何以故？如來說諸心，皆為非心，是名為心。」'
    },
    {
      key:'retro-30410A-18-1',
      src:'figures/retro-30410A-18-1.svg',
      caption:'第十八分把第一分飯後近景直接重新打開成超維現場：18 → 1',
      anchor:'第十八分不是推翻第一分，而是突然切鏡頭。'
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

  function insertSpec(root,spec){
    if(root.querySelector('[data-retro-key="'+spec.key+'"]')) return true;
    if(root.querySelector('img[src="'+spec.src+'"]')) return true;
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
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
    if(new URLSearchParams(location.search).get('u')!=='30410A') return true;
    const root=document.getElementById('article');
    if(!root) return false;
    return SPECS.map(spec=>insertSpec(root,spec)).every(Boolean);
  }

  const article=document.getElementById('article');
  if(!article) return;
  if(apply()) return;
  const observer=new MutationObserver(()=>{if(apply())observer.disconnect()});
  observer.observe(article,{childList:true,subtree:true,characterData:true});
  setTimeout(()=>observer.disconnect(),15000);
})();
