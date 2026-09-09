/* 《剛吃飽》第八版｜爛尾樓版｜30410A 直接回扣層
 * 第十八分正文逐一點名的空間線與時間線拆成獨立同心圓。
 * 既有 18→1、18→17、空間長鏈、時間長鏈全部保留；不改正文。
 */
(function(){
  'use strict';
  if(new URLSearchParams(location.search).get('u')!=='30410A') return;

  const specs=[
    {key:'retro-30410A-18-8',src:'figures/retro-30410A-18-8.svg',caption:'第十八分空間線直接回扣第八分三千大千世界七寶布施：18 → 8',anchor:'第八分用「三千大千世界七寶布施」先把尺度推大；'},
    {key:'retro-30410A-18-11',src:'figures/retro-30410A-18-11.svg',caption:'第十八分空間線直接回扣第十一分恆河沙數三千大千世界：18 → 11',anchor:'第十一分用「恆河沙數三千大千世界」把數量推到爆表；'},
    {key:'retro-30410A-18-12',src:'figures/retro-30410A-18-12.svg',caption:'第十八分空間線直接回扣第十二分經典所在即為有佛的現場：18 → 12',anchor:'第十二分說經典所在之處即為有佛，讓說經之處變成新的現場；'},
    {key:'retro-30410A-18-13',src:'figures/retro-30410A-18-13.svg',caption:'第十八分空間線直接回扣第十三分三千大千世界與所有微塵：18 → 13',anchor:'第十三分又拿「三千大千世界」和「所有微塵」一起處理，最大整體和最小單位都被推上來。'},
    {key:'retro-30410A-18-6',src:'figures/retro-30410A-18-6.svg',caption:'第十八分時間線直接回扣第六分後五百歲：18 → 6',anchor:'第六分推到未來：「後五百歲」。'},
    {key:'retro-30410A-18-14',src:'figures/retro-30410A-18-14.svg',caption:'第十八分時間線直接回扣第十四分從昔以來與過去五百世：18 → 14',anchor:'第十四分說「從昔以來」，又說過去五百世作忍辱仙人。'},
    {key:'retro-30410A-18-15',src:'figures/retro-30410A-18-15.svg',caption:'第十八分時間線直接回扣第十五分日分與無量劫：18 → 15',anchor:'第十五分有初日分、中日分、後日分，又有無量百千萬億劫。'},
    {key:'retro-30410A-18-16',src:'figures/retro-30410A-18-16.svg',caption:'第十八分時間線直接回扣第十六分先世／今世／後末世與過去無量劫：18 → 16',anchor:'第十六分更誇張：先世罪業、今世被人輕賤、後末世受持讀誦，還有佛自己過去無量阿僧祇劫供養承事諸佛。'}
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
