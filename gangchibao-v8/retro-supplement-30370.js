/* 《剛吃飽》第八版｜爛尾樓版｜30370 第十五分回溯增補
 * 不清場，只加鷹架：保留既有 15→14→13、15→13→11→8 與 15→12；
 * 再把正文自己明確叫回的第十三、十四、八、十一分拆成直接同心圓。
 */
(function(){
  'use strict';
  const unit=new URLSearchParams(location.search).get('u');
  if(unit!=='30370') return;
  const article=document.getElementById('article');
  if(!article) return;

  const specs=[
    {
      key:'retro-30370-15-12',
      src:'figures/retro-30370-15-12.svg',
      caption:'第十五分「在在處處，若有此經／此處則為是塔」把經典所在之處與供養場所的力線重新接回第十二分：15 → 12',
      anchor:'這一段延續第十二分「經典所在之處，即為有佛，若尊重弟子」的力線：此經一旦被受持、讀誦、為人解說，就不再只停留於原初法會現場，而會在新的地方形成新的經文現場。'
    },
    {
      key:'retro-30370-15-13-direct',
      src:'figures/retro-30370-15-13.svg',
      caption:'第十五分把「恆河沙等身命布施／受持四句偈、為人說」的比較現場直接叫回第十三分：15 → 13',
      anchor:'第十五分到這裡，不再只是說兩邊都有福，而是說得很清楚：其福勝彼。'
    },
    {
      key:'retro-30370-15-14-direct',
      src:'figures/retro-30370-15-14.svg',
      caption:'第十五分的身布施比較直接承接第十四分第一波羅蜜／忍辱波羅蜜的即非現場：15 → 14',
      anchor:'第十五分到這裡，不再只是說兩邊都有福，而是說得很清楚：其福勝彼。'
    },
    {
      key:'retro-30370-15-8-direct',
      src:'figures/retro-30370-15-8.svg',
      caption:'第十五分「書寫、受持、讀誦、為人解說」直接回到第八分受持四句偈、為他人說的功德比較：15 → 8',
      anchor:'第十五分的「何況書寫、受持、讀誦、為人解說」不是突然開啟新主題，而是把這條已經反覆出現的線接到「其福勝彼」之後。'
    },
    {
      key:'retro-30370-15-11-direct',
      src:'figures/retro-30370-15-11.svg',
      caption:'第十五分「為人解說／其福勝彼」直接回到第十一分四句偈與勝前福德的比較：15 → 11',
      anchor:'第十五分的「何況書寫、受持、讀誦、為人解說」不是突然開啟新主題，而是把這條已經反覆出現的線接到「其福勝彼」之後。'
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

  function alreadyHasFigure(spec){
    if(article.querySelector('[data-retro-key="'+spec.key+'"]')) return true;
    return Array.from(article.querySelectorAll('.retro-figure__img')).some(img=>{
      const raw=img.getAttribute('src')||'';
      return raw===spec.src || raw.endsWith('/'+spec.src);
    });
  }

  function insertOne(spec){
    if(alreadyHasFigure(spec)) return true;
    const walker=document.createTreeWalker(article,NodeFilter.SHOW_TEXT);
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
    let done=true;
    for(const spec of specs) if(!insertOne(spec)) done=false;
    return done;
  }

  if(apply()) return;
  const observer=new MutationObserver(()=>{if(apply())observer.disconnect()});
  observer.observe(article,{childList:true,subtree:true,characterData:true});
  setTimeout(()=>observer.disconnect(),15000);
})();
