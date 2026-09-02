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
    const img=document.createElement('img');
    img.className='retro-figure__img';
    img.src=src.trim();
    img.alt=(caption||'回溯結構同心圓圖').trim();
    img.loading='lazy';
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

  window.GCBRetro={makeRetroFigure,parseRetroMarker};
})();
