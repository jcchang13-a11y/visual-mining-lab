/* 《剛吃飽》第八版｜爛尾樓版｜30410A 第一分時間線直接回扣
 * 第十八分正文第二次明確叫回第一分，這次不是近景／空間，而是「食時」作為最日常時間。
 * 既有 18→1 近景圖與 18→16→15→14→6→1 長鏈都保留；本層只補這個獨立閱讀位置。
 */
(function(){
  'use strict';
  if(new URLSearchParams(location.search).get('u')!=='30410A') return;
  const article=document.getElementById('article');
  if(!article) return;
  const spec={
    key:'retro-30410A-18-1-time-direct',
    src:'figures/retro-30410A-18-1.svg',
    caption:'第十八分的時間線再次直接回扣第一分最日常的「食時」：18 → 1',
    anchor:'第一分有最日常的時間：「食時」。'
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

  function apply(){
    if(article.querySelector('[data-retro-key="'+spec.key+'"]')) return true;
    const walker=document.createTreeWalker(article,NodeFilter.SHOW_TEXT);
    let node;
    while((node=walker.nextNode())){
      if(node.parentElement?.closest('.sutra-block')) continue;
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
