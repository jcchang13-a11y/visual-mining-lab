/* 《剛吃飽》第八版｜爛尾樓版｜30280B 時間／空間回溯增補
 * 不改正文；只把第十分正文已明示的第六分時間線與第八分空間線接成回溯圖。
 */
(function(){
  'use strict';
  if(new URLSearchParams(location.search).get('u')!=='30280B') return;

  const specs=[
    {
      key:'retro-30280B-10-6-time',
      src:'figures/retro-30280B-10-6.svg',
      caption:'第十分把如來的過去拉進現在時，回看第六分已先把「如來滅後、後五百歲」的未來拉進現場：10 → 6',
      anchor:'前面第六分已經提到「如來滅後，後五百歲」，那是未來的聽聞者；現在第十分又提到如來過去在然燈佛所。課堂仍然在現在進行，但過去和未來都已經以不在場的方式進入這個現場。'
    },
    {
      key:'retro-30280B-10-8-space',
      src:'figures/retro-30280B-10-8.svg',
      caption:'第十分從「三千大千世界」推到「佛土」時，回接第八分剛打開的世界尺度：10 → 8',
      anchor:'空間也是這樣。第八分才剛把尺度推到「三千大千世界」，第十分接著說「莊嚴佛土」。這個佛土不能被想成地球上的某塊土地，也不能被縮成一間裝修得很莊嚴的寺廟。它和佛、菩薩、教化、願力、世界場域有關；至於三千大千世界、須彌山、三界、欲界諸天、佛土之間更細的基本地理，後面講到須彌山時再集中處理。這裡先知道一點就好：佛土不是地球上的房地產。'
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

  function insert(root,spec){
    if(root.querySelector('[data-retro-key="'+spec.key+'"]')) return true;
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
