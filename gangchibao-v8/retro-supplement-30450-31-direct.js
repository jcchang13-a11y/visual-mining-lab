/* 《剛吃飽》第八版｜爛尾樓版｜30450 第三十一分四相直接回扣增補層
 * 正文已逐一點名第三、六、十四、十七、二十五分；既有長鏈 31 → 25 → 17 → 14 → 6 → 3 保留。
 * 本層把每一個正文點名位置都拆成獨立直接回扣；不改正文，不改主 renderer。
 */
(function(){
  'use strict';
  const unit=new URLSearchParams(location.search).get('u');
  if(unit!=='30450') return;

  const anchor='我相、人相、眾生相、壽者相，前面講太多次了。第三分講過，第六分講過，第十四分講過，第十七分講過，第二十五分又講過。讀到第三十一分，會覺得：好，佛又說一次四相。差不多了吧。';
  const specs=[
    {key:'retro-30450-31-3',src:'figures/retro-30450-31-3.svg',caption:'第三十一分逐一回看四相施工史，直接點名第三分：31 → 3',anchor},
    {key:'retro-30450-31-6',src:'figures/retro-30450-31-6.svg',caption:'第三十一分逐一回看四相施工史，直接點名第六分：31 → 6',anchor},
    {key:'retro-30450-31-14',src:'figures/retro-30450-31-14.svg',caption:'第三十一分逐一回看四相施工史，直接點名第十四分：31 → 14',anchor},
    {key:'retro-30450-31-17',src:'figures/retro-30450-31-17.svg',caption:'第三十一分逐一回看四相施工史，直接點名第十七分：31 → 17',anchor},
    {key:'retro-30450-31-25',src:'figures/retro-30450-31-25.svg',caption:'第三十一分逐一回看四相施工史，直接點名第二十五分：31 → 25',anchor}
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

  function alreadyHasFigure(root,spec){
    if(root.querySelector('[data-retro-key="'+spec.key+'"]')) return true;
    return Array.from(root.querySelectorAll('.retro-figure__img')).some(img=>{
      const raw=img.getAttribute('src')||'';
      return raw===spec.src || raw.endsWith('/'+spec.src);
    });
  }

  function insertAfterAnchor(root,spec){
    if(alreadyHasFigure(root,spec)) return true;
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
    return specs.every(spec=>insertAfterAnchor(root,spec));
  }

  const article=document.getElementById('article');
  if(!article) return;
  if(apply()) return;
  const observer=new MutationObserver(()=>{if(apply())observer.disconnect()});
  observer.observe(article,{childList:true,subtree:true,characterData:true});
  setTimeout(()=>observer.disconnect(),15000);
})();
