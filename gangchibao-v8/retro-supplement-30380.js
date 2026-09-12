/* 《剛吃飽》第八版｜爛尾樓版｜30380 第十六分回溯增補
 * 不清正文，只把正文已能支持的時間回溯線接成閱讀層。
 * 2026-09-12 校準：同一句經文在 L2 經文塊與 L1 正文重複時，回溯圖不搶進經文原材料層；保留兩份文字，只把圖接在正文閱讀層。
 */
(function(){
  'use strict';
  const unit=new URLSearchParams(location.search).get('u');
  if(unit!=='30380') return;
  const article=document.getElementById('article');
  if(!article) return;

  const specs=[
    {
      key:'retro-30380-16-15',
      src:'figures/retro-30380-16-15.svg',
      caption:'第十六分一開場即把第十五分「其福勝彼」的功德比較線拉進更長的因果時間重新計算：16 → 15',
      anchor:'第十五分剛說「其福勝彼」，第十六分馬上把時間線拉長。'
    },
    {
      key:'retro-30380-16-10',
      src:'figures/retro-30380-16-10.svg',
      caption:'第十六分再次拉出然燈佛以前的過去時間，回接第十分已出現的然燈佛線：16 → 10',
      anchor:'接著佛把自己的過去也拉出來。很久很久以前，在然燈佛之前，他曾經供養承事過數不清的佛，而且沒有空過。'
    },
    {
      key:'retro-30380-16-6',
      src:'figures/retro-30380-16-6.svg',
      caption:'第十六分的「後末世」把未來受持讀誦者重新接回第六分「後五百歲」的未來聽眾線：16 → 6',
      anchor:'若復有人，於後末世，能受持讀誦此經，所得功德，於我所供養諸佛功德，百分不及一，千萬億分乃至算數譬喻所不能及。'
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
      /* 經文在單元頂端另有 L2 原材料複本。若 anchor 同時出現在 L2 與正文，
         舊 walker 會先命中 L2，讓回溯圖看起來像經文本身的一部分。
         不刪 L2、不改 anchor，只略過經文塊，繼續找正文中的同句。 */
      if(node.parentElement && node.parentElement.closest('.sutra-block')) continue;
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
