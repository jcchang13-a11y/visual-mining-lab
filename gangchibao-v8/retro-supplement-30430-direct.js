/* 《剛吃飽》第八版｜爛尾樓版｜30430 直接回扣層
 * 把十九、二十分正文逐一點名的前段位置拆成獨立同心圓。
 * 保留既有長鏈；不改正文；只認唯一 anchor；找不到就不插。
 */
(function(){
  'use strict';
  const unit=new URLSearchParams(location.search).get('u');
  if(unit!=='30430') return;

  const specs=[
    {key:'retro-30430-19-4',src:'figures/retro-30430-19-4.svg',caption:'第十九分直接回扣第四分無住布施：19 → 4',anchor:'第四分已經講「菩薩於法，應無所住，行於布施」。'},
    {key:'retro-30430-19-8',src:'figures/retro-30430-19-8.svg',caption:'第十九分直接回扣第八分三千大千世界七寶布施：19 → 8',anchor:'第八分把布施推到三千大千世界七寶。'},
    {key:'retro-30430-19-11',src:'figures/retro-30430-19-11.svg',caption:'第十九分直接回扣第十一分恆河沙數世界的福德比較：19 → 11',anchor:'第十一分又推到恆河沙數三千大千世界七寶。'},
    {key:'retro-30430-19-13',src:'figures/retro-30430-19-13.svg',caption:'第十九分直接回扣第十三分由財物轉向身命的布施線：19 → 13',anchor:'第十三分後面開始把布施從財物推到身命，'},
    {key:'retro-30430-19-15',src:'figures/retro-30430-19-15.svg',caption:'第十九分直接回扣第十五分忍辱／身體被打開的布施線：19 → 15',anchor:'第十五分把身體切開來，忍辱仙人被歌利王節節支解。'},
    {key:'retro-30430-20-1',src:'figures/retro-30430-20-1.svg',caption:'第二十分直接回扣第一分吃飯洗腳的身體：20 → 1',anchor:'第一分給我們一個吃飯洗腳的身體。'},
    {key:'retro-30430-20-5',src:'figures/retro-30430-20-5.svg',caption:'第二十分直接回扣第五分身相／見如來問題：20 → 5',anchor:'第五分問身相。'},
    {key:'retro-30430-20-10',src:'figures/retro-30430-20-10.svg',caption:'第二十分直接回扣第十分大身：20 → 10',anchor:'第十分問大身。'},
    {key:'retro-30430-20-17',src:'figures/retro-30430-20-17.svg',caption:'第二十分直接回扣第十七分長大之身：20 → 17',anchor:'第十七分問長大之身。'}
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
