/* 《剛吃飽》第八版｜第七分回溯增補：7 → 6 */
(function(){
  'use strict';
  const unit=new URLSearchParams(location.search).get('u');
  if(unit!=='30250') return;
  const key='retro-30250-7-6';
  const anchor='第六分剛說完「不應取法，不應取非法」，又用筏喻說「法尚應捨，何況非法」。那裡的問題，還比較放在聽法者、學法者、未來讀者身上：聽到這些言說章句以後，能不能信？又要怎樣信，才不會把法或非法抓成地板？';
  function makeFigure(){
    const figure=document.createElement('figure');
    figure.className='retro-figure';
    figure.dataset.gcbLayer='retrospective';
    figure.dataset.retroKey=key;
    const img=document.createElement('img');
    img.className='retro-figure__img';
    img.src='figures/retro-30250-7-6.svg';
    img.alt='第七分把第六分「不應取法、不應取非法」推到如來得法與說法的位置：7 → 6';
    img.loading='lazy'; img.decoding='async';
    const cap=document.createElement('figcaption');
    cap.className='retro-figure__caption';
    cap.textContent='第七分把第六分「不應取法、不應取非法」推到如來得法與說法的位置：7 → 6';
    figure.append(img,cap); return figure;
  }
  function apply(){
    const root=document.getElementById('article');
    if(!root) return false;
    if(root.querySelector('[data-retro-key="'+key+'"]')) return true;
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
    let node;
    while((node=walker.nextNode())){
      const at=(node.nodeValue||'').indexOf(anchor);
      if(at<0) continue;
      const tail=node.splitText(at+anchor.length);
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
  const observer=new MutationObserver(()=>{if(apply())observer.disconnect()});
  observer.observe(article,{childList:true,subtree:true,characterData:true});
  setTimeout(()=>observer.disconnect(),15000);
})();
