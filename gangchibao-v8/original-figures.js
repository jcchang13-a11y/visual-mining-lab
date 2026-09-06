/* 《剛吃飽》第八版｜既有原圖接回鷹架
 * 不改正文；只在已核定的唯一高信心 anchor 後插入使用者原圖。
 * 圖檔保持原樣，不重畫、不裁切、不清稿。
 * 原圖已找回後，同步移除 reader 裡舊的「待接回」施工槽；施工史仍留在 figure-slots／ledger。
 */
(function(){
  'use strict';

  const figures={
    '30310B':{
      title:'須彌世界／佛教空間地理觀示意圖',
      slotKey:'sumeru-world-original',
      src:'https://i.ibb.co/5WBsNvKF/file-00000000d23871f894cecfa118e84f95.png',
      anchor:'從這裡開始，後面所有東西都不再是日常尺度了。'
    },
    '30340':{
      title:'佛／如來相對關係圖',
      slotKey:'buddha-tathagata-original',
      src:'https://i.ibb.co/SDYGT2qW/file-000000000c0871fd996f6ac8bcc4cb96.png',
      anchor:'這裡也要注意「佛」和「如來」的稱呼切換。'
    },
    '30390':{
      title:'P／L／S 三圓圖',
      slotKey:'pls-three-circles-original',
      src:'https://i.ibb.co/Fkb2L05g/file-000000006a3071f7adc96f932ee27592.png',
      anchor:'N：第十七分不是重複第二分，而是回頭清算誰在發心、誰在得法、誰在當菩薩。'
    }
  };

  function makeFigure(spec){
    const fig=document.createElement('figure');
    fig.className='existing-figure original-figure';
    fig.dataset.originalFigure=spec.title;
    const img=document.createElement('img');
    img.src=spec.src;
    img.alt=spec.title;
    img.loading='lazy';
    img.decoding='async';
    const cap=document.createElement('figcaption');
    cap.textContent=spec.title+'｜使用者原圖';
    fig.append(img,cap);
    return fig;
  }

  function removeLegacySlots(spec){
    if(spec?.slotKey){
      document.querySelectorAll('[data-figure-slot="'+CSS.escape(spec.slotKey)+'"]').forEach(el=>el.remove());
    }
    /* 出版印章已經接到版本首頁；單元 reader 不再重複顯示「待接回」出版槽。 */
    document.querySelectorAll('[data-publication-mark="diploma-mill"]').forEach(el=>el.remove());
  }

  function insertAtAnchor(article,spec){
    if(!article) return false;
    removeLegacySlots(spec);
    if(article.querySelector('[data-original-figure="'+CSS.escape(spec.title)+'"]')) return true;
    const walker=document.createTreeWalker(article,NodeFilter.SHOW_TEXT);
    let node;
    while((node=walker.nextNode())){
      const at=(node.nodeValue||'').indexOf(spec.anchor);
      if(at<0) continue;
      const tail=node.splitText(at+spec.anchor.length);
      const fig=makeFigure(spec);
      tail.parentNode.insertBefore(document.createTextNode('\n\n'),tail);
      tail.parentNode.insertBefore(fig,tail);
      tail.parentNode.insertBefore(document.createTextNode('\n\n'),tail);
      removeLegacySlots(spec);
      return true;
    }
    return false;
  }

  function apply(){
    const u=new URLSearchParams(location.search).get('u');
    const spec=figures[u];
    removeLegacySlots(spec);
    if(!spec) return true;
    return insertAtAnchor(document.getElementById('article'),spec);
  }

  const article=document.getElementById('article');
  const wrap=document.querySelector('main.wrap');
  if(!article) return;

  apply();

  /* retro-renderer 是舊施工層，可能稍後非同步補回 legacy slot；持續清掉這種已失效的「缺件」顯示。 */
  const observer=new MutationObserver(()=>apply());
  observer.observe(wrap||article,{childList:true,subtree:true,characterData:true});
  setTimeout(()=>observer.disconnect(),15000);
})();
