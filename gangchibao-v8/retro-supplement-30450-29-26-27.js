/* 《剛吃飽》第八版｜爛尾樓版｜30450 第二十九分→二十六／二十七分回溯接線
 * 不清場、不改正文。既有 SVG 可在不同閱讀位置再次出現；去重只認 retro key，不再用圖檔 src 抹掉重演。
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
    },
    {
      key:'retro-30450-29-1-note-repeat',
      src:'figures/retro-30450-29-first.svg',
      caption:'第二十九分在註釋再次明說「必須回讀第一分」的位置重現回溯：29 → 1',
      anchor:'第二十九分必須回讀第一分。第一分的「入舍衛大城乞食」「還至本處」「飯食訖」「洗足已」「敷座而坐」正是來、去、坐的具體場景。第二十九分不是否定這些事件，而是防止讀者以事件、路線、姿勢定位如來。'
    },
    {
      key:'retro-30450-29-26-note-repeat',
      src:'figures/retro-30450-29-26.svg',
      caption:'第二十九分在註釋再次明說回扣第二十六分色／聲辨認的位置重現回溯：29 → 26',
      anchor:'此分也可回扣第二十六分「若以色見我，以音聲求我」。第二十六分拆色與聲，第二十九分拆行動與位置。色、聲、來、去、坐、臥，都是凡夫辨認一個人的方式；如來不能被這些方式封住。'
    }
  ];

  function makeFigure(spec){
    const figure=document.createElement('figure');
    figure.className='retro-figure';
    figure.dataset.gcbLayer='retrospective';
    figure.dataset.retroKey=spec.key;
    if(spec.key.includes('repeat')) figure.dataset.gcbRepeatReason='same-relation-new-reading-position';
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
    return !!root.querySelector('[data-retro-key="'+spec.key+'"]');
  }

  function insert(root,spec){
    if(alreadyHas(root,spec)) return true;
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
    let node;
    while((node=walker.nextNode())){
      if(node.parentElement?.closest('.sutra-block')) continue;
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
    return specs.map(spec=>insert(root,spec)).every(Boolean);
  }

  const article=document.getElementById('article');
  if(!article) return;
  if(apply()) return;
  const observer=new MutationObserver(()=>{if(apply())observer.disconnect()});
  observer.observe(article,{childList:true,subtree:true,characterData:true});
  setTimeout(()=>observer.disconnect(),15000);
})();