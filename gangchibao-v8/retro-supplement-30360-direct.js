/* 《剛吃飽》第八版｜爛尾樓版｜30360 第十四分直接回接層 */
(function(){
  'use strict';
  const unit=new URLSearchParams(location.search).get('u');
  if(unit!=='30360') return;

  const specs=[
    {
      key:'retro-30360-14-13',
      src:'figures/retro-30360-14-13.svg',
      caption:'第十四分把忍辱／身命布施直接回接第十三分已推到極大的身命布施：14 → 13',
      anchor:'現在，經文回頭處理另一邊：布施。而且不是普通布施，而是第十三分已經推到極大的身命布施。'
    },
    {
      key:'retro-30360-14-3',
      src:'figures/retro-30360-14-3.svg',
      caption:'第十四分把利益眾生與離四相直接回接第三分度眾生而不站在「我在度眾生」的位置：14 → 3',
      anchor:'第三分已經講過，菩薩度眾生，不能站在「我在度眾生」的位置上。'
    },
    {
      key:'retro-30360-14-4',
      src:'figures/retro-30360-14-4.svg',
      caption:'第十四分把不住色聲香味觸法而布施直接回接第四分無住相布施：14 → 4',
      anchor:'第四分講過，菩薩布施，不能住色聲香味觸法而布施。'
    },
    {
      key:'retro-30360-14-10',
      src:'figures/retro-30360-14-10.svg',
      caption:'第十四分把「應生無所住心」直接回接第十分「應無所住而生其心」：14 → 10',
      anchor:'第十分講過，應無所住而生其心。'
    }
  ];

  function already(root,spec){
    if(root.querySelector('[data-retro-key="'+spec.key+'"]')) return true;
    return Array.from(root.querySelectorAll('.retro-figure__img')).some(img=>{
      const src=img.getAttribute('src')||'';
      return src===spec.src || src.endsWith('/'+spec.src);
    });
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

  function place(root,spec){
    if(already(root,spec)) return true;
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
    let complete=true;
    specs.forEach(spec=>{if(!place(root,spec))complete=false;});
    return complete;
  }

  const article=document.getElementById('article');
  if(!article) return;
  if(apply()) return;
  const observer=new MutationObserver(()=>{if(apply())observer.disconnect()});
  observer.observe(article,{childList:true,subtree:true,characterData:true});
  setTimeout(()=>observer.disconnect(),15000);
})();
