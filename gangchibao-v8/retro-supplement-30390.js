/* 《剛吃飽》第八版｜爛尾樓版｜30390 第十七分回溯增補
 * 不清正文，只把正文已能支持的多重回溯線接成閱讀層。
 */
(function(){
  'use strict';
  const unit=new URLSearchParams(location.search).get('u');
  if(unit!=='30390') return;
  const article=document.getElementById('article');
  if(!article) return;

  const specs=[
    {
      key:'retro-30390-17-6-3',
      src:'figures/retro-30390-17-6-3.svg',
      caption:'第十七分把「實無有法發心者」接回第六分「取法相即著四相」，再回到第三分的四相／度眾生基礎線：17 → 6 → 3',
      anchor:'第六分已經講過：「若取法相，即著我、人、眾生、壽者。」'
    },
    {
      key:'retro-30390-17-10',
      src:'figures/retro-30390-17-10.svg',
      caption:'第十七分重新叫回第十分的然燈佛、有法得菩提與莊嚴佛土問題：17 → 10',
      anchor:'接下來經文把問題推到如來身上：「須菩提，於意云何？如來於然燈佛所，有法得阿耨多羅三藐三菩提不？」'
    },
    {
      key:'retro-30390-17-13',
      src:'figures/retro-30390-17-13.svg',
      caption:'第十七分重新使用第十三分已出現的「大身即非大身，是名大身」作為公式轉折：17 → 13',
      anchor:'接著佛要求須菩提把「大身」也放進這公式：「人身長大，則為非大身，是名大身。」'
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

  function applySpec(spec){
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

  function applyAll(){
    let complete=true;
    specs.forEach(spec=>{if(!applySpec(spec)) complete=false;});
    return complete;
  }

  if(applyAll()) return;
  const observer=new MutationObserver(()=>{if(applyAll())observer.disconnect()});
  observer.observe(article,{childList:true,subtree:true,characterData:true});
  setTimeout(()=>observer.disconnect(),15000);
})();
