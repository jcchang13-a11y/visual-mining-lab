/* 《剛吃飽》第八版｜爛尾樓版｜30430 因緣／功德比較回溯補線
 * 不改正文；保留原第十九分因緣時間網，另把第二十四分正文再次叫回的早期功德比較史接入閱讀層。
 */
(function(){
  'use strict';
  if(new URLSearchParams(location.search).get('u')!=='30430') return;
  const SPECS=[
    {
      key:'retro-30430-19-16',
      src:'figures/retro-30430-19-16.svg',
      caption:'第十九分解釋「以是因緣」時回到第十六分的跨世因果時間網：19 → 16',
      anchor:'第十六分已經把時間線弄得很複雜了：先世罪業，今世被人輕賤，先世罪業即為消滅，當得阿耨多羅三藐三菩提。那不是一條平面的交易線，不是我現在做 A，所以明天得到 B。它是一張跨過過去、現在、未來，甚至多生多世的因果網。'
    },
    {
      key:'retro-30430-24-11-8',
      src:'figures/retro-30430-24-11-8.svg',
      caption:'第二十四分再把「受持讀誦、為他人說，其福勝彼」開回來時，回到第十一分與第八分兩次早期功德比較：24 → 11 → 8',
      anchor:'前面一直說受持讀誦、為他人說，其福勝彼。'
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
    return SPECS.every(spec=>insert(root,spec));
  }

  const article=document.getElementById('article');
  if(!article) return;
  if(apply()) return;
  const observer=new MutationObserver(()=>{if(apply())observer.disconnect()});
  observer.observe(article,{childList:true,subtree:true,characterData:true});
  setTimeout(()=>observer.disconnect(),15000);
})();
