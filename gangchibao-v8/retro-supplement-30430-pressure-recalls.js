/* 《剛吃飽》第八版｜爛尾樓版｜30430 第二十四分壓力測試重複回溯
 * 同一歷史關係在新的閱讀位置再次被正文叫回時，允許再次出圖。
 * 既有 24 → 19、24 → 23 圖不取代；本層只補壓力測試句自己的閱讀位置。
 */
(function(){
  'use strict';
  const unit=new URLSearchParams(location.search).get('u');
  if(unit!=='30430') return;
  const article=document.getElementById('article');
  if(!article) return;

  const specs=[
    {
      key:'retro-30430-24-19-pressure',
      src:'figures/retro-30430-24-19-pressure.svg',
      caption:'第二十四分在最後壓力測試再次直接叫回第十九分「福德不能有實」：24 → 19',
      anchor:'你知道福德不能有實了嗎？'
    },
    {
      key:'retro-30430-24-23-pressure',
      src:'figures/retro-30430-24-23-pressure.svg',
      caption:'第二十四分在最後壓力測試再次直接叫回第二十三分「善法即非善法」：24 → 23',
      anchor:'你知道善法即非善法了嗎？'
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

  function insert(spec){
    if(article.querySelector('[data-retro-key="'+spec.key+'"]')) return true;
    const walker=document.createTreeWalker(article,NodeFilter.SHOW_TEXT);
    let node;
    while((node=walker.nextNode())){
      if(node.parentElement?.closest('.sutra-block')) continue;
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
    let complete=true;
    specs.forEach(spec=>{if(!insert(spec)) complete=false;});
    return complete;
  }

  if(apply()) return;
  const observer=new MutationObserver(()=>{if(apply())observer.disconnect()});
  observer.observe(article,{childList:true,subtree:true,characterData:true});
  setTimeout(()=>observer.disconnect(),15000);
})();
