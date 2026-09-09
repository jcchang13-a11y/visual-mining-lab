/* 《剛吃飽》第八版｜爛尾樓版｜30430 直接回扣層
 * 把十九、二十分正文逐一點名的前段位置拆成獨立同心圓。
 * 2026-09-10 續接：二十一至二十四分正文直接點名的前段位置；既有長鏈照留。
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
    {key:'retro-30430-20-17',src:'figures/retro-30430-20-17.svg',caption:'第二十分直接回扣第十七分長大之身：20 → 17',anchor:'第十七分問長大之身。'},
    {key:'retro-30430-21-6',src:'figures/retro-30430-21-6.svg',caption:'第二十一分直接回扣第六分未來眾生聞法生信：21 → 6',anchor:'第六分已經問過，如來滅後後五百歲，有沒有眾生得聞如是言說章句，生實信。'},
    {key:'retro-30430-21-14',src:'figures/retro-30430-21-14.svg',caption:'第二十一分直接回扣第十四分信心清淨／生實相：21 → 14',anchor:'第十四分又講信心清淨，則生實相。'},
    {key:'retro-30430-21-3',src:'figures/retro-30430-21-3.svg',caption:'第二十一分直接回扣第三分實無眾生得滅度：21 → 3',anchor:'第三分已經說，實無眾生得滅度者。'},
    {key:'retro-30430-21-17',src:'figures/retro-30430-21-17.svg',caption:'第二十一分直接回扣第十七分「我當滅度無量眾生」：21 → 17',anchor:'第十七分又說，若菩薩作是言「我當滅度無量眾生」，即不名菩薩。'},
    {key:'retro-30430-22-21',src:'figures/retro-30430-22-21.svg',caption:'第二十二分由第二十一分「無法可說」直接推到「無法可得」：22 → 21',anchor:'第二十一分剛說，說法者無法可說，是名說法。第二十二分立刻把問題推到得法。'},
    {key:'retro-30430-22-17',src:'figures/retro-30430-22-17.svg',caption:'第二十二分直接回扣第十七分然燈佛所無法可得：22 → 17',anchor:'第十七分已經拆過這個。如果如來在然燈佛所，有法得阿耨多羅三藐三菩提，然燈佛就不會授記。正因為實無有法得阿耨多羅三藐三菩提，然燈佛才授記。'},
    {key:'retro-30430-22-19',src:'figures/retro-30430-22-19.svg',caption:'第二十二分直接回到第十九分打開的「可以說、不能有實」公式測試：22 → 19',anchor:'這一分仍然在第十九分到第二十四分的公式測試裡。'},
    {key:'retro-30430-23-22',src:'figures/retro-30430-23-22.svg',caption:'第二十三分直接承接第二十二分「無有少法可得」：23 → 22',anchor:'第二十三分接在「無有少法可得」後面，馬上說「是法平等，無有高下」。'},
    {key:'retro-30430-23-7',src:'figures/retro-30430-23-7.svg',caption:'第二十三分直接回扣第七分「無為法而有差別」：23 → 7',anchor:'平等不是所有東西都一樣。第七分說過，一切賢聖皆以無為法而有差別。'},
    {key:'retro-30430-24-23',src:'figures/retro-30430-24-23.svg',caption:'第二十四分直接回扣第二十三分「是法平等，無有高下」：24 → 23',anchor:'第二十三分才剛說「是法平等，無有高下」。你以為終於不用比了。'},
    {key:'retro-30430-24-19',src:'figures/retro-30430-24-19.svg',caption:'第二十四分功德比較直接回扣第十九分福德無實：24 → 19',anchor:'第十九分才剛拆福德有實，第二十三分才剛拆高下，第二十四分不可能只是重新建立一個更高級的功德排行。'},
    {key:'retro-30430-24-16',src:'figures/retro-30430-24-16.svg',caption:'第二十四分「算數譬喻所不能及」直接回扣第十六分不可計量：24 → 16',anchor:'第十六分已經有「算數譬喻所不能及」，那裡處理供養諸佛、受持讀誦、果報不可思議。現在第二十四分又來一次，功德比較被推到無法計算。'}
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
