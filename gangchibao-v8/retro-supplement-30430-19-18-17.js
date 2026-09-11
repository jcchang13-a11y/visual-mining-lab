/* 《剛吃飽》第八版｜爛尾樓版｜30430 發心者／心／福德回溯增補
 * 不改正文。補第十九分正文已明說、但既有回溯圖尚未接上的結構鏈：
 * 19 → 18 → 17：第十七分拆發心者，第十八分拆所發之心，第十九分再拆福德。
 */
(function(){
  'use strict';
  const unit=new URLSearchParams(location.search).get('u');
  if(unit!=='30430') return;
  const spec={
    key:'retro-30430-19-18-17',
    src:'figures/retro-30430-19-18-17.svg',
    caption:'第十九分把拆解再往前回接：第十七分拆發心者，第十八分拆所發之心，第十九分再拆福德：19 → 18 → 17',
    anchor:'這裡如果接著第十七、十八分看，位置更清楚。第十七分拆的是發心者：誰在發阿耨多羅三藐三菩提心？誰是菩薩？誰在莊嚴佛土？第十八分拆的是所發之心：就算發心者不可得，那個真心總是真的吧？慈悲心、願心、菩薩心，總可以當最後的地板吧？不行。諸心非心，是名為心。過去心不可得，現在心不可得，未來心不可得。'
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
  function apply(){
    const root=document.getElementById('article');
    if(!root) return false;
    if(root.querySelector('[data-retro-key="'+spec.key+'"]')) return true;
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
  const observer=new MutationObserver(()=>{if(apply()) observer.disconnect()});
  observer.observe(article,{childList:true,subtree:true,characterData:true});
  setTimeout(()=>observer.disconnect(),15000);
})();
