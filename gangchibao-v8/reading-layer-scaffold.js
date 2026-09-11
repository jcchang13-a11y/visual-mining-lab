/* 《剛吃飽》第八版｜爛尾樓版｜閱讀地層自動鷹架
 * 不改單元 Markdown；只在 reader DOM 中標記高信心的施工語與結構代碼。
 * 經文、正文、公式沿用既有 renderer；這裡只補 L2／L3／L4 的可逆辨識層。
 */
(function(){
  'use strict';

  const article=document.getElementById('article');
  if(!article) return;

  const structureLine=/^\s*(?:PLS|P|L|S|N|F)\s*[：:]/;
  const bracketStructureLine=/^\s*\[\[(?!\/?(?:SUTRA|WORK|FIGURE)\b)[^\]\n]+\]\]\s*$/i;
  const sectionLabelLine=/^\s*［(?:正文|註釋|經文)］\s*$/;
  /* 早期單元還沒統一成［經文］／［正文］，直接裸寫「經文」「經文範圍」「正文」「公式」等。
     第一分還保留一塊更早的裸寫「書後補註」；後來同類內容才長成 [[書後補註｜…]]。
     再後來又出現「幹話區｜拆到最小，就比較真嗎？」這種「舊標牌＋小標題」混合寫法。
     這些舊標牌不改字，只補回閱讀層；它們本身就是施工史。 */
  const legacySectionLabelLine=/^\s*(?:經文(?:範圍)?|正文|公式|幹話區|短註|書後補註)(?:\s*[｜|：:]\s*.+)?\s*$/;
  const legacyDividerLine=/^\s*---\s*$/;
  const pageCounterLine=/^\s*\d+\/\d+\s*$/;
  const workLine=/^\s*(?:施工註記|工作註記|暫記|待查|未決|停工|死路)\s*[：:]/;
  /* 只抓明確的排版／製作指令；一般【章名】與經文標題不碰。經文區本來也在 excluded 內。 */
  const productionDirectiveLine=/^\s*【(?=[^】]*(?:換頁|字體|排版|版面|插圖|待接|圖位|圖檔|印刷|列印|跨頁|留白))[^】]+】\s*$/;
  const excluded='.sutra-block,.gcb-formula,.structure-code,.work-note,.figure-slot,figure,figcaption,script,style';

  function classify(line){
    if(structureLine.test(line)||bracketStructureLine.test(line)||sectionLabelLine.test(line)||legacySectionLabelLine.test(line)||legacyDividerLine.test(line)||pageCounterLine.test(line)) return {cls:'structure-code structure-line',layer:'L4'};
    if(workLine.test(line)||productionDirectiveLine.test(line)) return {cls:'work-note work-note-line',layer:'L3'};
    return null;
  }

  function markTextNode(node){
    if(!node?.nodeValue || node.parentElement?.closest(excluded)) return false;
    const value=node.nodeValue;
    if(!/[：:\[\]［］\/【】\-｜|]|經文|正文|公式|幹話|短註|書後補註/.test(value)) return false;
    const lines=value.split('\n');
    if(!lines.some(line=>classify(line))) return false;

    const frag=document.createDocumentFragment();
    lines.forEach((line,index)=>{
      const mark=classify(line);
      if(mark){
        const span=document.createElement('span');
        span.className=mark.cls;
        span.dataset.gcbLayer=mark.layer;
        span.textContent=line;
        frag.append(span);
      }else{
        frag.append(document.createTextNode(line));
      }
      if(index<lines.length-1) frag.append(document.createTextNode('\n'));
    });
    node.replaceWith(frag);
    return true;
  }

  /* 單元 Markdown 大量使用「［經文］→［正文］／［註釋］」而不是 [[SUTRA]]。
     以前只有「［經文］」標籤被辨識成 L4，真正經文仍落在 L1。
     這裡只在 DOM 把兩個標籤之間的既有內容包成 L2；不改原檔、不重排字句。 */
  function bindChineseSutraRanges(){
    const labels=Array.from(article.querySelectorAll('.structure-line')).filter(el=>
      el.textContent.trim()==='［經文］' && el.dataset.gcbSutraBound!=='1'
    );

    labels.forEach(label=>{
      label.dataset.gcbSutraBound='1';
      let cursor=label.nextSibling;
      while(cursor && cursor.nodeType===Node.TEXT_NODE && !(cursor.nodeValue||'').trim()) cursor=cursor.nextSibling;
      if(cursor?.nodeType===Node.ELEMENT_NODE && cursor.classList.contains('sutra-block')) return;

      const section=document.createElement('section');
      section.className='sutra-block sutra-range';
      section.dataset.gcbLayer='L2';
      cursor=label.nextSibling;
      while(cursor){
        const next=cursor.nextSibling;
        const boundary=cursor.nodeType===Node.ELEMENT_NODE && cursor.classList.contains('structure-line') && /^［(?:正文|註釋|經文)］$/.test(cursor.textContent.trim());
        if(boundary) break;
        section.append(cursor);
        cursor=next;
      }
      if((section.textContent||'').trim()) label.parentNode.insertBefore(section,cursor);
    });
  }

  /* 更早一批單元使用裸標題：
       經文／經文範圍
       ……經文……
       ---
       正文
     也有「幹話區｜……」「短註｜……」這種後來長出小標題的混合標牌。
     這些內容此前全落在 L1。現在只把「經文」標牌之後、第一個 --- 或下一個舊段落標牌之前包成 L2。
     「書後補註」也算舊段落標牌，只作邊界與 L4 標記，不把補註內容改寫成別層。
     不改舊標題、不替它們統一格式，也不碰已有 [[SUTRA]] 的單元。 */
  function bindLegacySutraRanges(){
    const labels=Array.from(article.querySelectorAll('.structure-line')).filter(el=>
      /^(?:經文|經文範圍)(?:\s*[｜|：:]\s*.+)?$/.test(el.textContent.trim()) && el.dataset.gcbLegacySutraBound!=='1'
    );

    labels.forEach(label=>{
      label.dataset.gcbLegacySutraBound='1';
      let cursor=label.nextSibling;
      while(cursor && cursor.nodeType===Node.TEXT_NODE && !(cursor.nodeValue||'').trim()) cursor=cursor.nextSibling;
      if(cursor?.nodeType===Node.ELEMENT_NODE && cursor.classList.contains('sutra-block')) return;

      const section=document.createElement('section');
      section.className='sutra-block sutra-range legacy-sutra-range';
      section.dataset.gcbLayer='L2';
      section.dataset.gcbLegacy='1';
      cursor=label.nextSibling;
      while(cursor){
        const next=cursor.nextSibling;
        const text=cursor.nodeType===Node.ELEMENT_NODE ? cursor.textContent.trim() : '';
        const boundary=cursor.nodeType===Node.ELEMENT_NODE && cursor.classList.contains('structure-line') && (text==='---' || /^(?:正文|公式|幹話區|短註|書後補註|經文|經文範圍)(?:\s*[｜|：:]\s*.+)?$/.test(text));
        if(boundary) break;
        section.append(cursor);
        cursor=next;
      }
      if((section.textContent||'').trim()) label.parentNode.insertBefore(section,cursor);
    });
  }

  function apply(){
    const walker=document.createTreeWalker(article,NodeFilter.SHOW_TEXT);
    const nodes=[];
    let node;
    while((node=walker.nextNode())) nodes.push(node);
    nodes.forEach(markTextNode);
    bindChineseSutraRanges();
    bindLegacySutraRanges();
  }

  apply();
  const observer=new MutationObserver(()=>apply());
  observer.observe(article,{childList:true,subtree:true,characterData:true});
  setTimeout(()=>observer.disconnect(),15000);
})();

/* 施工接線：30440 的結構性回扣另掛可逆鷹架，不改正文，也不塞回既有 direct/complete 檔。
   LIVE reader 後來已把同一檔納入 supplementMap；保留這條舊接線，但若頁面上已有同檔 script，就不再重複通電。 */
(function(){
  'use strict';
  const unit=new URLSearchParams(location.search).get('u');
  if(unit!=='30440') return;
  if(document.querySelector('script[data-gcb-retro-30440-structural],script[src*="retro-supplement-30440-structural.js"]')) return;
  const script=document.createElement('script');
  script.src='retro-supplement-30440-structural.js?v=20260911-1';
  script.dataset.gcbRetro30440Structural='1';
  document.head.appendChild(script);
})();
