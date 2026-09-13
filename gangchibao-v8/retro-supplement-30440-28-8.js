/* 《剛吃飽》第八版｜爛尾樓版｜30440 第二十八分尺度回溯補件
 * 正文在「不是一個世界，不是三千大千世界，而是恆河沙等世界」明確用前一輪布施尺度作對照。
 * 既有 28 → 11（恆河沙放大）保留；本層只補被省掉的 28 → 8（三千大千世界七寶布施）。
 * 不改正文；只認唯一 anchor；找不到就不插。
 */
(function(){
  'use strict';
  const unit=new URLSearchParams(location.search).get('u');
  if(unit!=='30440') return;

  const spec={
    key:'retro-30440-28-8-direct',
    src:'figures/retro-30440-28-8.svg',
    caption:'第二十八分把「恆河沙等世界」與前面的「三千大千世界」七寶布施作明確尺度對照：28 → 8',
    anchor:'如果有菩薩用滿恆河沙等世界七寶布施，這已經很大。不是一個世界，不是三千大千世界，而是恆河沙等世界。'
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

  function apply(){
    const root=document.getElementById('article');
    if(!root||alreadyHasFigure(root)) return !!root;
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