/* 《剛吃飽》第八版｜爛尾樓版｜30450 第三十一分直回第二十一分
 * 正文與註釋都明確回扣：第三十一分不可把「我見」等做成固定診斷工具，
 * 對應第二十一分不可把「如來有所說法」做成可交付之物。
 * 只接這一條高信心結構回扣；不改正文，不改既有回溯層。
 */
(function(){
  'use strict';
  const unit=new URLSearchParams(location.search).get('u');
  if(unit!=='30450') return;

  const spec={
    key:'retro-30450-31-21',
    src:'figures/retro-30450-31-21.svg',
    caption:'第三十一分把「我見」等診斷名詞從固定工具中鬆開，直接回扣第二十一分對「有所說法」的拆解：31 → 21',
    anchor:'就像第二十一分說，若人言如來有所說法，即為謗佛。不是佛沒有說法，而是不能把法做成可交付之物。第三十一分也是這樣。不是佛沒有說我見、人見、眾生見、壽者見，而是不能把這些見做成有實的診斷工具。'
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
