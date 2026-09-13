/* 《剛吃飽》第八版｜爛尾樓版｜30390 第十七分「大身」錯位校正鷹架
 * 不刪既有 17→13 錯線：它保留作施工事故。
 * 正文補註明確寫「第十分『大身』」，本層只在該高信心位置追加 17→10 校正圖。
 * 2026-09-13：再加一層事故標記，避免 17→13 舊圖與 17→10 校正圖在 LIVE 中看起來同樣有效。
 */
(function(){
  'use strict';
  const unit=new URLSearchParams(location.search).get('u');
  if(unit!=='30390') return;

  const key='retro-30390-17-10-dasheng-correction';
  const src='figures/retro-30390-17-10-dasheng-correction.svg';
  const anchor='第十七分突然出現「人身長大」，可回看第十分：「譬如有人，身如須彌山王。」';
  const caption='錯位校正：第十七分補註明確把「人身長大／大身」回看第十分；既有 17 → 13 舊圖不拆，追加正線 17 → 10。';
  const oldKey='retro-30390-17-13';
  const accidentNote='【施工事故保留】這條 17 → 13 是舊接線；正文補註已把「大身」明確回看第十分，正線見 17 → 10 校正圖。';

  function makeFigure(){
    const figure=document.createElement('figure');
    figure.className='retro-figure';
    figure.dataset.gcbLayer='retrospective';
    figure.dataset.retroKey=key;
    figure.dataset.gcbCorrection='30390-dasheng';
    const img=document.createElement('img');
    img.className='retro-figure__img';
    img.src=src;
    img.alt=caption;
    img.loading='lazy';
    img.decoding='async';
    const cap=document.createElement('figcaption');
    cap.className='retro-figure__caption';
    cap.textContent=caption;
    figure.append(img,cap);
    return figure;
  }

  function markConstructionAccident(root){
    const old=root.querySelector('[data-retro-key="'+oldKey+'"]');
    if(!old) return false;
    old.dataset.gcbConstructionAccident='30390-dasheng-17-13';
    old.title='施工事故保留：17 → 13 舊接線；大身正線回第十分。';
    const cap=old.querySelector('.retro-figure__caption,figcaption');
    if(cap && !cap.textContent.includes('施工事故保留')){
      cap.textContent=cap.textContent+'\n'+accidentNote;
    }
    return true;
  }

  function apply(){
    const root=document.getElementById('article');
    if(!root) return false;
    markConstructionAccident(root);
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
      markConstructionAccident(root);
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
