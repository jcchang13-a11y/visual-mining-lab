/* 《剛吃飽》第八版｜爛尾樓版｜30450 第三十二分演說方法回溯增補
 * 只接正文可支持的結構性回返；不改正文、不取代既有福德線與第一分封口。
 */
(function(){
  'use strict';
  const unit=new URLSearchParams(location.search).get('u');
  if(unit!=='30450') return;

  const anchor='這就是最後的答案。不是不說，而是不取於相地說。不是躲進沉默，而是在演說中不住相。不是把經變成一套可交付的「法」，也不是把自己變成說經功德很大的主體，而是說的時候，不取於相，如如不動。';
  const specs=[
    {
      key:'retro-30450-32-4',
      src:'figures/retro-30450-32-4.svg',
      caption:'第三十二分以「不取於相」／「演說中不住相」的最後方法，回扣第四分「不住於相」的無住施工線：32 → 4'
    },
    {
      key:'retro-30450-32-21',
      src:'figures/retro-30450-32-21.svg',
      caption:'第三十二分要求為人演說而不把經變成可交付的「法」，回扣第二十一分對「如來有所說法」的拆解：32 → 21'
    },
    {
      key:'retro-30450-32-14',
      src:'figures/retro-30450-32-14.svg',
      caption:'第三十二分「如如不動」依正文自己的回看，接回第十四分「如是，如是」與「如語者」這條細線：32 → 14'
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

  function alreadyHas(root,spec){
    if(root.querySelector('[data-retro-key="'+spec.key+'"]')) return true;
    return Array.from(root.querySelectorAll('.retro-figure__img')).some(img=>{
      const raw=img.getAttribute('src')||'';
      return raw===spec.src || raw.endsWith('/'+spec.src);
    });
  }

  function apply(){
    const root=document.getElementById('article');
    if(!root) return false;
    const missing=specs.filter(spec=>!alreadyHas(root,spec));
    if(!missing.length) return true;

    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
    let node;
    while((node=walker.nextNode())){
      const at=(node.nodeValue||'').indexOf(anchor);
      if(at<0) continue;
      const tail=node.splitText(at+anchor.length);
      missing.forEach(spec=>{
        tail.parentNode.insertBefore(document.createTextNode('\n'),tail);
        tail.parentNode.insertBefore(makeFigure(spec),tail);
      });
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
