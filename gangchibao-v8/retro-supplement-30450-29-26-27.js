/* 《剛吃飽》第八版｜爛尾樓版｜30450 第二十九分→二十六／二十七分回溯接線
 * 不清場、不改正文。兩張 SVG 已存在 repo；本層只把正文明說的兩條回返接進 LIVE 閱讀位置。
 */
(function(){
  'use strict';
  const unit=new URLSearchParams(location.search).get('u');
  if(unit!=='30450') return;

  const specs=[
    {
      key:'retro-30450-29-26',
      src:'figures/retro-30450-29-26.svg',
      caption:'第二十九分把「不能用來去坐臥定位如來」直接回扣第二十六分「不能以色見我、以音聲求我」：29 → 26',
      anchor:'這裡可以回扣第二十六分。第二十六分說，不能以色見我，以音聲求我。不能用可見的身體、可聞的聲音抓住如來。第二十九分再補一刀：也不能用來去坐臥抓住如來。身體的樣子不能封住他，身體的動作也不能封住他。'
    },
    {
      key:'retro-30450-29-27',
      src:'figures/retro-30450-29-27.svg',
      caption:'第二十九分警告不能把「無所從來，亦無所去」讀成取消佛的身體與行動，否則重新掉入第二十七分的斷滅相：29 → 27',
      anchor:'不能因為如來無所從來、亦無所去，就說第一分的佛不重要，說那個吃飯洗腳的身體只是幻象，說真正如來完全不在世間。這又會掉到第二十七分的斷滅相。經文沒有取消佛的身體，也沒有取消佛的行動。它只是切掉我們想用身體與行動抓住如來的習慣。'
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

  function alreadyHas(root,spec){
    if(root.querySelector('[data-retro-key="'+spec.key+'"]')) return true;
    return Array.from(root.querySelectorAll('.retro-figure__img')).some(img=>{
      const raw=img.getAttribute('src')||'';
      return raw===spec.src || raw.endsWith('/'+spec.src);
    });
  }

  function insert(root,spec){
    if(alreadyHas(root,spec)) return true;
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
    return specs.every(spec=>insert(root,spec));
  }

  const article=document.getElementById('article');
  if(!article) return;
  if(apply()) return;
  const observer=new MutationObserver(()=>{if(apply())observer.disconnect()});
  observer.observe(article,{childList:true,subtree:true,characterData:true});
  setTimeout(()=>observer.disconnect(),15000);
})();
