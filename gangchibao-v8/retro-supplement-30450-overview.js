/* 《剛吃飽》第八版｜爛尾樓版｜30450 最後清場總覽回溯增補層
 * 不清場，只把正文總覽已明說的前段施工線逐一接回。
 */
(function(){
  'use strict';
  const unit=new URLSearchParams(location.search).get('u');
  if(unit!=='30450') return;

  const recapAnchor='前面已經拆過很多東西。福德不能有實，色身不能當地基，說法沒有一包「法」可以交付，阿耨多羅三藐三菩提無有少法可得，善法即非善法，是名善法。';
  const highSelfAnchor='接著第二十五到第二十八分，又把那些更高級的「我」抓出來：我當度眾生、我能辨認如來、我懂空所以諸法斷滅、我作福德但我不受福德。';

  const specs=[
    {key:'retro-30450-overview-19',src:'figures/retro-30450-overview-19.svg',caption:'二十九至三十二分總覽先把第十九分「福德不能有實」重新叫回來：29–32 overview → 19',anchor:recapAnchor},
    {key:'retro-30450-overview-20',src:'figures/retro-30450-overview-20.svg',caption:'二十九至三十二分總覽把第二十分色身不能作地基重新叫回來：29–32 overview → 20',anchor:recapAnchor},
    {key:'retro-30450-overview-21',src:'figures/retro-30450-overview-21.svg',caption:'二十九至三十二分總覽把第二十一分「說法沒有一包法可以交付」重新叫回來：29–32 overview → 21',anchor:recapAnchor},
    {key:'retro-30450-overview-22',src:'figures/retro-30450-overview-22.svg',caption:'二十九至三十二分總覽把第二十二分「無有少法可得」重新叫回來：29–32 overview → 22',anchor:recapAnchor},
    {key:'retro-30450-overview-23',src:'figures/retro-30450-overview-23.svg',caption:'二十九至三十二分總覽把第二十三分「善法即非善法，是名善法」重新叫回來：29–32 overview → 23',anchor:recapAnchor},
    {key:'retro-30450-overview-25-28',src:'figures/retro-30450-overview-25-28.svg',caption:'最後清場總覽把第二十五至二十八分四個高級主體位置整組回看：29–32 overview → 28 → 27 → 26 → 25',anchor:highSelfAnchor}
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

  function alreadyHasFigure(root,spec){
    if(root.querySelector('[data-retro-key="'+spec.key+'"]')) return true;
    return Array.from(root.querySelectorAll('.retro-figure__img')).some(img=>{
      const raw=img.getAttribute('src')||'';
      return raw===spec.src || raw.endsWith('/'+spec.src);
    });
  }

  function insert(root,spec){
    if(!root||alreadyHasFigure(root,spec)) return true;
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
    /* 同一 anchor 連續補多張圖時，splitText 會把後插者放到前面。
       倒序施工只校準可見次序，讓 19→20→21→22→23 依正文列舉順序落下；不動任何正文或既有圖。 */
    return specs.slice().reverse().every(spec=>insert(root,spec));
  }

  const article=document.getElementById('article');
  if(!article) return;
  if(apply()) return;
  const observer=new MutationObserver(()=>{if(apply())observer.disconnect()});
  observer.observe(article,{childList:true,subtree:true,characterData:true});
  setTimeout(()=>observer.disconnect(),15000);
})();
