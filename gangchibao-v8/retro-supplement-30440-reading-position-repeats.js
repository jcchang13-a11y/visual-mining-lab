/* 《剛吃飽》第八版｜爛尾樓版｜30440 同關係／不同閱讀位置補丁
 * 舊回溯層曾以 SVG src 全域去重，會把「同一歷史關係在新的閱讀位置再次出現」誤判成重複。
 * 不拆舊去重邏輯；只在已被正文再次明說的閱讀位置補回。正文與既有圖均不動。
 */
(function(){
  'use strict';
  if(new URLSearchParams(location.search).get('u')!=='30440') return;

  const specs=[
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
    figure.dataset.gcbRepeatReason='same-relation-new-reading-position';
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