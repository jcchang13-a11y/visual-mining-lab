/* 《剛吃飽》第八版｜爛尾樓版｜30450 第三十二分末段高級主體回看
 * 不清場，只把第三十二分正文總結已明點的斷滅相／不受福德／來去坐臥逐一接回。
 */
(function(){
  'use strict';
  const unit=new URLSearchParams(location.search).get('u');
  if(unit!=='30450') return;
  const anchor='第一分從「如是我聞」開始。第三十二分以「聞佛所說」收束。中間整部經把那個「我」可以坐下來的地方一個一個拆掉：布施、福德、身相、說法、得法、善法、度眾生、三十二相、斷滅相、不受福德、來去坐臥、世界、微塵、一合相、我見，最後連「如夢幻泡影」本身也不能變成一張舒服的椅子。';
  const specs=[
    {key:'retro-30450-32-27-direct',src:'figures/retro-30450-32-27.svg',caption:'第三十二分末段把「斷滅相」重新叫回第二十七分：32 → 27'},
    {key:'retro-30450-32-28-direct',src:'figures/retro-30450-32-28.svg',caption:'第三十二分末段把「不受福德」重新叫回第二十八分：32 → 28'},
    {key:'retro-30450-32-29-direct',src:'figures/retro-30450-32-29.svg',caption:'第三十二分末段把「來去坐臥」重新叫回第二十九分：32 → 29'}
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
  function has(root,spec){
    if(root.querySelector('[data-retro-key="'+spec.key+'"]')) return true;
    return Array.from(root.querySelectorAll('.retro-figure__img')).some(img=>{
      const raw=img.getAttribute('src')||'';
      return raw===spec.src || raw.endsWith('/'+spec.src);
    });
  }
  function insert(root,spec){
    if(has(root,spec)) return true;
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
    let node;
    while((node=walker.nextNode())){
      const at=(node.nodeValue||'').indexOf(anchor);
      if(at<0) continue;
      const tail=node.splitText(at+anchor.length);
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
    return specs.slice().reverse().every(spec=>insert(root,spec));
  }
  const article=document.getElementById('article');
  if(!article) return;
  if(apply()) return;
  const observer=new MutationObserver(()=>{if(apply())observer.disconnect()});
  observer.observe(article,{childList:true,subtree:true,characterData:true});
  setTimeout(()=>observer.disconnect(),15000);
})();
