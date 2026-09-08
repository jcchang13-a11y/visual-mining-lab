/* 《剛吃飽》第八版｜爛尾樓版｜30450 第一分直接回返增補
 * 不清場，只把 repo 既有但懸空的 29 → 1 同心圓接回正文。
 */
(function(){
  'use strict';
  const unit=new URLSearchParams(location.search).get('u');
  if(unit!=='30450') return;

  const spec={
    key:'retro-30450-29-1-direct',
    src:'figures/retro-30450-29-first.svg',
    caption:'第二十九分以如來的來去坐臥直接回看第一分飯後現場：29 → 1',
    anchor:'這對第一分很重要。第一分寫得那麼日常，容易讓人覺得佛就是在那裡：那一天，那個城，那條路，那個園子，那個飯後坐下的身體。這些當然重要，因為經就是從那裡開場。但如果你把如來縮進那個現場，說如來就是這個有來去坐臥的人，那第二十九分就會說：你不解我所說義。'
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

  function alreadyHasFigure(root){
    if(root.querySelector('[data-retro-key="'+spec.key+'"]')) return true;
    return Array.from(root.querySelectorAll('.retro-figure__img')).some(img=>{
      const raw=img.getAttribute('src')||'';
      return raw===spec.src || raw.endsWith('/'+spec.src);
    });
  }

  function apply(){
    const root=document.getElementById('article');
    if(!root) return false;
    if(alreadyHasFigure(root)) return true;
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
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

  const article=document.getElementById('article');
  if(!article) return;
  if(apply()) return;
  const observer=new MutationObserver(()=>{if(apply())observer.disconnect()});
  observer.observe(article,{childList:true,subtree:true,characterData:true});
  setTimeout(()=>observer.disconnect(),15000);
})();
