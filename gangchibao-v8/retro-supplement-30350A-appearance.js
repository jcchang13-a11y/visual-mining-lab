/* 《剛吃飽》第八版｜爛尾樓版｜30350A 第十四→第五分回溯
 * 不改正文；只在文本明示「諸相非相」作為實相／四相共同理由時補圖。
 */
(function(){
  'use strict';
  const spec={
    key:'retro-30350A-14-5-appearance',
    src:'figures/retro-30350A-14-5.svg',
    caption:'第十四分以「諸相非相」作為實相／四相共同理由，回接第五分：14 → 5',
    anchor:'一個說「生」，一個說「無」，看起來好像方向相反，可是它們根據的是同一套理由：諸相非相。'
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