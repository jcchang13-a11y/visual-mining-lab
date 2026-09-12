/* 《剛吃飽》第八版｜爛尾樓版｜30350A 第十四分直接回接第十三分
 * 不清場，只加鷹架：本單元正文先並列第十三分尾「身命布施／四句偈為人說」，
 * 隨即說第十四分要讓讀者看見這件看似較輕的聞經／信解究竟重在哪裡。
 * 這不是新造理論，而是把單元自己已經搭好的 14 → 13 結構轉成可見回溯圖。
 */
(function(){
  'use strict';
  const unit=new URLSearchParams(location.search).get('u');
  if(unit!=='30350A') return;
  const article=document.getElementById('article');
  if(!article) return;

  const spec={
    key:'retro-30350A-14-13-direct',
    src:'figures/retro-30360-14-13.svg',
    caption:'第十四分從聞經、信解與實相回看第十三分尾已經推到極限的身命布施／四句偈比較現場：14 → 13',
    anchor:'第十四分接下來要做的，就是讓我們看見，這件看起來比較輕的事，到底重在哪裡。'
  };

  function has(){
    if(article.querySelector('[data-retro-key="'+spec.key+'"]')) return true;
    return Array.from(article.querySelectorAll('.retro-figure__img')).some(img=>{
      const raw=img.getAttribute('src')||'';
      return raw===spec.src || raw.endsWith('/'+spec.src);
    });
  }

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
    if(has()) return true;
    const walker=document.createTreeWalker(article,NodeFilter.SHOW_TEXT);
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

  if(apply()) return;
  const observer=new MutationObserver(()=>{if(apply())observer.disconnect()});
  observer.observe(article,{childList:true,subtree:true,characterData:true});
  setTimeout(()=>observer.disconnect(),15000);
})();
