/* 《剛吃飽》第八版｜爛尾樓版｜30450 回溯圖增補層
 * 只接正文可明確支持的回溯；不改正文，不改主 renderer。
 */
(function(){
  'use strict';
  const unit=new URLSearchParams(location.search).get('u');
  if(unit!=='30450') return;

  const specs=[
    {
      key:'retro-30450-29-26',
      src:'figures/retro-30450-29-26.svg',
      caption:'第二十九分把不能用來去坐臥定位如來的問題直接回扣第二十六分不能以色見我、以音聲求我：29 → 26',
      anchor:'這裡可以回扣第二十六分。第二十六分說，不能以色見我，以音聲求我。不能用可見的身體、可聞的聲音抓住如來。第二十九分再補一刀：也不能用來去坐臥抓住如來。身體的樣子不能封住他，身體的動作也不能封住他。'
    },
    {
      key:'retro-30450-29-27',
      src:'figures/retro-30450-29-27.svg',
      caption:'第二十九分防止把「無所從來亦無所去」讀成取消佛的身體與行動，直接回扣第二十七分的斷滅相：29 → 27',
      anchor:'不能因為如來無所從來、亦無所去，就說第一分的佛不重要，說那個吃飯洗腳的身體只是幻象，說真正如來完全不在世間。這又會掉到第二十七分的斷滅相。經文沒有取消佛的身體，也沒有取消佛的行動。它只是切掉我們想用身體與行動抓住如來的習慣。'
    },
    {
      key:'retro-30450-29-27-26-1',
      src:'figures/retro-30450-29-27-26-1.svg',
      caption:'第二十九分把如來的來去坐臥問題再回接第二十六分的身相／音聲、第二十七分的斷滅相與第一分飯後現場：29 → 27 → 26 → 1',
      anchor:'不能因為如來無所從來、亦無所去，就說第一分的佛不重要，說那個吃飯洗腳的身體只是幻象，說真正如來完全不在世間。這又會掉到第二十七分的斷滅相。經文沒有取消佛的身體，也沒有取消佛的行動。它只是切掉我們想用身體與行動抓住如來的習慣。'
    },
    {
      key:'retro-30450-30-24-18-11-10-8',
      src:'figures/retro-30450-30-24-18-11-10-8.svg',
      caption:'第三十分把前面反覆放大的世界尺度重新收回來：30 → 24 → 18 → 11 → 10 → 8',
      anchor:'第二個藏身處，是世界。前面講三千大千世界、恆河沙世界、須彌山王、七寶聚，整個空間一直放大。那麼最後總有一個世界吧？總有一個宇宙整體吧？第三十分說，世界也不能有實。甚至連微塵也不能做成最小地基。最大整體靠不住，最小單位也靠不住，連一合相也靠不住。'
    },
    {
      key:'retro-30450-30-19',
      src:'figures/retro-30450-30-19.svg',
      caption:'第三十分把「甚多」的問答節奏直接回扣第十九分：30 → 19',
      anchor:'這跟第十九分很像。第十九分問三千大千世界七寶布施，得福多不？須菩提答，得福甚多。佛沒有否定「多」。第三十分也一樣。微塵眾當然多。三千大千世界碎成微塵，怎麼可能不多？'
    },
    {
      key:'retro-30450-31-25-17-14-6-3',
      src:'figures/retro-30450-31-25-17-14-6-3.svg',
      caption:'第三十一分把「我見／人見／眾生見／壽者見」回接前面反覆出現的四相施工線：31 → 25 → 17 → 14 → 6 → 3',
      anchor:'我相、人相、眾生相、壽者相，前面講太多次了。第三分講過，第六分講過，第十四分講過，第十七分講過，第二十五分又講過。讀到第三十一分，會覺得：好，佛又說一次四相。差不多了吧。'
    },
    {
      key:'retro-30450-31-30',
      src:'figures/retro-30450-31-30.svg',
      caption:'第三十一分從第三十分「凡夫貪著一合相」接到凡夫也會貪著自己的見與診斷：31 → 30',
      anchor:'第三十分剛說，一合相不可說，但凡夫之人貪著其事。第三十一分馬上把「見」抓出來。因為凡夫不只貪著東西，也貪著自己的看法。貪著我看到的世界，貪著我診斷出來的問題，貪著我掌握的概念。甚至連「我見」這個本來用來拆我的概念，也會被拿來貪著。'
    },
    {
      key:'retro-30450-31-21',
      src:'figures/retro-30450-31-21.svg',
      caption:'第三十一分把「佛說我見」不能被實體化的問題回扣第二十一分的「如來有所說法」：31 → 21',
      anchor:'就像第二十一分說，若人言如來有所說法，即為謗佛。不是佛沒有說法，而是不能把法做成可交付之物。第三十一分也是這樣。不是佛沒有說我見、人見、眾生見、壽者見，而是不能把這些見做成有實的診斷工具。'
    },
    {
      key:'retro-30450-31-25',
      src:'figures/retro-30450-31-25.svg',
      caption:'第三十一分把診斷者位置直接回扣第二十五分「凡夫即非凡夫」的身份拆解：31 → 25',
      anchor:'這也是為什麼第二十五分已經拆過凡夫。凡夫者，即非凡夫，是名凡夫。第三十一分又拆我見。因為「凡夫」和「我見」很容易配套出現：凡夫有我見，懂經者看見凡夫有我見。這套一成立，精神階級又回來了。'
    },
    {
      key:'retro-30450-32-merit-full',
      src:'figures/retro-30450-32-merit.svg',
      caption:'第三十二分把全經福德比較線完整叫回來：32 → 24 → 19 → 16 → 15 → 11 → 8',
      anchor:'它從第八分、第十一分、第十五分、第十六分、第十九分、第二十四分一路回來，到最後第三十二分還在。'
    },
    {
      key:'retro-30450-32-14-ru',
      src:'figures/retro-30450-32-14-ru.svg',
      caption:'第三十二分「如如不動」沿正文自己點出的「如」字線回看第十四分的「如是，如是」與「如語者」：32 → 14',
      anchor:'這裡的「如如不動」要回頭看第十四分的「如是如是」與「如語者」。第十四分須菩提聽到這部經，深解義趣，涕淚悲泣，佛說：「如是，如是。」那裡是對須菩提理解的確認。第十四分也說「如來是真語者、實語者、如語者、不誑語者、不異語者」。到第三十二分，最後變成「如如不動」。'
    },
    {
      key:'retro-30450-32-1',
      src:'figures/retro-30450-32-1.svg',
      caption:'第三十二分的聞法散場與第一分的飯後開場形成全書最後一層直接回返：32 → 1',
      anchor:'清到最後，經文回到第一分。'
    },
    {
      key:'retro-30450-32-hearing-1',
      src:'figures/retro-30450-32-hearing-1.svg',
      caption:'第三十二分最後「聞佛所說」直接回扣第一分「如是我聞」；全經從聞開始，也從聞收束：32 → 1',
      anchor:'最後「聞佛所說，皆大歡喜，信受奉行」應回扣第一分「如是我聞」。全經從聞開始，也從聞收束。第一分的飯後身體與第三十二分的聞法大眾互相封口：經文不是逃離現場，而是在現場中不住於相。'
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
