/* 《剛吃飽》第八版｜SET01 master sprite 實體圖像裁切鷹架
 * 不改原圖、不拆 sprite、不清掉 original-figures.js 既有 background-position 施工法。
 * 只在 LIVE 閱讀層把已載入的同一張 master sprite 疊成真正 SVG <image> 裁切，
 * 讓螢幕與列印不再依賴「列印背景圖」開關。舊 background 方法仍留在原檔作施工史／fallback。
 */
(function(){
  'use strict';

  const article=document.getElementById('article');
  if(!article) return;

  const NS='http://www.w3.org/2000/svg';
  const FRAME_W=184;
  const FRAME_H=332;
  const FRAME_COUNT=12;

  function backgroundUrl(el){
    const raw=(el?.style?.backgroundImage||'').trim();
    if(!raw||raw==='none') return '';
    const m=raw.match(/^url\((?:"|')?(.*?)(?:"|')?\)$/);
    return m?m[1]:'';
  }

  function upgrade(frameEl){
    if(!frameEl||frameEl.dataset.set01ImageCrop==='svg') return true;
    const fig=frameEl.closest('[data-set01-frame]');
    if(!fig) return false;
    const frameNumber=Number(fig.dataset.set01Frame);
    if(!Number.isFinite(frameNumber)||frameNumber<1||frameNumber>FRAME_COUNT) return false;
    const sprite=backgroundUrl(frameEl);
    if(!sprite) return false;

    const svg=document.createElementNS(NS,'svg');
    svg.classList.add('set01-photo__svg-crop');
    svg.setAttribute('viewBox',`0 0 ${FRAME_W} ${FRAME_H}`);
    svg.setAttribute('width','100%');
    svg.setAttribute('height','100%');
    svg.setAttribute('preserveAspectRatio','xMidYMid meet');
    svg.setAttribute('aria-hidden','true');
    svg.style.display='block';
    svg.style.width='100%';
    svg.style.height='100%';
    svg.style.overflow='hidden';

    const image=document.createElementNS(NS,'image');
    image.setAttribute('href',sprite);
    image.setAttribute('x','0');
    image.setAttribute('y',String(-(frameNumber-1)*FRAME_H));
    image.setAttribute('width',String(FRAME_W));
    image.setAttribute('height',String(FRAME_H*FRAME_COUNT));
    image.setAttribute('preserveAspectRatio','none');
    svg.append(image);

    frameEl.append(svg);
    frameEl.dataset.set01ImageCrop='svg';
    frameEl.dataset.set01LegacyBackground='preserved-in-source';
    /* SVG 已用同一 master sprite 畫出實體圖像；避免螢幕重疊。原 background 設定仍保留在 original-figures.js。 */
    frameEl.style.backgroundImage='none';
    return true;
  }

  function apply(){
    article.querySelectorAll('.set01-photo__frame').forEach(upgrade);
  }

  apply();
  const observer=new MutationObserver(apply);
  observer.observe(article,{childList:true,subtree:true,attributes:true,attributeFilter:['style']});
  setTimeout(()=>{apply();observer.disconnect();},20000);
})();
