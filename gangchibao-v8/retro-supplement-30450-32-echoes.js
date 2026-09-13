/* 《剛吃飽》第八版｜爛尾樓版｜30450 第三十二分末偈回聲增補
 * 依正文逐項點名的回返補圖；不改正文、不覆蓋既有 32→31／32→21／福德線。
 */
(function(){
  'use strict';
  const unit=new URLSearchParams(location.search).get('u');
  if(unit!=='30450') return;

  const finalChairAnchor='第一分從「如是我聞」開始。第三十二分以「聞佛所說」收束。中間整部經把那個「我」可以坐下來的地方一個一個拆掉：布施、福德、身相、說法、得法、善法、度眾生、三十二相、斷滅相、不受福德、來去坐臥、世界、微塵、一合相、我見，最後連「如夢幻泡影」本身也不能變成一張舒服的椅子。';

  const specs=[
    {
      key:'retro-30450-32-26',
      src:'figures/retro-30450-32-26.svg',
      caption:'第三十二分把「佛身如夢幻泡影」直接回接第二十六分不能以色見我：32 → 26',
      anchor:'佛身如夢幻泡影，不是沒有佛身，而是不能以色見我。'
    },
    {
      key:'retro-30450-32-22',
      src:'figures/retro-30450-32-22.svg',
      caption:'第三十二分把阿耨多羅三藐三菩提放回「無有少法可得」的第二十二分：32 → 22',
      anchor:'阿耨多羅三藐三菩提如夢幻泡影，不是沒有，而是無有少法可得，是名阿耨多羅三藐三菩提。'
    },
    {
      key:'retro-30450-32-23',
      src:'figures/retro-30450-32-23.svg',
      caption:'第三十二分把「善法如夢幻泡影」直接回接第二十三分「善法即非善法，是名善法」：32 → 23',
      anchor:'善法如夢幻泡影，不是不用修，而是善法即非善法，是名善法。'
    },
    {
      key:'retro-30450-32-30',
      src:'figures/retro-30450-32-30.svg',
      caption:'第三十二分把「世界如夢幻泡影」直接回接第三十分「世界即非世界，是名世界」：32 → 30',
      anchor:'世界如夢幻泡影，不是世界不存在，而是世界即非世界，是名世界。'
    },
    {
      key:'retro-30450-32-20-direct',
      src:'figures/retro-30450-32-20.svg',
      caption:'第三十二分末段把「身相」重新叫回第二十分具足色身／諸相具足的拆解：32 → 20',
      anchor:finalChairAnchor
    },
    {
      key:'retro-30450-32-25-direct',
      src:'figures/retro-30450-32-25.svg',
      caption:'第三十二分末段把「度眾生」重新叫回第二十五分「我當度眾生」的救世主體拆解：32 → 25',
      anchor:finalChairAnchor
    },
    {
      key:'retro-30450-32-27-direct',
      src:'figures/retro-30450-32-27.svg',
      caption:'第三十二分末段把「斷滅相」重新叫回第二十七分：32 → 27',
      anchor:finalChairAnchor
    },
    {
      key:'retro-30450-32-28-direct',
      src:'figures/retro-30450-32-28.svg',
      caption:'第三十二分末段把「不受福德」重新叫回第二十八分：32 → 28',
      anchor:finalChairAnchor
    },
    {
      key:'retro-30450-32-29-direct',
      src:'figures/retro-30450-32-29.svg',
      caption:'第三十二分末段把「來去坐臥」重新叫回第二十九分：32 → 29',
      anchor:finalChairAnchor
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

  function insertAfterText(root,spec){
    if(alreadyHas(root,spec)) return true;
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
    let complete=true;
    /* 同一總結句接多張直接回返時倒序施工，讓可見次序維持 20→25→27→28→29。 */
    const regular=specs.filter(spec=>spec.anchor!==finalChairAnchor);
    const finalChair=specs.filter(spec=>spec.anchor===finalChairAnchor).reverse();
    regular.concat(finalChair).forEach(spec=>{if(!insertAfterText(root,spec)) complete=false;});
    return complete;
  }

  const article=document.getElementById('article');
  if(!article) return;
  if(apply()) return;
  const observer=new MutationObserver(()=>{if(apply())observer.disconnect()});
  observer.observe(article,{childList:true,subtree:true,characterData:true});
  setTimeout(()=>observer.disconnect(),15000);
})();
