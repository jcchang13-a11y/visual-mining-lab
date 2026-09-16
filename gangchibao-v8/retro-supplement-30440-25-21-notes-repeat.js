/* 《剛吃飽》第八版｜爛尾樓版｜30440 第二十五分註釋再回第二十一分
 * 同一 25 → 21 關係在正文與註釋兩個閱讀位置都被文本明說。
 * 不因圖已在前文出現而去重；重用既有 SVG，在註釋實際閱讀位置再架一次。
 */
(function(){
  'use strict';
  const unit=new URLSearchParams(location.search).get('u');
  if(unit!=='30440') return;

  const spec={
    key:'retro-30440-25-21-notes-repeat',
    src:'figures/retro-30440-25-21.svg',
    caption:'第二十五分註釋再次明確要求與第二十一分並讀：兩者都拆如來位置上的「我當」任務主體：25 → 21',
    anchor:'第二十五分應與第二十一分並讀。第二十一分拆「我當有所說法」，第二十五分拆「我當度眾生」。兩者都針對如來位置，防止如來被固定成任務主體。'
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

  function apply(){
    const root=document.getElementById('article');
    if(!root) return false;
    if(root.querySelector('[data-retro-key="'+spec.key+'"]')) return true;
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
