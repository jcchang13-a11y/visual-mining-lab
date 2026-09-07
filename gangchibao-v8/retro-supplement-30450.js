/* 《剛吃飽》第八版｜爛尾樓版｜30450 回溯圖增補層
 * 只接正文可明確支持的回溯；不改正文，不改主 renderer。
 */
(function(){
  'use strict';
  const unit=new URLSearchParams(location.search).get('u');
  if(unit!=='30450') return;

  const specs=[
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
      key:'retro-30450-32-merit-full',
      src:'figures/retro-30450-32-merit.svg',
      caption:'第三十二分把全經福德比較線完整叫回來：32 → 24 → 19 → 16 → 15 → 11 → 8',
      anchor:'它從第八分、第十一分、第十五分、第十六分、第十九分、第二十四分一路回來，到最後第三十二分還在。'
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
