/* 《剛吃飽》第八版｜爛尾樓版｜30350A 第十四分福德比較史回溯
 * 不清場，只加鷹架：正文自己明說前面已多次把巨大布施與「受持四句偈、為人說」放在一起比較。
 * 這裡只把其中可明確定位的第八分與第十一分逐一接回；第十三分已有獨立 14 → 13 圖，不重複。
 */
(function(){
  'use strict';
  const unit=new URLSearchParams(location.search).get('u');
  if(unit!=='30350A') return;
  const article=document.getElementById('article');
  if(!article) return;

  const specs=[
    {
      key:'retro-30350A-14-8-merit',
      src:'figures/retro-30350A-14-8.svg',
      caption:'第十四分回看第八分：三千大千世界七寶布施與受持四句偈、為人說的比較線再次被叫回：14 → 8',
      anchor:'每一次經文都把布施推得很大，再把「受持四句偈、為人說」放進來比較。'
    },
    {
      key:'retro-30350A-14-11-merit',
      src:'figures/retro-30350A-14-11.svg',
      caption:'第十四分回看第十一分：恆河沙數世界七寶布施與受持四句偈、為人說的比較線再次被叫回：14 → 11',
      anchor:'每一次經文都把布施推得很大，再把「受持四句偈、為人說」放進來比較。'
    }
  ];

  function already(spec){
    if(article.querySelector('[data-retro-key="'+spec.key+'"]')) return true;
    return Array.from(article.querySelectorAll('.retro-figure__img')).some(img=>{
      const raw=img.getAttribute('src')||'';
      return raw===spec.src || raw.endsWith('/'+spec.src);
    });
  }

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

  function place(spec){
    if(already(spec)) return true;
    const walker=document.createTreeWalker(article,NodeFilter.SHOW_TEXT);
    let node;
    while((node=walker.nextNode())){
      if(node.parentElement?.closest('.sutra-block')) continue;
      const at=(node.nodeValue||'').indexOf(spec.anchor);
      if(at<0) continue;
      let insertion=node.parentNode;
      if(insertion && insertion.nodeType===Node.ELEMENT_NODE && insertion.classList?.contains('retro-figure')) continue;
      const tail=node.splitText(at+spec.anchor.length);
      tail.parentNode.insertBefore(document.createTextNode('\n'),tail);
      tail.parentNode.insertBefore(makeFigure(spec),tail);
      tail.parentNode.insertBefore(document.createTextNode('\n'),tail);
      return true;
    }
    return false;
  }

  function applyAll(){
    let complete=true;
    specs.forEach(spec=>{if(!place(spec)) complete=false;});
    return complete;
  }

  if(applyAll()) return;
  const observer=new MutationObserver(()=>{if(applyAll()) observer.disconnect()});
  observer.observe(article,{childList:true,subtree:true,characterData:true});
  setTimeout(()=>observer.disconnect(),15000);
})();
