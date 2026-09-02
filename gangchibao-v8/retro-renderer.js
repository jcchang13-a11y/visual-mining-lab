/* 《剛吃飽》第八版｜爛尾樓版｜共用回溯圖 renderer
   不負責解經，只把已確認的回溯圖接成穩定閱讀層。
   Marker:
   [[RETRO: figures/retro-30450-29-first.svg | 第二十九分回看第一分]]
*/
(function(){
  const MARKER=/^\s*\[\[RETRO:\s*([^|\]]+?)(?:\s*\|\s*([^\]]+?))?\s*\]\]\s*$/i;

  function makeRetroFigure(src, caption){
    const figure=document.createElement('figure');
    figure.className='retro-figure';
    figure.dataset.gcbLayer='retrospective';

    const img=document.createElement('img');
    img.className='retro-figure__img';
    img.src=src.trim();
    img.alt=(caption||'回溯結構同心圓圖').trim();
    img.loading='lazy';
    img.decoding='async';
    figure.append(img);

    if(caption){
      const cap=document.createElement('figcaption');
      cap.className='retro-figure__caption';
      cap.textContent=caption.trim();
      figure.append(cap);
    }
    return figure;
  }

  function parseRetroMarker(line){
    const m=MARKER.exec(line||'');
    return m?{src:m[1].trim(),caption:(m[2]||'').trim()}:null;
  }

  /*
    Replace marker-only text lines inside an already-rendered reading root.
    It deliberately leaves every non-marker character untouched.
    This allows the V8 reader to keep its current text/施工 renderer and add
    retrospective figures as a separate archaeological layer.
  */
  function renderMarkers(root){
    if(!root) return 0;
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
    const textNodes=[];
    while(walker.nextNode()) textNodes.push(walker.currentNode);

    let count=0;
    textNodes.forEach(node=>{
      const value=node.nodeValue||'';
      if(!value.includes('[[RETRO:')) return;

      const lines=value.split(/(\r?\n)/);
      if(!lines.some(part=>parseRetroMarker(part))) return;

      const frag=document.createDocumentFragment();
      lines.forEach(part=>{
        const marker=parseRetroMarker(part);
        if(marker){
          frag.append(makeRetroFigure(marker.src,marker.caption));
          count++;
        }else if(part){
          frag.append(document.createTextNode(part));
        }
      });
      node.replaceWith(frag);
    });
    return count;
  }

  /*
    Optional observer for readers that replace article text after fetch().
    Installing it does not change text by itself; it only reacts when a
    confirmed [[RETRO: ...]] marker appears.
  */
  function observe(root){
    if(!root) return null;
    renderMarkers(root);
    const observer=new MutationObserver(()=>renderMarkers(root));
    observer.observe(root,{subtree:true,childList:true,characterData:true});
    return observer;
  }

  window.GCBRetro={makeRetroFigure,parseRetroMarker,renderMarkers,observe};
})();
