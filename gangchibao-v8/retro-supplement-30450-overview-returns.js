/* 《剛吃飽》第八版｜爛尾樓版｜30450 最後清場總覽局部回返補線
 * 總覽本身已再次發生回溯，因此不能只依賴後面各分的詳細圖。
 * 不改正文；不取代既有 29→1、31→四相歷史圖；只在總覽的實際閱讀位置各補一張。
 */
(function(){
  'use strict';
  const unit=new URLSearchParams(location.search).get('u');
  if(unit!=='30450') return;

  const specs=[
    {
      key:'retro-30450-overview-29-1',
      src:'figures/retro-30450-overview-29-1.svg',
      caption:'最後清場總覽在第一個藏身處，直接以第二十九分回看第一分具體的來去坐臥與飯後現場：29 → 1',
      anchor:'第一個藏身處，是如來的行動。佛不是明明來了、去了、坐下、躺下嗎？第一分不就是這樣開始的嗎？入舍衛大城乞食，於其城中次第乞已，還至本處，飯食訖，收衣鉢，洗足已，敷座而坐。整部經一開始就是來去坐臥。第二十九分就回來拆這個：如來者，無所從來，亦無所去，故名如來。'
    },
    {
      key:'retro-30450-overview-30-scale-history',
      src:'figures/retro-30450-overview-30-scale-history.svg',
      caption:'最後清場總覽在第二個藏身處，明確把第三十分的世界／微塵問題接回前段宇宙尺度放大史：30 → 11 → 10 → 8',
      anchor:'第二個藏身處，是世界。前面講三千大千世界、恆河沙世界、須彌山王、七寶聚，整個空間一直放大。那麼最後總有一個世界吧？總有一個宇宙整體吧？第三十分說，世界也不能有實。甚至連微塵也不能做成最小地基。最大整體靠不住，最小單位也靠不住，連一合相也靠不住。'
    },
    {
      key:'retro-30450-overview-31-fourmarks',
      src:'figures/retro-30450-overview-31-fourmarks.svg',
      caption:'最後清場總覽在第三個藏身處，把第三十一分的四見重新接回前面反覆出現的四相歷史：31 → 25 → 17 → 14 → 6 → 3',
      anchor:'第三個藏身處，是診斷本身。前面一直講我相、人相、眾生相、壽者相。那麼我至少可以說，我知道什麼叫我見、人見、眾生見、壽者見吧？第三十一分連這個也拆。所謂我見，即非我見，是名我見。連診斷名詞也不能有實。你不能拿「我見」這個詞去抓別人，也不能拿它來證明自己比較清醒。'
    },
    {
      key:'retro-30450-overview-32-merit-history',
      src:'figures/retro-30450-overview-32-merit-history.svg',
      caption:'最後清場總覽在第四個藏身處，第三十二分最後偈之前先把受持讀誦／為人演說的福德歷史整條叫回來：32 → 24 → 19 → 16 → 15 → 11 → 8',
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

  function alreadyHas(root,spec){
    if(root.querySelector('[data-retro-key="'+spec.key+'"]')) return true;
    return Array.from(root.querySelectorAll('.retro-figure__img')).some(img=>{
      const raw=img.getAttribute('src')||'';
      return raw===spec.src || raw.endsWith('/'+spec.src);
    });
  }

  function insert(root,spec){
    if(alreadyHas(root,spec)) return true;
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
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

  function apply(){
    const root=document.getElementById('article');
    if(!root) return false;
    return specs.map(spec=>insert(root,spec)).every(Boolean);
  }

  const article=document.getElementById('article');
  if(!article) return;
  if(apply()) return;
  const observer=new MutationObserver(()=>{if(apply())observer.disconnect()});
  observer.observe(article,{childList:true,subtree:true,characterData:true});
  setTimeout(()=>observer.disconnect(),15000);
})();
