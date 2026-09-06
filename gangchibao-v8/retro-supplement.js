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
    ],
    '30310B':[
      {
        key:'retro-30310B-11-8',
        src:'figures/retro-30310B-11-8.svg',
        caption:'第十一分把第八分的福德比較公式放大重演：11 → 8',
        anchor:'這裡其實是第八分福德比較公式的升級版。第八分已經比過一次：有人以三千大千世界七寶布施，福德很多；但若有人於此經中，受持乃至四句偈等，為他人說，其福勝彼。到了第十一分，公式沒有變，數量升級了。第八分是一個三千大千世界七寶布施；第十一分變成恆河沙數三千大千世界七寶布施。'
      }
    ],
    '30340':[
      {
        key:'retro-30340-13-5',
        src:'figures/retro-30340-13-5.svg',
        caption:'第十三分以三十二相問題回收第五分的身相見如來問題：13 → 5',
        anchor:'可是它不是單純重複。它確實回收第五分，但焦點已經換了。'
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
