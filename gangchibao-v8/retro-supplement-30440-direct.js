/* 《剛吃飽》第八版｜爛尾樓版｜30440 直接回扣增補層
 * 長鏈已保留；這一層只把正文自己明說的直接互讀／重演關係拆開。
 * 不改正文，不取代既有 25 → 17 → 3、27 → 24 → 23 → 22 → 21 → 20 → 19、28 → 24 → 19 → 11 與 28 → 15 → 14 長鏈。
 */
(function(){
  'use strict';
  const unit=new URLSearchParams(location.search).get('u');
  if(unit!=='30440') return;

  const specs=[
    {
      key:'retro-30440-25-3-direct',
      src:'figures/retro-30440-25-3.svg',
      caption:'第二十五分明確回看第三分「滅度一切眾生而實無眾生得滅度」：25 → 3',
      anchor:'第二十五分不是單純重複第三分。\n\n第三分已經說過，菩薩要滅度一切眾生，但實無眾生得滅度者。'
    },
    {
      key:'retro-30440-25-17-direct',
      src:'figures/retro-30440-25-17.svg',
      caption:'第二十五分把「我當度眾生」直接回扣第十七分「我當滅度無量眾生」：25 → 17',
      anchor:'第十七分又說，如果菩薩作是言「我當滅度無量眾生」，即不名菩薩。那時候問題還在菩薩身上：菩薩不能把自己放到度眾生的位置上，不能說「我在度」「我應當度」「我完成度眾生這件事」。'
    },
    {
      key:'retro-30440-25-21-direct',
      src:'figures/retro-30440-25-21.svg',
      caption:'第二十五分把「我當度眾生」與第二十一分「我當有所說法」並列為同一個「我當」任務主體結構：25 → 21',
      anchor:'這句要跟第二十一分一起看。第二十一分說：\n\n「汝勿謂如來作是念：我當有所說法。」\n\n第二十五分說：\n\n「汝等勿謂如來作是念：我當度眾生。」'
    },
    {
      key:'retro-30440-27-19-direct',
      src:'figures/retro-30440-27-19.svg',
      caption:'第二十七分用「不是斷滅」直接回收第十九分福德可說多但不能有實：27 → 19',
      anchor:'第十九到第二十四分一直在說，可以說，但不能有實。福德可以說多，但不能有實。說法可以發生，但無法可說。阿耨多羅三藐三菩提可以被說名，但無有少法可得。善法可以修，但善法即非善法，是名善法。'
    },
    {
      key:'retro-30440-27-20-direct',
      src:'figures/retro-30440-27-20.svg',
      caption:'第二十七分用「不是斷滅」直接回收第二十分具足色身／諸相具足不可實體化：27 → 20',
      anchor:'第十九到第二十四分一直在說，可以說，但不能有實。福德可以說多，但不能有實。說法可以發生，但無法可說。阿耨多羅三藐三菩提可以被說名，但無有少法可得。善法可以修，但善法即非善法，是名善法。'
    },
    {
      key:'retro-30440-27-21-direct',
      src:'figures/retro-30440-27-21.svg',
      caption:'第二十七分用「不是斷滅」直接回收第二十一分說法可以發生但無法可說：27 → 21',
      anchor:'第十九到第二十四分一直在說，可以說，但不能有實。福德可以說多，但不能有實。說法可以發生，但無法可說。阿耨多羅三藐三菩提可以被說名，但無有少法可得。善法可以修，但善法即非善法，是名善法。'
    },
    {
      key:'retro-30440-27-22-direct',
      src:'figures/retro-30440-27-22.svg',
      caption:'第二十七分用「不是斷滅」直接回收第二十二分無有少法可得：27 → 22',
      anchor:'第十九到第二十四分一直在說，可以說，但不能有實。福德可以說多，但不能有實。說法可以發生，但無法可說。阿耨多羅三藐三菩提可以被說名，但無有少法可得。善法可以修，但善法即非善法，是名善法。'
    },
    {
      key:'retro-30440-27-23-direct',
      src:'figures/retro-30440-27-23.svg',
      caption:'第二十七分用「不是斷滅」直接回收第二十三分善法可修而善法即非善法：27 → 23',
      anchor:'第十九到第二十四分一直在說，可以說，但不能有實。福德可以說多，但不能有實。說法可以發生，但無法可說。阿耨多羅三藐三菩提可以被說名，但無有少法可得。善法可以修，但善法即非善法，是名善法。'
    },
    {
      key:'retro-30440-27-24-direct',
      src:'figures/retro-30440-27-24.svg',
      caption:'第二十七分用「不是斷滅」直接回收第二十四分高級功德比較也不能被收成實體帳戶：27 → 24',
      anchor:'第十九到第二十四分一直在說，可以說，但不能有實。福德可以說多，但不能有實。說法可以發生，但無法可說。阿耨多羅三藐三菩提可以被說名，但無有少法可得。善法可以修，但善法即非善法，是名善法。'
    },
    {
      key:'retro-30440-28-19-direct',
      src:'figures/retro-30440-28-19.svg',
      caption:'第二十八分把「福德可以作但不能受」直接回扣第十九分「福德可以說多但不能有實」：28 → 19',
      anchor:'這一點要和第十九分一起讀。第十九分說，福德可以說多，但不能有實。第二十八分再進一步說，福德可以作，但不能受。'
    },
    {
      key:'retro-30440-28-24-direct',
      src:'figures/retro-30440-28-24.svg',
      caption:'第二十八分處理福德與菩薩主體的關係，直接與第二十四分高級功德比較互讀：28 → 24',
      anchor:'第二十八分應與第十九分、第二十四分互讀。第十九分說福德無實，第二十四分把此經功德推到不可計量，第二十八分則處理福德與菩薩主體的關係：菩薩所作福德，不應貪著，是故說不受福德。'
    },
    {
      key:'retro-30440-28-11-direct',
      src:'figures/retro-30440-28-11.svg',
      caption:'第二十八分以恆河沙等世界七寶布施，直接重新叫回第十一分恆河沙的數量放大：28 → 11',
      anchor:'前面第十一分用恆河沙把數量推到爆掉，現在第二十八分再把這個宇宙級布施叫回來。'
    },
    {
      key:'retro-30440-28-14-direct',
      src:'figures/retro-30440-28-14.svg',
      caption:'第二十八分「知一切法無我，得成於忍」明確回接第十四分忍辱線：28 → 14',
      anchor:'「知一切法無我，得成於忍」可回接第十四、十五分的忍辱線。'
    },
    {
      key:'retro-30440-28-15-direct',
      src:'figures/retro-30440-28-15.svg',
      caption:'第二十八分「知一切法無我，得成於忍」明確回接第十五分忍辱線：28 → 15',
      anchor:'「知一切法無我，得成於忍」可回接第十四、十五分的忍辱線。'
    },
    {
      key:'retro-30440-28-27-26-25-group',
      src:'figures/retro-30440-28-27-26-25.svg',
      caption:'第二十八分收住第二十五至第二十八分「高級主體的反撲」整組：28 → 27 → 26 → 25',
      anchor:'第二十八分因此剛好收住第二十五到第二十八分這一組。\n\n第二十五分拆「我當度眾生」。不能有救世主體。\n\n第二十六分拆「我能以三十二相辨認如來」。不能有辨認主體。\n\n第二十七分拆「我懂空，所以諸法斷滅」。不能有懂空主體。\n\n第二十八分拆「我作福德，但我不受」。不能有清淨收款主體。'
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
