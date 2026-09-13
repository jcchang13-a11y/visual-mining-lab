/* 《剛吃飽》第八版｜爛尾樓版｜30330 回溯增補
 * 忠於正文既有尺度回指，不改正文。
 * 長鏈保留；直接回扣另加鷹架，不以單一路徑代替正文同時叫回的前段現場。
 */
(function(){
  'use strict';
  const unit=new URLSearchParams(location.search).get('u');
  if(unit!=='30330') return;
  const article=document.getElementById('article');
  if(!article) return;

  const groups=[
    {
      anchor:'前面才剛剛把此經吹到非常大。須彌山、恆河沙、三千大千世界、恆河沙數三千大千世界、七寶布施、佛塔廟、經典所在之處則為有佛，全部都被搬出來。',
      figures:[
        {
          key:'retro-30330-13-12-11-10-8',
          src:'figures/retro-30330-13-12-11-10-8.svg',
          caption:'第十三分世界／微塵的尺度插題回看此前一路放大的經典現場與宇宙尺度：13 → 12 → 11 → 10 → 8'
        },
        {
          key:'retro-30330-13-12',
          src:'figures/retro-30330-13-12.svg',
          caption:'第十三分尺度收縮直接回看第十二分的經典所在／佛塔廟現場：13 → 12'
        },
        {
          key:'retro-30330-13-11',
          src:'figures/retro-30330-13-11.svg',
          caption:'第十三分尺度收縮直接回看第十一分的恆河沙數世界與七寶布施：13 → 11'
        },
        {
          key:'retro-30330-13-10',
          src:'figures/retro-30330-13-10.svg',
          caption:'第十三分世界／微塵直接回看第十分此前推大的世界尺度：13 → 10'
        },
        {
          key:'retro-30330-13-8',
          src:'figures/retro-30330-13-8.svg',
          caption:'第十三分尺度插題直接回看第八分七寶布施與經典價值的放大起點：13 → 8'
        }
      ]
    },
    {
      anchor:'因為前面我們一直在拆「我在做」「我在修」「我在布施」「我在度眾生」。',
      figures:[
        {
          key:'retro-30330-13-3',
          src:'figures/retro-30330-13-3.svg',
          caption:'第十三分把尺度觀看者這個更細的「我」回接第三分「我在度眾生」與四相主體：13 → 3'
        },
        {
          key:'retro-30330-13-4',
          src:'figures/retro-30330-13-4.svg',
          caption:'第十三分把尺度觀看者這個更細的「我」回接第四分「我在布施」／不住相布施的行動主體：13 → 4'
        }
      ]
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

  function applyGroup(group){
    const missing=group.figures.filter(spec=>!article.querySelector('[data-retro-key="'+spec.key+'"]'));
    if(!missing.length) return true;
    const walker=document.createTreeWalker(article,NodeFilter.SHOW_TEXT);
    let node;
    while((node=walker.nextNode())){
      const at=(node.nodeValue||'').indexOf(group.anchor);
      if(at<0) continue;
      const tail=node.splitText(at+group.anchor.length);
      for(const spec of missing){
        tail.parentNode.insertBefore(document.createTextNode('\n'),tail);
        tail.parentNode.insertBefore(makeFigure(spec),tail);
      }
      tail.parentNode.insertBefore(document.createTextNode('\n'),tail);
      return true;
    }
    return false;
  }

  function apply(){
    let complete=true;
    groups.forEach(group=>{if(!applyGroup(group)) complete=false;});
    return complete;
  }

  if(apply()) return;
  const observer=new MutationObserver(()=>{if(apply())observer.disconnect()});
  observer.observe(article,{childList:true,subtree:true,characterData:true});
  setTimeout(()=>observer.disconnect(),15000);
})();
