/* 《剛吃飽》第八版｜爛尾樓版｜30450 第三十分世界尺度直接回扣層
 * 長鏈保留；這一層只把正文已逐項叫回的前段世界尺度拆成直接線。
 */
(function(){
  'use strict';
  const unit=new URLSearchParams(location.search).get('u');
  if(unit!=='30450') return;

  const anchor='前面經文已經把世界越吹越大。三千大千世界，恆河沙數世界，如是沙等恆河，諸須彌山王，七寶聚，整個宇宙尺度一直被拉開。到第二十九分，剛剛才拆如來的來去坐臥；第三十分立刻把空間本身抓出來。';
  const specs=[
    ['retro-30450-30-24','figures/retro-30450-30-24.svg','第三十分把前文世界／七寶功德尺度直接回扣第二十四分：30 → 24'],
    ['retro-30450-30-18','figures/retro-30450-30-18.svg','第三十分把前文恆河沙數世界的放大直接回扣第十八分：30 → 18'],
    ['retro-30450-30-11','figures/retro-30450-30-11.svg','第三十分把前文恆河沙與世界尺度直接回扣第十一分：30 → 11'],
    ['retro-30450-30-10','figures/retro-30450-30-10.svg','第三十分把前文須彌／佛土空間尺度直接回扣第十分：30 → 10'],
    ['retro-30450-30-8','figures/retro-30450-30-8.svg','第三十分把前文三千大千世界與七寶尺度直接回扣第八分：30 → 8']
  ];

  function makeFigure([key,src,caption]){
    const figure=document.createElement('figure');
    figure.className='retro-figure';
    figure.dataset.gcbLayer='retrospective';
    figure.dataset.retroKey=key;
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

  function apply(){
    const root=document.getElementById('article');
    if(!root) return false;
    if(specs.every(([key])=>root.querySelector('[data-retro-key="'+key+'"]'))) return true;
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
    let node;
    while((node=walker.nextNode())){
      const at=(node.nodeValue||'').indexOf(anchor);
      if(at<0) continue;
      const tail=node.splitText(at+anchor.length);
      for(const spec of specs){
        const [key,src]=spec;
        if(root.querySelector('[data-retro-key="'+key+'"]')) continue;
        const duplicate=Array.from(root.querySelectorAll('.retro-figure__img')).some(img=>{
          const raw=img.getAttribute('src')||'';
          return raw===src || raw.endsWith('/'+src);
        });
        if(duplicate) continue;
        tail.parentNode.insertBefore(document.createTextNode('\n'),tail);
        tail.parentNode.insertBefore(makeFigure(spec),tail);
      }
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
