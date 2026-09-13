/* 《剛吃飽》第八版｜30430 回溯圖 L2 逃生鷹架
 * 不改既有回溯規格；若舊 TreeWalker 因經文重複而把圖插進 SUTRA，只搬出 L2，施工痕跡照留。
 */
(function(){
  'use strict';
  if(new URLSearchParams(location.search).get('u')!=='30430') return;
  const article=document.getElementById('article');
  if(!article) return;

  function escape(){
    let moved=0;
    article.querySelectorAll('.sutra-block .retro-figure').forEach(fig=>{
      const sutra=fig.closest('.sutra-block');
      if(!sutra) return;
      fig.dataset.gcbEscapedFrom='L2-sutra';
      sutra.insertAdjacentElement('afterend',fig);
      moved++;
    });
    return moved;
  }

  escape();
  const observer=new MutationObserver(escape);
  observer.observe(article,{childList:true,subtree:true});
  setTimeout(()=>observer.disconnect(),15000);
})();
