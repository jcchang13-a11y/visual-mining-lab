/* 《剛吃飽》第八版｜爛尾樓版｜30440 第二十五至二十八分組內直接回扣
 * 不清場，只加鷹架：既有 28 → 27 → 26 → 25 長鏈保留；
 * 本層把正文逐一列出的組內回收拆成直接同心圓：28 → 25／26／27。
 */
(function(){
  'use strict';
  const unit=new URLSearchParams(location.search).get('u');
  if(unit!=='30440') return;
  const article=document.getElementById('article');
  if(!article) return;

  const specs=[
    {
      key:'retro-30440-28-25-direct',
      src:'figures/retro-30440-28-25.svg',
      caption:'第二十八分收住「高級主體的反撲」整組，直接回扣第二十五分救世主體：28 → 25',
      anchor:'第二十五分拆「我當度眾生」。不能有救世主體。'
    },
    {
      key:'retro-30440-28-26-direct',
      src:'figures/retro-30440-28-26.svg',
      caption:'第二十八分收住「高級主體的反撲」整組，直接回扣第二十六分辨認主體：28 → 26',
      anchor:'第二十六分拆「我能以三十二相辨認如來」。不能有辨認主體。'
    },
    {
      key:'retro-30440-28-27-direct',
      src:'figures/retro-30440-28-27.svg',
      caption:'第二十八分收住「高級主體的反撲」整組，直接回扣第二十七分懂空／斷滅主體：28 → 27',
      anchor:'第二十七分拆「我懂空，所以諸法斷滅」。不能有懂空主體。'
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

  function insert(spec){
    if(article.querySelector('[data-retro-key="'+spec.key+'"]')) return true;
    const walker=document.createTreeWalker(article,NodeFilter.SHOW_TEXT);
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
    let complete=true;
    specs.forEach(spec=>{if(!insert(spec)) complete=false;});
    return complete;
  }

  if(apply()) return;
  const observer=new MutationObserver(()=>{if(apply())observer.disconnect()});
  observer.observe(article,{childList:true,subtree:true,characterData:true});
  setTimeout(()=>observer.disconnect(),15000);
})();
