/* 《剛吃飽》第八版｜爛尾樓版｜30440 直接回扣增補層
 * 長鏈已保留；這一層只把正文自己明說的直接互讀／重演關係拆開。
 * 不改正文，不取代既有 28 → 24 → 19 → 11 長鏈。
 */
(function(){
  'use strict';
  const unit=new URLSearchParams(location.search).get('u');
  if(unit!=='30440') return;

  const specs=[
    {
      key:'retro-30440-28-19-direct',
      src:'figures/retro-30440-28-19.svg',
      caption:'第二十八分把「福德可以作但不能受」直接回扣第十九分「福德可以說多但不能有實」：28 → 19',
      anchor:'這一點要和第十九分一起讀。第十九分說，福德可以說多，但不能有實。第二十八分再進一步說，福德可以作，但不能受。'
    },
    {
      key:'retro-30440-28-24-direct',
      src:'figures/retro-30440-28-24.svg',
      caption:'第二十八分處理福德與菩薩主體的關係，直接與第二十四分高級功德比較互讀：28 → 24',
      anchor:'第二十八分應與第十九分、第二十四分互讀。第十九分說福德無實，第二十四分把此經功德推到不可計量，第二十八分則處理福德與菩薩主體的關係：菩薩所作福德，不應貪著，是故說不受福德。'
    },
    {
      key:'retro-30440-28-11-direct',
      src:'figures/retro-30440-28-11.svg',
      caption:'第二十八分以恆河沙等世界七寶布施，直接重新叫回第十一分恆河沙的數量放大：28 → 11',
      anchor:'前面第十一分用恆河沙把數量推到爆掉，現在第二十八分再把這個宇宙級布施叫回來。'
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

  function alreadyHasFigure(root,spec){
    if(root.querySelector('[data-retro-key="'+spec.key+'"]')) return true;
    return Array.from(root.querySelectorAll('.retro-figure__img')).some(img=>{
      const raw=img.getAttribute('src')||'';
      return raw===spec.src || raw.endsWith('/'+spec.src);
    });
  }

  function insert(root,spec){
    if(!root||alreadyHasFigure(root,spec)) return true;
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
