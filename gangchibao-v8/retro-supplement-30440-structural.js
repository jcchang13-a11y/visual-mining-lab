/* 《剛吃飽》第八版｜爛尾樓版｜30440 結構性回扣增補
 * 不改正文。補第二十六分沒有直接點名、但經文結構高度明確的回溯：
 * 26 → 13：三十二相見／觀如來問題再次出場；
 * 26 → 5：從「身相見如來」推到「色／音聲求如來」的辨認壓力測試。
 *
 * 2026-09-12 追加：保留 complete／direct 補線裡原有的跨段 anchor，不清掉；
 * 但 LIVE reader 逐行產生文字節點，跨段 anchor 無法命中，因此在本層另加單行 anchor repair。
 * repair 沿用原 key／原 SVG；若舊 anchor 未來能命中，data-retro-key 會阻止重複插圖。
 */
(function(){
  'use strict';
  const unit=new URLSearchParams(location.search).get('u');
  if(unit!=='30440') return;
  const specs=[
    {
      key:'retro-30440-26-13-structural',
      src:'figures/retro-30440-26-13.svg',
      caption:'第二十六分重新提出以三十二相見／觀如來的問題，結構上直接重演第十三分：26 → 13',
      anchor:'前面第二十分已經講過具足色身、諸相具足；到這裡，三十二相正式出場。'
    },
    {
      key:'retro-30440-26-5-structural',
      src:'figures/retro-30440-26-5.svg',
      caption:'第二十六分「若以色見我，以音聲求我」把第五分「不可以身相得見如來／若見諸相非相則見如來」再推進一步：26 → 5',
      anchor:'「若以色見我，以音聲求我」不可讀成否定所有色身與聲音。'
    }
  ];

  /*
   * 跨段 anchor 修補層：
   * complete／direct 檔仍保留原先較長的上下文 anchor，這裡只另接一個 LIVE 可命中的單行定位。
   * 不新增解經關係，不新增 SVG，只讓已經核定的圖真正出現在閱讀位置。
   */
  const anchorRepairs=[
    {
      key:'retro-30440-25-17-3',
      src:'figures/retro-30440-25-17-3.svg',
      caption:'第二十五分把「我當度眾生」直接回接第十七分，再回到第三分最早的度眾生／實無眾生得滅度者：25 → 17 → 3',
      anchor:'第十七分又說，如果菩薩作是言「我當滅度無量眾生」，即不名菩薩。那時候問題還在菩薩身上：菩薩不能把自己放到度眾生的位置上，不能說「我在度」「我應當度」「我完成度眾生這件事」。'
    },
    {
      key:'retro-30440-25-3-direct',
      src:'figures/retro-30440-25-3.svg',
      caption:'第二十五分明確回看第三分「滅度一切眾生而實無眾生得滅度」：25 → 3',
      anchor:'第三分已經說過，菩薩要滅度一切眾生，但實無眾生得滅度者。'
    },
    {
      key:'retro-30440-25-21',
      src:'figures/retro-30440-25-21.svg',
      caption:'第二十五分的「我當度眾生」與第二十一分「我當有所說法」形成直接結構對照：25 → 21',
      anchor:'一個是我當說法，一個是我當度眾生。兩句裡面都有「我當」。只要「我當」出現，任務主體就出現了。'
    },
    {
      key:'retro-30440-28-24-19-11',
      src:'figures/retro-30440-28-24-19-11.svg',
      caption:'第二十八分把福德線重新叫回來：28 → 24 → 19 → 11',
      anchor:'前面第十一分用恆河沙把數量推到爆掉，現在第二十八分再把這個宇宙級布施叫回來。'
    },
    {
      key:'retro-30440-28-27-26-25-group',
      src:'figures/retro-30440-28-27-26-25.svg',
      caption:'第二十八分收住第二十五至第二十八分「高級主體的反撲」整組：28 → 27 → 26 → 25',
      anchor:'第二十八分拆「我作福德，但我不受」。不能有清淨收款主體。'
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
  function insert(root,spec){
    if(root.querySelector('[data-retro-key="'+spec.key+'"]')) return true;
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
    let complete=true;
    specs.forEach(spec=>{if(!insert(root,spec)) complete=false;});
    anchorRepairs.forEach(spec=>{if(!insert(root,spec)) complete=false;});
    return complete;
  }
  const article=document.getElementById('article');
  if(!article) return;
  if(apply()) return;
  const observer=new MutationObserver(()=>{if(apply()) observer.disconnect()});
  observer.observe(article,{childList:true,subtree:true,characterData:true});
  setTimeout(()=>observer.disconnect(),15000);
})();
