/* 《剛吃飽》第八版｜爛尾樓版｜30450 第三十二分福德名單直接回溯增補層
 * 正文已逐名列出第8、11、15、16、19、24分；完整福德長鏈保留，本層只把可獨立辨認的直接回扣逐一攤開。
 * 不改正文，不取代既有 retro-30450-32-merit.svg，不接無文本支持的歷史岔路。
 */
(function(){
  'use strict';
  const unit=new URLSearchParams(location.search).get('u');
  if(unit!=='30450') return;

  const anchor='它從第八分、第十一分、第十五分、第十六分、第十九分、第二十四分一路回來，到最後第三十二分還在。';
  const specs=[
    {key:'retro-30450-32-8-direct',src:'figures/retro-30450-32-8.svg',caption:'第三十二分的最後福德比較直接回扣第八分最早建立的七寶布施／說法功德比較：32 → 8'},
    {key:'retro-30450-32-11-direct',src:'figures/retro-30450-32-11.svg',caption:'第三十二分的最後福德比較直接回扣第十一分以恆河沙世界放大的福德尺度：32 → 11'},
    {key:'retro-30450-32-15-direct',src:'figures/retro-30450-32-15.svg',caption:'第三十二分的最後福德比較直接回扣第十五分大幅推高受持讀誦功德的比較：32 → 15'},
    {key:'retro-30450-32-16-direct',src:'figures/retro-30450-32-16.svg',caption:'第三十二分的最後福德比較直接回扣第十六分受持讀誦功德與輕賤／罪業消滅的段落：32 → 16'},
    {key:'retro-30450-32-19-direct',src:'figures/retro-30450-32-19.svg',caption:'第三十二分的最後福德比較直接回扣第十九分「福德可以說多，但不能有實」：32 → 19'},
    {key:'retro-30450-32-24-direct',src:'figures/retro-30450-32-24.svg',caption:'第三十二分的最後福德比較直接回扣第二十四分再次推高受持讀誦、為人說經功德的比較：32 → 24'}
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

  function findAnchorNode(root){
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
    let node;
    while((node=walker.nextNode())){
      if((node.nodeValue||'').includes(anchor)) return node;
    }
    return null;
  }

  function apply(){
    const root=document.getElementById('article');
    if(!root) return false;
    const missing=specs.filter(spec=>!alreadyHasFigure(root,spec));
    if(!missing.length) return true;
    const node=findAnchorNode(root);
    if(!node) return false;
    const at=(node.nodeValue||'').indexOf(anchor);
    if(at<0) return false;
    const tail=node.splitText(at+anchor.length);
    const frag=document.createDocumentFragment();
    frag.appendChild(document.createTextNode('\n'));
    missing.forEach(spec=>{
      frag.appendChild(makeFigure(spec));
      frag.appendChild(document.createTextNode('\n'));
    });
    tail.parentNode.insertBefore(frag,tail);
    return true;
  }

  const article=document.getElementById('article');
  if(!article) return;
  if(apply()) return;
  const observer=new MutationObserver(()=>{if(apply())observer.disconnect()});
  observer.observe(article,{childList:true,subtree:true,characterData:true});
  setTimeout(()=>observer.disconnect(),15000);
})();
