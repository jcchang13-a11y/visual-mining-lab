/* 《剛吃飽》第八版｜爛尾樓版｜既有原圖外部依賴缺件鷹架
 * 不改原圖、不搬圖、不仿畫；只讓 ImgBB 原件失效時在 LIVE／列印層留下可見缺件斷面。
 * 原 original-figures.js 與既有外部 URL 全部保留。
 */
(function(){
  'use strict';

  const styleId='gcb-original-figure-external-fallback-style';
  if(!document.getElementById(styleId)){
    const style=document.createElement('style');
    style.id=styleId;
    style.textContent=`
      .original-figure-missing{
        box-sizing:border-box;
        max-width:38em;
        margin:.8em auto 0;
        padding:.9em 1em;
        border:1px dashed #99958d;
        color:#6f6b64;
        background:#faf8f1;
        font:12px/1.6 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;
        text-align:center;
        white-space:normal;
      }
      @media print{
        .original-figure-missing{
          max-width:100%;
          background:#fff;
          break-inside:avoid;
          page-break-inside:avoid;
        }
      }
    `;
    document.head.append(style);
  }

  function showMissing(img){
    const fig=img.closest('.original-figure');
    if(!fig || fig.querySelector('.original-figure-missing')) return;
    img.hidden=true;
    fig.dataset.gcbOriginalExternalMissing='1';
    const note=document.createElement('div');
    note.className='original-figure-missing';
    note.textContent='ORIGINAL FIGURE / 外部原圖未載入｜原圖位置保留；不仿畫，不以替代圖冒充原件。';
    const cap=fig.querySelector('figcaption');
    if(cap) fig.insertBefore(note,cap);
    else fig.append(note);
  }

  function wire(img){
    if(!img || img.dataset.gcbExternalFallbackWired==='1') return;
    const src=img.getAttribute('src')||'';
    if(!/^https?:\/\//i.test(src)) return;
    img.dataset.gcbExternalFallbackWired='1';
    img.addEventListener('error',()=>showMissing(img),{once:true});
    if(img.complete && img.naturalWidth===0) showMissing(img);
  }

  function apply(){
    document.querySelectorAll('.original-figure img').forEach(wire);
  }

  apply();
  const root=document.getElementById('article')||document.body;
  const observer=new MutationObserver(apply);
  observer.observe(root,{childList:true,subtree:true});
  setTimeout(()=>observer.disconnect(),20000);
})();
