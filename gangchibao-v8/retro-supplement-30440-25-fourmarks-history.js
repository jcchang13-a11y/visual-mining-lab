/* 《剛吃飽》第八版｜爛尾樓版｜30440 第二十五分四相回溯增補
 * 第二十五分不只回到第三、十七分的「度眾生」命題；正文又把我、人、眾生、壽者逐項叫回來。
 * 沿既有四相施工史往前看：25 → 17 → 14 → 6 → 3。
 * 不改正文；只在唯一可支持的原句後加同心圓鷹架。
 */
(function(){
  'use strict';
  const unit=new URLSearchParams(location.search).get('u');
  if(unit!=='30440') return;

  const spec={
    key:'retro-30440-25-fourmarks-history',
    src:'figures/retro-30440-25-fourmarks-history.svg',
    caption:'第二十五分把「我度眾生」裡的四相重新叫回來，沿既有四相施工史往前回看：25 → 17 → 14 → 6 → 3',
    anchor:'這句很重。不是凡夫才會有四相。只要把如來放進「我度眾生」的結構裡，如來也會被四相抓住。因為這個結構裡必然有我，有人，有眾生，有壽者。'
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

/* 同一回溯關係在新的閱讀位置再次出現：第二十五分註釋又明說應與第二十一分並讀。
 * 不用「前面已有 25 → 21」作為去重理由；直接重用既有 SVG，不另造圖。
 * 上方四相施工仍原樣保留，這段故意接在舊腳手架後面。
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
    const figure=document.createElement('figure');figure.className='retro-figure';figure.dataset.gcbLayer='retrospective';figure.dataset.retroKey=spec.key;
    const img=document.createElement('img');img.className='retro-figure__img';img.src=spec.src;img.alt=spec.caption;img.loading='lazy';img.decoding='async';
    const cap=document.createElement('figcaption');cap.className='retro-figure__caption';cap.textContent=spec.caption;figure.append(img,cap);return figure;
  }
  function apply(){
    const root=document.getElementById('article');if(!root)return false;if(root.querySelector('[data-retro-key="'+spec.key+'"]'))return true;
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let node;
    while((node=walker.nextNode())){const at=(node.nodeValue||'').indexOf(spec.anchor);if(at<0)continue;const tail=node.splitText(at+spec.anchor.length);tail.parentNode.insertBefore(document.createTextNode('\n'),tail);tail.parentNode.insertBefore(makeFigure(),tail);tail.parentNode.insertBefore(document.createTextNode('\n'),tail);return true;}return false;
  }
  const article=document.getElementById('article');if(!article)return;if(apply())return;const observer=new MutationObserver(()=>{if(apply())observer.disconnect()});observer.observe(article,{childList:true,subtree:true,characterData:true});setTimeout(()=>observer.disconnect(),15000);
})();
