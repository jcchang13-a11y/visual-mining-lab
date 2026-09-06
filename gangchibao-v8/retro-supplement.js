/* 《剛吃飽》第八版｜爛尾樓版｜回溯圖增補層
 * 用途：在不改動既有正文與主 renderer 的前提下，接入後續核定的高信心回溯圖。
 * 原則：只認明確 anchor；找不到就不插，不猜位置。
 */
(function(){
  'use strict';

  const SPECS={
    '30270B':[
      {
        key:'retro-30270B-9-3',
        src:'figures/retro-30270B-9-3.svg',
        caption:'第九分以果位位置回看第三分的菩薩位置：9 → 3',
        anchor:'前面第三分測的是菩薩這個位置：菩薩能不能把發心與度眾生收成「我在做好事」「我在幫助別人」「我在度眾生」？到了第九分，經文換到果位這個位置：須陀洹、斯陀含、阿那含、阿羅漢，這些修行階段能不能被收成「這是我得到的成就」？'
      }
    ],
    '30280B':[
      {
        key:'retro-30280B-10-9',
        src:'figures/retro-30280B-10-9.svg',
        caption:'第十分把第九分的「得／我得」推到如來得法與菩薩莊嚴佛土：10 → 9',
        anchor:'第九分剛剛把「我得」放到果位上檢查。須陀洹、斯陀含、阿那含、阿羅漢，當然都是修果有所成就之輩；可是這個「得」，不能被收成「我得」。到了第十分，這個「得／我得」的區別沒有停下來，而是被推到如來自己的過去：如來昔在然燈佛所，於法有所得不？'
      }
    ]
  };

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

  function insert(root,spec){
    if(!root||root.querySelector('[data-retro-key="'+spec.key+'"]')) return true;
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
    const unit=new URLSearchParams(location.search).get('u');
    const specs=SPECS[unit]||[];
    const article=document.getElementById('article');
    if(!article||!specs.length) return !specs.length;
    return specs.every(spec=>insert(article,spec));
  }

  const article=document.getElementById('article');
  if(!article) return;
  if(apply()) return;
  const observer=new MutationObserver(()=>{if(apply())observer.disconnect()});
  observer.observe(article,{childList:true,subtree:true,characterData:true});
  setTimeout(()=>observer.disconnect(),15000);
})();
