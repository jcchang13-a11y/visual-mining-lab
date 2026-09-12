/* 《剛吃飽》第八版｜爛尾樓版｜30450 第三十一分四相歷次回溯
 * 正文自己明列：第三、六、十四、十七、二十五分都曾談四相；
 * 第三十一分把「相」換成「見」，因此這不是另造關係，而是把文本已點名的歷次回點逐一顯影。
 * 同心圓按由近到遠的閱讀回溯次序：31 → 25 → 17 → 14 → 6 → 3。
 * 不改正文，不取代既有 31→21、31→30 等回溯圖。
 */
(function(){
  'use strict';
  const unit=new URLSearchParams(location.search).get('u');
  if(unit!=='30450') return;

  const spec={
    key:'retro-30450-31-fourmarks-history',
    src:'figures/retro-30450-31-fourmarks-history.svg',
    caption:'第三十一分把「相」換成「見」時，正文自己點名四相先前的五個回點；沿閱讀時間由近往遠退回：31 → 25 → 17 → 14 → 6 → 3',
    anchor:'我相、人相、眾生相、壽者相，前面講太多次了。第三分講過，第六分講過，第十四分講過，第十七分講過，第二十五分又講過。'
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

  function alreadyHasFigure(root){
    if(root.querySelector('[data-retro-key="'+spec.key+'"]')) return true;
    return Array.from(root.querySelectorAll('.retro-figure__img')).some(img=>{
      const raw=img.getAttribute('src')||'';
      return raw===spec.src || raw.endsWith('/'+spec.src);
    });
  }

  function insert(root){
    if(!root||alreadyHasFigure(root)) return true;
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
  if(insert(article)) return;
  const observer=new MutationObserver(()=>{if(insert(article))observer.disconnect()});
  observer.observe(article,{childList:true,subtree:true,characterData:true});
  setTimeout(()=>observer.disconnect(),15000);
})();
