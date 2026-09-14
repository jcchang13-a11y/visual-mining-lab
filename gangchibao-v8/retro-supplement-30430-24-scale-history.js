/* 《剛吃飽》第八版｜爛尾樓版｜30430 第二十四分尺度／功德史增補
 * 不清場、不改正文。第二十四分不只回收第十九分；它還把前面兩套極大化裝置重新疊上來：
 * ① 須彌山王：回到第十分以須彌山王打開「大」的尺度；
 * ② 受持讀誦／為他人說，其福勝彼：回到第十一分對第八分的功德比較升級。
 * 只在正文可直接支持的閱讀位置接圖；找不到 anchor 就不插。
 */
(function(){
  'use strict';
  const unit=new URLSearchParams(location.search).get('u');
  if(unit!=='30430') return;

  const specs=[
    {
      key:'retro-30430-24-10',
      src:'figures/retro-30430-24-10.svg',
      caption:'第二十四分把「三千大千世界中所有須彌山王」再度推成宇宙尺度的七寶聚，結構上重新叫回第十分用須彌山王打開「大」的施工線：24 → 10',
      anchor:'這次不是三千大千世界七寶而已。是三千大千世界中所有須彌山王，如是等七寶聚。'
    },
    {
      key:'retro-30430-24-11-8',
      src:'figures/retro-30430-24-11-8.svg',
      caption:'第二十四分再次以「受持讀誦、為他人說，其福勝彼」啟動功德比較，重演第十一分對第八分的尺度升級：24 → 11 → 8',
      anchor:'前面一直說受持讀誦、為他人說，其福勝彼。'
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

  function alreadyHas(root,spec){
    if(root.querySelector('[data-retro-key="'+spec.key+'"]')) return true;
    return Array.from(root.querySelectorAll('.retro-figure__img')).some(img=>{
      const raw=img.getAttribute('src')||'';
      return raw===spec.src || raw.endsWith('/'+spec.src);
    });
  }

  function insert(root,spec){
    if(alreadyHas(root,spec)) return true;
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
    let node;
    while((node=walker.nextNode())){
      if(node.parentElement?.closest('.sutra-block')) continue;
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
    return specs.map(spec=>insert(root,spec)).every(Boolean);
  }

  const article=document.getElementById('article');
  if(!article) return;
  if(apply()) return;
  const observer=new MutationObserver(()=>{if(apply())observer.disconnect()});
  observer.observe(article,{childList:true,subtree:true,characterData:true});
  setTimeout(()=>observer.disconnect(),15000);
})();
