/* 《剛吃飽》第八版｜爛尾樓版｜30350A 第二條第十四→第六分回溯
 * 不改正文；只在文本明示「後五百歲」再次回到第六分時補圖。
 */
(function(){
  'use strict';
  const spec={
    key:'retro-30350A-14-6-future',
    src:'figures/retro-30350A-14-6-future.svg',
    caption:'第十四分以「後五百歲」的未來聽眾問題再次回接第六分：14 → 6',
    anchor:'這裡的「後五百歲」也不是新冒出來的。第六分已經問過：如來滅後，後五百歲，有沒有眾生得聞如是言說章句，生實信不？到了第十四分，須菩提把同一個問題再說一次，只是說法變了：我現在得聞如是經典，信解受持，不足為難；真正難的是後五百歲的人，還能得聞是經，信解受持。'
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
    if(new URLSearchParams(location.search).get('u')!=='30350A') return true;
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