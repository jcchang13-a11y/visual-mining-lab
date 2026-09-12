/* 《剛吃飽》第八版｜爛尾樓版｜SET01 攝影組缺件鷹架
 * 不重畫、不替代、不改 original-figures.js。
 * 只有在本單元本來應有 SET01、但本地 sprite 沒有成功組裝時，才留下可見缺件斷面；若原圖稍後載入，缺件牌自行撤下。
 */
(function(){
  'use strict';

  const expected=new Set(['30000','30210','30220','30240B','30260B','30280B','30320','30350A','30370','30390','30430','30440']);
  const unit=new URLSearchParams(location.search).get('u');
  if(!expected.has(unit)) return;

  const article=document.getElementById('article');
  if(!article) return;

  const style=document.createElement('style');
  style.textContent=`
    .set01-missing-fallback{
      box-sizing:border-box;
      max-width:38em;
      margin:1.6em auto;
      padding:1em 1.1em;
      border:1px dashed #99958d;
      color:#6f6b64;
      background:#faf8f1;
      font:12px/1.65 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;
      text-align:center;
      white-space:normal;
    }
    @media print{
      .set01-missing-fallback{
        max-width:100%;
        background:#fff;
        break-inside:avoid;
        page-break-inside:avoid;
      }
    }
  `;
  document.head.append(style);

  let fallback=null;
  function hasPhoto(){ return !!article.querySelector('[data-set01-frame]'); }
  function clearFallback(){
    if(fallback){ fallback.remove(); fallback=null; }
  }
  function ensureFallback(){
    if(hasPhoto()){ clearFallback(); return; }
    if(fallback?.isConnected) return;
    fallback=document.createElement('div');
    fallback.className='set01-missing-fallback';
    fallback.dataset.gcbSet01Missing='1';
    fallback.textContent='SET01 ORIGINAL PHOTO / 本地攝影組未載入｜原圖位置保留；不仿畫，不以替代圖補洞。';
    article.append(document.createTextNode('\n\n'),fallback);
  }

  const observer=new MutationObserver(()=>{
    if(hasPhoto()) clearFallback();
  });
  observer.observe(article,{childList:true,subtree:true});

  /* original-figures.js 需要先拼合 8 段本地 base64 sprite；給它充足時間，不搶先宣告缺件。 */
  setTimeout(ensureFallback,10000);
  setTimeout(()=>observer.disconnect(),25000);
})();
