/* 《剛吃飽》第八版｜爛尾樓版｜30440 第二十七分中段明列材料回溯
 * 同一結構在新的閱讀位置再次出現，也應在該位置重新搭鷹架。
 * 此句同時重新點名第二十六分「不應以相見如來」、第二十二分「無有少法可得」、第二十三分「善法即非善法」。
 * 四相另由 retro-supplement-30440-fourmarks.js 沿既有四相施工史處理；本層不重複那條長鏈。
 * 不改正文，不取代既有 27 → 26／22／23 其他閱讀位置的圖。
 */
(function(){
  'use strict';
  const unit=new URLSearchParams(location.search).get('u');
  if(unit!=='30440') return;

  const anchor='有人聽到不應以相見如來，聽到無我、無人、無眾生、無壽者，聽到無有少法可得，聽到善法即非善法，就以為《金剛經》在說一切都沒有。';
  const specs=[
    {
      key:'retro-30440-27-list-26-repeat',
      src:'figures/retro-30440-27-list-26.svg',
      caption:'第二十七分在這個新的閱讀位置再次提到「不應以相見如來」，重新回扣第二十六分：27 → 26'
    },
    {
      key:'retro-30440-27-list-22-repeat',
      src:'figures/retro-30440-27-list-22.svg',
      caption:'第二十七分在同一句再次提到「無有少法可得」，重新回扣第二十二分：27 → 22'
    },
    {
      key:'retro-30440-27-list-23-repeat',
      src:'figures/retro-30440-27-list-23.svg',
      caption:'第二十七分在同一句再次提到「善法即非善法」，重新回扣第二十三分：27 → 23'
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

  function apply(){
    const root=document.getElementById('article');
    if(!root) return false;
    if(specs.every(spec=>root.querySelector('[data-retro-key="'+spec.key+'"]'))) return true;
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
    let node;
    while((node=walker.nextNode())){
      const at=(node.nodeValue||'').indexOf(anchor);
      if(at<0) continue;
      const tail=node.splitText(at+anchor.length);
      const parent=tail.parentNode;
      parent.insertBefore(document.createTextNode('\n'),tail);
      specs.forEach(spec=>{
        if(root.querySelector('[data-retro-key="'+spec.key+'"]')) return;
        parent.insertBefore(makeFigure(spec),tail);
        parent.insertBefore(document.createTextNode('\n'),tail);
      });
      return true;
    }
    return false;
  }

  const article=document.getElementById('article');
  if(!article) return;
  if(!apply()){
    const observer=new MutationObserver(()=>{if(apply())observer.disconnect()});
    observer.observe(article,{childList:true,subtree:true,characterData:true});
    setTimeout(()=>observer.disconnect(),15000);
  }

  /* 施工補丁：舊 direct 層會以 SVG src 全域去重，因而吃掉同一關係在另一閱讀位置的再次出現。
   * 不拆舊線；等本層完成後，再接一條只按 reading-position key 去重的補丁。
   */
  const repeat=document.createElement('script');
  repeat.src='retro-supplement-30440-reading-position-repeats.js?v=20260915-live69';
  repeat.dataset.gcbScaffold='30440-reading-position-repeats';
  document.head.appendChild(repeat);
})();
