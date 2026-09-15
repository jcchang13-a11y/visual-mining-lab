/* 《剛吃飽》第八版｜爛尾樓版｜30440 第二十七分明列回溯補丁
 * 不清場：保留既有 direct / complete / structural；只補正文在此閱讀位置再次明列的關係。
 */
(function(){
  'use strict';
  if(new URLSearchParams(location.search).get('u')!=='30440') return;

  const specs=[
    {
      key:'retro-30440-27-26-explicit-list',
      src:'figures/retro-30440-27-26.svg',
      caption:'第二十七分在「你不能把這句單獨讀」的明列位置再次回到第二十六分：27 → 26',
      anchor:'第二十七分要跟前面幾分一起讀。'
    },
    {
      key:'retro-30440-27-6-explicit-list',
      src:'figures/retro-30440-27-6.svg',
      caption:'第二十七分在防止斷滅誤讀時再次回扣第六分：27 → 6',
      anchor:'「不應取法，不應取非法。」'
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
  if(!apply()){
    const observer=new MutationObserver(()=>{if(apply())observer.disconnect()});
    observer.observe(article,{childList:true,subtree:true,characterData:true});
    setTimeout(()=>observer.disconnect(),15000);
  }

  /* 施工補丁：舊 direct 層會以 SVG src 全域去重，因而吃掉同一關係在另一閱讀位置的再次出現。
   * 不拆舊線；非 LIVE reader 仍由這條歷史接線載入。LIVE 已有中央序列佇列時則讓中央接管，避免重新引入非同步搶跑。
   */
  if(!window.GCBLiveOwnsScaffoldQueue){
    const repeat=document.createElement('script');
    repeat.src='retro-supplement-30440-reading-position-repeats.js?v=20260915-live70';
    repeat.dataset.gcbScaffold='30440-reading-position-repeats';
    document.head.appendChild(repeat);
  }
})();