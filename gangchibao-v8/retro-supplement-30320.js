/* 《剛吃飽》第八版｜爛尾樓版｜30320 回溯增補
 * 忠於正文既有回指，不改正文。
 */
(function(){
  'use strict';
  const unit=new URLSearchParams(location.search).get('u');
  if(unit!=='30320') return;
  const article=document.getElementById('article');
  if(!article) return;

  const specs=[
    {
      key:'retro-30320-13-10',
      anchor:'前面才剛說過：「佛說非身，是名大身。」這裡的「是名」不是普通貼標籤',
      src:'figures/retro-30320-13-10.svg',
      caption:'第十三分以「般若波羅蜜即非般若波羅蜜」回看第十分「佛說非身，是名大身」的同一台是名機器：13 → 10'
    },
    {
      key:'retro-30320-13-7',
      anchor:'它接著問：「如來有所說法不？」',
      src:'figures/retro-30320-13-7.svg',
      caption:'第十三分再次追問「如來有所說法不」，直接回到第七分「如來有所說法耶」對說法位置的拆解：13 → 7'
    },
    {
      key:'retro-30320-13-8-scale-history',
      anchor:'前面把此經一路吹大：須彌山、恆河沙、三千大千世界、七寶布施',
      src:'figures/retro-30330-13-8.svg',
      caption:'第十三分回顧「此經一路吹大」時，把尺度史接回第八分七寶布施與受持四句偈的比較起點：13 → 8'
    },
    {
      key:'retro-30320-13-11-scale-history',
      anchor:'恆河沙、三千大千世界、七寶布施、天人阿修羅',
      src:'figures/retro-30330-13-11.svg',
      caption:'第十三分同一段回顧重新叫回第十一分恆河沙數世界與七寶布施：13 → 11'
    },
    {
      key:'retro-30320-13-12-scale-history',
      anchor:'佛塔廟、經典所在之處則為有佛，全部都被搬出來替此經墊高。',
      src:'figures/retro-30330-13-12.svg',
      caption:'第十三分同一段回顧重新叫回第十二分經典所在之處如佛塔廟、則為有佛的現場：13 → 12'
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

  function applyOne(spec){
    if(article.querySelector('[data-retro-key="'+spec.key+'"]')) return true;
    const walker=document.createTreeWalker(article,NodeFilter.SHOW_TEXT);
    let node;
    while((node=walker.nextNode())){
      if(node.parentElement?.closest('.sutra-block')) continue;
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

  function applyAll(){
    let done=true;
    for(const spec of specs) done=applyOne(spec)&&done;
    return done;
  }

  if(applyAll()) return;
  const observer=new MutationObserver(()=>{if(applyAll())observer.disconnect()});
  observer.observe(article,{childList:true,subtree:true,characterData:true});
  setTimeout(()=>observer.disconnect(),15000);
})();