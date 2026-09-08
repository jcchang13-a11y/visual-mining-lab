/* 《剛吃飽》第八版｜爛尾樓版｜30440 回溯補齊層
 * 補第二十五至二十八分正文中明確存在、主 renderer 尚未完整覆蓋的回收線。
 * 不改正文；只認唯一 anchor；找不到就不插。
 */
(function(){
  'use strict';
  const unit=new URLSearchParams(location.search).get('u');
  if(unit!=='30440') return;

  const specs=[
    {
      key:'retro-30440-25-24-23-22-21-20-19',
      src:'figures/retro-30440-25-24-23-22-21-20-19.svg',
      caption:'第二十五至二十八分開場先回收前一整組第十九至二十四分：25 → 24 → 23 → 22 → 21 → 20 → 19',
      anchor:'第十九到第二十四分，經文已經把幾個很大的東西都丟進公式裡測過一次：福德、色身、說法、得法、善法、此經功德。每一個都可以說，每一個都不能有實。到第二十四分，甚至連「受持讀誦、為人說經，其福勝彼」這麼高級的功德比較，也不能被收成新的功德帳戶。'
    },
    {
      key:'retro-30440-25-17-3',
      src:'figures/retro-30440-25-17-3.svg',
      caption:'第二十五分把「我當度眾生」直接回接第十七分，再回到第三分最早的度眾生／實無眾生得滅度者：25 → 17 → 3',
      anchor:'第二十五分不是單純重複第三分。\n\n第三分已經說過，菩薩要滅度一切眾生，但實無眾生得滅度者。第十七分又說，如果菩薩作是言「我當滅度無量眾生」，即不名菩薩。那時候問題還在菩薩身上：菩薩不能把自己放到度眾生的位置上，不能說「我在度」「我應當度」「我完成度眾生這件事」。'
    },
    {
      key:'retro-30440-25-21',
      src:'figures/retro-30440-25-21.svg',
      caption:'第二十五分的「我當度眾生」與第二十一分「我當有所說法」形成直接結構對照：25 → 21',
      anchor:'這句要跟第二十一分一起看。第二十一分說：\n\n「汝勿謂如來作是念：我當有所說法。」\n\n第二十五分說：\n\n「汝等勿謂如來作是念：我當度眾生。」'
    },
    {
      key:'retro-30440-26-20',
      src:'figures/retro-30440-26-20.svg',
      caption:'第二十六分把三十二相的辨認問題明確接回第二十分的具足色身／諸相具足：26 → 20',
      anchor:'前面第二十分已經講過具足色身、諸相具足；到這裡，三十二相正式出場。'
    },
    {
      key:'retro-30440-26-1',
      src:'figures/retro-30440-26-1.svg',
      caption:'第二十六分再回第一分的有身、有聲、有動作：26 → 1',
      anchor:'第二十六分仍然要連回第一分。第一分佛有身體，有聲音，有動作。'
    },
    {
      key:'retro-30440-27-26',
      src:'figures/retro-30440-27-26.svg',
      caption:'第二十七分緊接第二十六分，從不應以相觀如來防止滑向反相：27 → 26',
      anchor:'第二十六分剛說，不應以三十二相觀如來。若以色見我，以音聲求我，是人行邪道，不能見如來。'
    },
    {
      key:'retro-30440-27-6',
      src:'figures/retro-30440-27-6.svg',
      caption:'第二十七分「不落反相」明確回收第六分不取法、不取非法：27 → 6',
      anchor:'第六分早就講過：「不應取法，不應取非法。」取法不行，取非法也不行。現在第二十七分是在後段重新收這一刀。'
    },
    {
      key:'retro-30440-27-24-23-22-21-20-19',
      src:'figures/retro-30440-27-24-23-22-21-20-19.svg',
      caption:'第二十七分用「不是斷滅」重新回收第十九至二十四分整組：27 → 24 → 23 → 22 → 21 → 20 → 19',
      anchor:'第十九到第二十四分一直在說，可以說，但不能有實。福德可以說多，但不能有實。說法可以發生，但無法可說。阿耨多羅三藐三菩提可以被說名，但無有少法可得。善法可以修，但善法即非善法，是名善法。'
    },
    {
      key:'retro-30440-28-24-19-11',
      src:'figures/retro-30440-28-24-19-11.svg',
      caption:'第二十八分把福德線重新叫回來：28 → 24 → 19 → 11',
      anchor:'第二十八分又把福德叫回來。\n\n第十九分講福德無實。第二十四分講受持讀誦、為人說經的福德勝過須彌山王七寶布施。現在第二十八分又講恆河沙等世界七寶布施，而且主角變成菩薩。\n\n這一次的對比不是普通人布施，而是菩薩布施。\n\n如果有菩薩用滿恆河沙等世界七寶布施，這已經很大。不是一個世界，不是三千大千世界，而是恆河沙等世界。前面第十一分用恆河沙把數量推到爆掉，現在第二十八分再把這個宇宙級布施叫回來。'
    },
    {
      key:'retro-30440-28-15-14',
      src:'figures/retro-30440-28-15-14.svg',
      caption:'第二十八分「知一切法無我，得成於忍」回接第十五、十四分的忍辱線：28 → 15 → 14',
      anchor:'「知一切法無我，得成於忍」可回接第十四、十五分的忍辱線。忍不是單純忍耐，也不是受苦美德，而是在一切法無我中承受，不讓受苦、修行、功德重新回到「我正在忍」「我正在修」「我正在得」的位置。'
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
