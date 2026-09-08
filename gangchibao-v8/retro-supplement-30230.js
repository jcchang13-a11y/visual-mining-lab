/* 《剛吃飽》第八版｜第五分回溯增補：5 → 1；5 → 4 → 3 */
(function(){
  'use strict';
  const unit=new URLSearchParams(location.search).get('u');
  if(unit!=='30230') return;
  const specs=[
    {
      key:'retro-30230-5-1',
      src:'figures/retro-30230-5-1.svg',
      caption:'第五分回頭動搖第一分那個看似自然、透明的「看見」：5 → 1',
      anchor:'第五分不是單純另開一題，而是在回頭動搖第一分那個看似很自然的看見。它讓我們重新問：第一分裡，我們到底看見了什麼？'
    },
    {
      key:'retro-30230-5-4-3',
      src:'figures/retro-30230-5-4-3.svg',
      caption:'第五分把第三分四相與第四分不住於相推進到「可以身相見如來不」：5 → 4 → 3',
      anchor:'第三分已經說，若菩薩有我相、人相、眾生相、壽者相，即非菩薩。第四分又說，菩薩應如是布施，不住於相。到了第五分，相的問題沒有消失，反而被推到更前面：可以身相見如來不？'
    }
  ];
  function alreadyPresent(root,spec){
    return !!root.querySelector('[data-retro-key="'+spec.key+'"], img[src="'+spec.src+'"]');
  }
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
    if(alreadyPresent(root,spec)) return true;
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
