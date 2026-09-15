/* 《剛吃飽》第八版｜爛尾樓版｜30440 第二十七分明列回溯補丁
 * 不清場：保留既有 direct / complete / structural；只補正文在此閱讀位置再次明列的關係。
 * LIVE 序列載入時，同關係／不同閱讀位置補丁也在本腳本執行期內完成，避免另開非同步支線。
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
    },
    {
      key:'retro-30440-25-21-reading-repeat',
      src:'figures/retro-30440-25-21.svg',
      caption:'第二十五分在「我當」句式的實際閱讀位置再次回扣第二十一分：25 → 21',
      anchor:'這句要跟第二十一分一起看。第二十一分說：\n\n「汝勿謂如來作是念：我當有所說法。」\n\n第二十五分說：\n\n「汝等勿謂如來作是念：我當度眾生。」'
    },
    {
      key:'retro-30440-26-25-reading-repeat',
      src:'figures/retro-30440-26-25.svg',
      caption:'第二十六分在「接第二十五分也很緊」的閱讀位置再次呈現主體拆解推進：26 → 25',
      anchor:'所以第二十六分接第二十五分也很緊。'
    },
    {
      key:'retro-30440-26-1-reading-repeat',
      src:'figures/retro-30440-26-1.svg',
      caption:'第二十六分在正文再次明說連回第一分的位置重現回溯：26 → 1',
      anchor:'第二十六分仍然要連回第一分。'
    },
    {
      key:'retro-30440-26-20-reading-repeat',
      src:'figures/retro-30440-26-20.svg',
      caption:'第二十六分在註釋再次明說回接第二十分的位置重現回溯：26 → 20',
      anchor:'第二十六分應回接第二十分。第二十分先拆具足色身與諸相具足，第二十六分把這個問題推到三十二相，並用轉輪聖王把辨認制度打爆。'
    },
    {
      key:'retro-30440-27-26-reading-repeat',
      src:'figures/retro-30440-27-26.svg',
      caption:'第二十七分在重新讀第二十六分「不應以相觀如來」的位置再次呈現：27 → 26',
      anchor:'第二十六分剛說，不應以三十二相觀如來。若以色見我，以音聲求我，是人行邪道，不能見如來。'
    },
    {
      key:'retro-30440-27-6-reading-repeat',
      src:'figures/retro-30440-27-6.svg',
      caption:'第二十七分在註釋再次明說回扣第六分的位置重現回溯：27 → 6',
      anchor:'第二十七分應回扣第六分「不應取法，不應取非法」。'
    }
  ];

  function makeFigure(spec){
    const figure=document.createElement('figure');
    figure.className='retro-figure';
    figure.dataset.gcbLayer='retrospective';
    figure.dataset.retroKey=spec.key;
    if(spec.key.includes('reading-repeat')) figure.dataset.gcbRepeatReason='same-relation-new-reading-position';
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

  /* 歷史接線保留：非 LIVE reader 仍可載入獨立 repeat 檔；因 data-retro-key 相同，已由本層補出的圖不會重複。
   * LIVE reader 宣告中央佇列所有權時不再另開非同步 script。
   */
  if(!window.GCBLiveOwnsScaffoldQueue){
    const repeat=document.createElement('script');
    repeat.src='retro-supplement-30440-reading-position-repeats.js?v=20260915-live70';
    repeat.dataset.gcbScaffold='30440-reading-position-repeats';
    document.head.appendChild(repeat);
  }
})();