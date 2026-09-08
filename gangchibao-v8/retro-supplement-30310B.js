/* 《剛吃飽》第八版｜第十三分前段回溯增補：13 → 12 → 11 */
(function(){
  'use strict';
  const unit=new URLSearchParams(location.search).get('u');
  if(unit!=='30310B') return;
  const specs=[
    {
      key:'retro-30310B-13-12-11',
      src:'figures/retro-30310B-13-12-11.svg',
      caption:'第十三分的命名／奉持問題，是在第十一、十二分已把此經的福德、場所與佛在場一路推高之後自然發生：13 → 12 → 11',
      anchor:'到了第十三分，須菩提問：「世尊，當何名此經？我等云何奉持？」這個問題不是單純問書名。前面已經把此經的福德、場所、供養、佛在場全部推起來了，現在問題自然變成：那這部經到底叫什麼？我們要怎麼承受它、保存它、流傳它？'
    }
  ];
  function alreadyPresent(root,spec){
    return !!root.querySelector('[data-retro-key="'+spec.key+'"], img[src="'+spec.src+'"]');
  }
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
  function insert(root,spec){
    if(alreadyPresent(root,spec)) return true;
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
    const root=document.getElementById('article');
    if(!root) return false;
    return specs.every(spec=>insert(root,spec));
  }
  const article=document.getElementById('article');
  if(!article) return;
  if(apply()) return;
  const observer=new MutationObserver(()=>{if(apply())observer.disconnect()});
  observer.observe(article,{childList:true,subtree:true,characterData:true});
  setTimeout(()=>observer.disconnect(),15000);
})();
