/* 《剛吃飽》第八版｜爛尾樓版｜30350A 拼接裂縫閱讀鷹架
 * 不清場，只加鷹架：原 Markdown、行內 [[...]]、S/P/L/N/F 與被切開的句子全部保留。
 * 只在 LIVE reader 把已存證的高信心拼接裂縫標出，避免讀者把施工事故誤當成正文故意斷句。
 */
(function(){
  'use strict';
  const unit=new URLSearchParams(location.search).get('u');
  if(unit!=='30350A') return;
  const article=document.getElementById('article');
  if(!article || article.dataset.gcbSplice30350A==='1') return;

  const head='可是第十三分最後，事情忽然變得不太一樣。這一次不是財布施，不是捐錢';
  const tail='，不是捐寶物，不是把房子、土地、金銀珠寶拿出來。這一次經文說的是：';

  function findText(needle){
    const walker=document.createTreeWalker(article,NodeFilter.SHOW_TEXT);
    let node;
    while((node=walker.nextNode())){
      if((node.nodeValue||'').includes(needle)) return node;
    }
    return null;
  }

  function markFragment(node,needle,role){
    if(!node) return null;
    const at=(node.nodeValue||'').indexOf(needle);
    if(at<0) return null;
    const after=node.splitText(at);
    const rest=after.splitText(needle.length);
    const span=document.createElement('span');
    span.className='gcb-splice-fragment gcb-splice-fragment--'+role;
    span.dataset.gcbLayer='fracture';
    span.dataset.gcbSpliceRole=role;
    span.textContent=after.nodeValue;
    after.replaceWith(span);
    return {span,rest};
  }

  function apply(){
    if(article.dataset.gcbSplice30350A==='1') return true;
    const headNode=findText(head);
    const tailNode=findText(tail);
    if(!headNode || !tailNode) return false;

    const a=markFragment(headNode,head,'head');
    const b=markFragment(tailNode,tail,'tail');
    if(!a || !b) return false;

    const marker=document.createElement('aside');
    marker.className='work-note gcb-splice-marker';
    marker.dataset.gcbLayer='L3';
    marker.dataset.gcbSplice='30350A';
    marker.textContent='施工裂縫｜這一句在此被後加的結構塊切開；後半句仍保留在下方原位置，不搬動、不補縫。';
    a.span.parentNode.insertBefore(marker,a.span.nextSibling);

    if(!document.getElementById('gcb-splice-style-30350A')){
      const style=document.createElement('style');
      style.id='gcb-splice-style-30350A';
      style.textContent='\n.gcb-splice-fragment{border-bottom:1px dashed #8b877f;}\n.gcb-splice-fragment--head::after{content:" 〔裂縫→〕";font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:.72em;color:#777;}\n.gcb-splice-fragment--tail::before{content:"〔←接回〕 ";font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:.72em;color:#777;}\n.gcb-splice-marker{margin:.75em 0 1em;}\n@media print{.gcb-splice-fragment{break-inside:avoid}.gcb-splice-marker{break-inside:avoid;page-break-inside:avoid;}}\n';
      document.head.appendChild(style);
    }

    article.dataset.gcbSplice30350A='1';
    return true;
  }

  if(apply()) return;
  const observer=new MutationObserver(()=>{if(apply())observer.disconnect()});
  observer.observe(article,{childList:true,subtree:true,characterData:true});
  setTimeout(()=>observer.disconnect(),15000);
})();
