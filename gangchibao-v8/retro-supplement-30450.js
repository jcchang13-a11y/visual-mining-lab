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
      key:'retro-30450-32-15-13-11-8',
      src:'figures/retro-30450-32-15-13-11-8.svg',
      caption:'第三十二分把受持讀誦、為人演說與福德比較線重新叫回來：32 → 15 → 13 → 11 → 8',
      anchor:'第三十二分不是叫你說一切都是假的。它先把受持讀誦、為人演說的福德又叫回來，然後立刻說：云何為人演說？不取於相，如如不動。最後才說如夢幻泡影。也就是說，最後不是退回沉默，不是說法取消，而是要演說；但演說時不能取相。'
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
