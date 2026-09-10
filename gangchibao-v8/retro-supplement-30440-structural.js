/* 《剛吃飽》第八版｜爛尾樓版｜30440 結構性回扣增補
 * 不改正文。補第二十六分沒有直接點名、但經文結構高度明確的回溯：
 * 26 → 13：三十二相見／觀如來問題再次出場；
 * 26 → 5：從「身相見如來」推到「色／音聲求如來」的辨認壓力測試。
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
    return specs.every(spec=>insert(root,spec));
  }
  const article=document.getElementById('article');
  if(!article) return;
  if(apply()) return;
  const observer=new MutationObserver(()=>{if(apply()) observer.disconnect()});
  observer.observe(article,{childList:true,subtree:true,characterData:true});
  setTimeout(()=>observer.disconnect(),15000);
})();
