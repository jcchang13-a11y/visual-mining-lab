/* 《剛吃飽》第八版｜第六分回溯增補：6 → 5；6 → 3 */
(function(){
  'use strict';
  const unit=new URLSearchParams(location.search).get('u');
  if(unit!=='30240B') return;
  const specs=[
    {
      key:'retro-30240B-6-5',
      src:'figures/retro-30240B-6-5.svg',
      caption:'第六分從第五分「若見諸相非相」轉入未來聽者的實信問題：6 → 5',
      anchor:'第五分，須菩提剛問完可以身相見如來不，最後收在「若見諸相非相，則見如來」。到第六分，他忽然問另一件事：有沒有眾生，聽到剛剛那些「言說章句」，還能生起「實信」？'
    },
    {
      key:'retro-30240B-6-3',
      src:'figures/retro-30240B-6-3.svg',
      caption:'第六分重新叫回第三分四相，再把四相問題推進法相／非法相：6 → 3',
      anchor:'這裡表面上又回到第三分的四相，但是實際上卻是升級版。我們讀《金剛經》的時候，要很注意這種表達方式：它很像俄羅斯套娃，後面的論點會不斷重新詮釋前面的論點，並且把它升級。'
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
    img.loading='lazy'; img.decoding='async';
    const cap=document.createElement('figcaption');
    cap.className='retro-figure__caption';
    cap.textContent=spec.caption;
    figure.append(img,cap); return figure;
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
  const observer=new MutationObserver(()=>{if(apply())observer.disconnect()});
  observer.observe(article,{childList:true,subtree:true,characterData:true});
  setTimeout(()=>observer.disconnect(),15000);
})();
