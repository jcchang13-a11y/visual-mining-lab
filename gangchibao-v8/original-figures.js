/* 《剛吃飽》第八版｜既有原圖接回鷹架
 * 不改正文；只在已核定的唯一高信心 anchor 後插入使用者原圖。
 * 圖檔保持原樣，不重畫、不裁切、不清稿。
 */
(function(){
  'use strict';

  const figures={
    '30310B':{
      title:'須彌世界／佛教空間地理觀示意圖',
      src:'https://i.ibb.co/5WBsNvKF/file-00000000d23871f894cecfa118e84f95.png',
      anchor:'從這裡開始，後面所有東西都不再是日常尺度了。'
    },
    '30340':{
      title:'佛／如來相對關係圖',
      src:'https://i.ibb.co/SDYGT2qW/file-000000000c0871fd996f6ac8bcc4cb96.png',
      anchor:'這裡也要注意「佛」和「如來」的稱呼切換。'
    },
    '30390':{
      title:'P／L／S 三圓圖',
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
    const cap=document.createElement('figcaption');
    cap.textContent=spec.title+'｜使用者原圖';
    fig.append(img,cap);
    return fig;
  }

  function insertAtAnchor(article,spec){
    if(!article||article.querySelector('[data-original-figure="'+CSS.escape(spec.title)+'"]')) return true;
    const walker=document.createTreeWalker(article,NodeFilter.SHOW_TEXT);
    let node;
    while((node=walker.nextNode())){
      const at=node.nodeValue.indexOf(spec.anchor);
      if(at<0) continue;
      const tail=node.splitText(at+spec.anchor.length);
      const fig=makeFigure(spec);
      tail.parentNode.insertBefore(document.createTextNode('\n\n'),tail);
      tail.parentNode.insertBefore(fig,tail);
      tail.parentNode.insertBefore(document.createTextNode('\n\n'),tail);
      return true;
    }
    return false;
  }

  function apply(){
    const u=new URLSearchParams(location.search).get('u');
    const spec=figures[u];
    if(!spec) return true;
    return insertAtAnchor(document.getElementById('article'),spec);
  }

  const article=document.getElementById('article');
  if(!article) return;
  if(apply()) return;
  const observer=new MutationObserver(()=>{if(apply())observer.disconnect()});
  observer.observe(article,{childList:true,subtree:true,characterData:true});
  setTimeout(()=>observer.disconnect(),15000);
})();
