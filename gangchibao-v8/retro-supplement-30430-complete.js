/* 《剛吃飽》第八版｜爛尾樓版｜30430 回溯補齊層
 * 補第十九至二十四分正文中明確存在、主 renderer 尚未完整覆蓋的回收線。
 * 不改正文；只認唯一 anchor；找不到就不插。
 */
(function(){
  'use strict';
  const unit=new URLSearchParams(location.search).get('u');
  if(unit!=='30430') return;

  const specs=[
    {
      key:'retro-30430-19-15-13-11-8-4',
      src:'figures/retro-30430-19-15-13-11-8-4.svg',
      caption:'第十九分重新問七寶布施時，回收前面整條布施／福德力線：19 → 15 → 13 → 11 → 8 → 4',
      anchor:'第十九分是在回收前面整條布施與福德的力線。'
    },
    {
      key:'retro-30430-20-17-10-5-1',
      src:'figures/retro-30430-20-17-10-5-1.svg',
      caption:'第二十分把「見如來／身體」這條線重新叫回來：20 → 17 → 10 → 5 → 1',
      anchor:'第一分給我們一個吃飯洗腳的身體。第五分問身相。第十分問大身。第十七分問長大之身。第二十分問具足色身與諸相具足。身體一直回來，但每一次回來，都不能當地基。'
    },
    {
      key:'retro-30430-20-19',
      src:'figures/retro-30430-20-19.svg',
      caption:'第二十分把第十九分「可以說、不能有實」的公式直接換到具足色身：20 → 19',
      anchor:'這一句是在把第十九分的公式換到佛身上。第十九分是：福德可以說多，但不能有實。第二十分是：具足色身可以說，但不能有實。'
    },
    {
      key:'retro-30430-21-19',
      src:'figures/retro-30430-21-19.svg',
      caption:'第二十一分把第十九分「可以說、不能有實」的公式推到語言現場：21 → 19',
      anchor:'這一句把第十九分的公式推到語言現場。第十九分是：福德不是有實之物，所以可以說福德多。第二十一分是：說法不是因為有一個「法」可以說出來、交付出去、固定下來；恰恰因為無「法」可說，所以才名為說法。'
    },
    {
      key:'retro-30430-21-faith',
      src:'figures/retro-30430-21-faith.svg',
      caption:'第二十一分重新把「未來眾生能否生信」叫回來，沿第十四分回到第六分：21 → 14 → 6',
      anchor:'第六分已經問過，如來滅後後五百歲，有沒有眾生得聞如是言說章句，生實信。第十四分又講信心清淨，則生實相。現在第二十一分，問題在「說法者，無法可說」之後再出現：如果沒有一個「法」可以被交付，未來眾生聽到這個法，還能不能信？'
    },
    {
      key:'retro-30430-21-beings',
      src:'figures/retro-30430-21-beings.svg',
      caption:'第二十一分把未來聽法者的「眾生」位置再拆一次，回收第十七分與第三分：21 → 17 → 3',
      anchor:'第三分已經說，實無眾生得滅度者。第十七分又說，若菩薩作是言「我當滅度無量眾生」，即不名菩薩。現在連「未來會生信心的眾生」也被拆。'
    },
    {
      key:'retro-30430-22-21-17',
      src:'figures/retro-30430-22-21-17.svg',
      caption:'第二十二分把「無法可說」推成「無法可得」，並回接第十七分然燈佛授記：22 → 21 → 17',
      anchor:'第十七分已經拆過這個。如果如來在然燈佛所，有法得阿耨多羅三藐三菩提，然燈佛就不會授記。正因為實無有法得阿耨多羅三藐三菩提，然燈佛才授記。'
    },
    {
      key:'retro-30430-22-21-19',
      src:'figures/retro-30430-22-21-19.svg',
      caption:'第二十二分由第二十一分「無法可說」推到「無法可得」，並回到第十九分打開的公式測試：22 → 21 → 19',
      anchor:'這一分仍然在第十九分到第二十四分的公式測試裡。'
    },
    {
      key:'retro-30430-23-22-7',
      src:'figures/retro-30430-23-22-7.svg',
      caption:'第二十三分由第二十二分「無有少法可得」再回接第七分「無為法而有差別」：23 → 22 → 7',
      anchor:'平等不是所有東西都一樣。第七分說過，一切賢聖皆以無為法而有差別。差別仍然發生。修行仍然發生。善法仍然發生。問題是，差別不能被整理成一條可佔有的高低階序。不能讓你最後站在最高處說：我到了。'
    },
    {
      key:'retro-30430-23-22-21-19',
      src:'figures/retro-30430-23-22-21-19.svg',
      caption:'第二十三分把善法也送進同一公式，沿第二十二、二十一分回到第十九分：23 → 22 → 21 → 19',
      anchor:'可是善法本身也不能逃過公式：善法即非善法，是名善法。'
    },
    {
      key:'retro-30430-24-23-19-16',
      src:'figures/retro-30430-24-23-19-16.svg',
      caption:'第二十四分重新開啟比較，回收第二十三分無高下、第十九分福德無實與第十六分不可計量：24 → 23 → 19 → 16',
      anchor:'第十六分已經有「算數譬喻所不能及」，那裡處理供養諸佛、受持讀誦、果報不可思議。現在第二十四分又來一次，功德比較被推到無法計算。'
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
