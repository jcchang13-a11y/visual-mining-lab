/* 《剛吃飽》第八版｜爛尾樓版｜30440 第二十八分回溯補件
 * 原層先補「不是一個世界，不是三千大千世界，而是恆河沙等世界」的尺度對照：28 → 8。
 * 2026-09-15 再讀第二十八分完整上下文：正文另明列「修善法」不能因不受福德而被取消，故追加 28 → 23。
 * 同一句反覆列舉還再次叫回「受持讀誦、為他人說」與「忍辱、利益眾生」；依「新閱讀位置可重現同一歷史關係」原則，補 28 → 15、28 → 14。
 * 既有 28 → 11、28 → 24、28 → 19、28 → 15 → 14 等線全部保留；本層不取代任何舊圖。
 * 不改正文；每條只認唯一 anchor；找不到就不插。
 */
(function(){
  'use strict';
  const unit=new URLSearchParams(location.search).get('u');
  if(unit!=='30440') return;

  const specs=[
    {
      key:'retro-30440-28-8-direct',
      src:'figures/retro-30440-28-8.svg',
      caption:'第二十八分把「恆河沙等世界」與前面的「三千大千世界」七寶布施作明確尺度對照：28 → 8',
      anchor:'如果有菩薩用滿恆河沙等世界七寶布施，這已經很大。不是一個世界，不是三千大千世界，而是恆河沙等世界。'
    },
    {
      key:'retro-30440-28-23-direct',
      src:'figures/retro-30440-28-23.svg',
      caption:'第二十八分說福德仍然要作，並明列「修善法」不能被取消，直接回扣第二十三分善法即非善法、是名善法：28 → 23',
      anchor:'福德是作出來的。布施、修善法、受持讀誦、為他人說、忍辱、利益眾生，這些都不是取消。'
    },
    {
      key:'retro-30440-28-list-15',
      src:'figures/retro-30440-28-list-15.svg',
      caption:'第二十八分在「福德是作出來的」的反覆列舉中再次叫回受持讀誦、為他人說：28 → 15',
      anchor:'福德是作出來的。布施、修善法、受持讀誦、為他人說、忍辱、利益眾生，這些都不是取消。'
    },
    {
      key:'retro-30440-28-list-14',
      src:'figures/retro-30440-28-list-14.svg',
      caption:'第二十八分在同一反覆列舉中再次叫回忍辱與利益眾生的第十四分現場：28 → 14',
      anchor:'福德是作出來的。布施、修善法、受持讀誦、為他人說、忍辱、利益眾生，這些都不是取消。'
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

  function alreadyHasFigure(root,spec){
    if(root.querySelector('[data-retro-key="'+spec.key+'"]')) return true;
    return Array.from(root.querySelectorAll('.retro-figure__img')).some(img=>{
      const raw=img.getAttribute('src')||'';
      return raw===spec.src || raw.endsWith('/'+spec.src);
    });
  }

  function insertSpec(root,spec){
    if(alreadyHasFigure(root,spec)) return true;
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
    let node;
    while((node=walker.nextNode())){
      const at=(node.nodeValue||'').indexOf(spec.anchor);
      if(at<0) continue;
      const tail=node.splitText(at+spec.anchor.length);
      tail.parentNode.insertBefore(document.createTextNode('\n'),tail);
      tail.parentNode.insertBefore(makeFigure(spec),tail);
      tail.parentNode.insertBefore(document.createTextNode('\n'),tail);
      return true;
    }
    return false;
  }

  function apply(){
    const root=document.getElementById('article');
    if(!root) return false;
    let settled=true;
    specs.forEach(spec=>{if(!insertSpec(root,spec)) settled=false;});
    return settled;
  }

  const article=document.getElementById('article');
  if(!article) return;
  if(apply()) return;
  const observer=new MutationObserver(()=>{if(apply())observer.disconnect()});
  observer.observe(article,{childList:true,subtree:true,characterData:true});
  setTimeout(()=>observer.disconnect(),15000);
})();