/* 《剛吃飽》第八版｜爛尾樓版｜30450 第三十二分末段總結逐項回溯
 * 「不清場，只加鷹架」：同一歷史關係即使前文已有圖，只要正文在新的閱讀位置再次明確回叫，就允許再次出現。
 * 本層專門處理第三十二分最後「我可以坐下來的地方」總結句；不以 img src 去重，只以本閱讀位置自己的 key 去重。
 */
(function(){
  'use strict';
  const unit=new URLSearchParams(location.search).get('u');
  if(unit!=='30450') return;

  const anchor='第一分從「如是我聞」開始。第三十二分以「聞佛所說」收束。中間整部經把那個「我」可以坐下來的地方一個一個拆掉：布施、福德、身相、說法、得法、善法、度眾生、三十二相、斷滅相、不受福德、來去坐臥、世界、微塵、一合相、我見，最後連「如夢幻泡影」本身也不能變成一張舒服的椅子。';

  /* 世界／微塵／一合相同屬第三十分，合成同一個回扣，避免把同一目的地機械複製三遍。 */
  const specs=[
    {key:'retro-30450-32-final-8',src:'figures/retro-30450-32-8.svg',caption:'第三十二分末段重新點名「布施」，回到第八分最早建立的七寶布施／說法功德比較：32 → 8'},
    {key:'retro-30450-32-final-19',src:'figures/retro-30450-32-19.svg',caption:'第三十二分末段重新點名「福德」，回到第十九分「福德可以說多，但不能有實」：32 → 19'},
    {key:'retro-30450-32-final-20',src:'figures/retro-30450-32-20.svg',caption:'第三十二分末段重新點名「身相」，回到第二十分具足色身／諸相具足：32 → 20'},
    {key:'retro-30450-32-final-21',src:'figures/retro-30450-32-21.svg',caption:'第三十二分末段重新點名「說法」，回到第二十一分「如來有所說法」的拆解：32 → 21'},
    {key:'retro-30450-32-final-22',src:'figures/retro-30450-32-22.svg',caption:'第三十二分末段重新點名「得法」，回到第二十二分「無有少法可得」：32 → 22'},
    {key:'retro-30450-32-final-23',src:'figures/retro-30450-32-23.svg',caption:'第三十二分末段重新點名「善法」，回到第二十三分「善法即非善法，是名善法」：32 → 23'},
    {key:'retro-30450-32-final-25',src:'figures/retro-30450-32-25.svg',caption:'第三十二分末段重新點名「度眾生」，回到第二十五分「我當度眾生」的救世主體拆解：32 → 25'},
    {key:'retro-30450-32-final-26',src:'figures/retro-30450-32-26.svg',caption:'第三十二分末段重新點名「三十二相」，回到第二十六分不能以色見我／以音聲求我：32 → 26'},
    {key:'retro-30450-32-final-27',src:'figures/retro-30450-32-27.svg',caption:'第三十二分末段重新點名「斷滅相」，回到第二十七分：32 → 27'},
    {key:'retro-30450-32-final-28',src:'figures/retro-30450-32-28.svg',caption:'第三十二分末段重新點名「不受福德」，回到第二十八分：32 → 28'},
    {key:'retro-30450-32-final-29',src:'figures/retro-30450-32-29.svg',caption:'第三十二分末段重新點名「來去坐臥」，回到第二十九分：32 → 29'},
    {key:'retro-30450-32-final-30',src:'figures/retro-30450-32-30.svg',caption:'第三十二分末段重新點名「世界、微塵、一合相」，整組回到第三十分：32 → 30'},
    {key:'retro-30450-32-final-31',src:'figures/retro-30450-32-31.svg',caption:'第三十二分末段重新點名「我見」，回到第三十一分知見不生：32 → 31'}
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

  function apply(){
    const root=document.getElementById('article');
    if(!root) return false;
    const missing=specs.filter(spec=>!root.querySelector('[data-retro-key="'+spec.key+'"]'));
    if(!missing.length) return true;
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
    let node;
    while((node=walker.nextNode())){
      const at=(node.nodeValue||'').indexOf(anchor);
      if(at<0) continue;
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
    return false;
  }

  const article=document.getElementById('article');
  if(!article) return;
  if(apply()) return;
  const observer=new MutationObserver(()=>{if(apply())observer.disconnect()});
  observer.observe(article,{childList:true,subtree:true,characterData:true});
  setTimeout(()=>observer.disconnect(),15000);
})();
