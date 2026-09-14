/* 《剛吃飽》第八版｜爛尾樓版｜30440 四相回溯增補
 * 第二十七分把「無我、無人、無眾生、無壽者」列入容易被誤讀成斷滅的材料。
 * 這裡不把它壓成單一直接引用，而沿既有四相施工史回看：27 → 25 → 17 → 14 → 6 → 3。
 * 不改正文；只在唯一可支持的原句後加同心圓鷹架。
 */
(function(){
  'use strict';
  const unit=new URLSearchParams(location.search).get('u');
  if(unit!=='30440') return;

  const spec={
    key:'retro-30440-27-fourmarks-history',
    src:'figures/retro-30440-27-fourmarks-history.svg',
    caption:'第二十七分把四相也列入「不可誤讀成斷滅」的材料，沿既有四相施工史往前回看：27 → 25 → 17 → 14 → 6 → 3',
    anchor:'有人聽到不應以相見如來，聽到無我、無人、無眾生、無壽者，聽到無有少法可得，聽到善法即非善法，就以為《金剛經》在說一切都沒有。'
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
