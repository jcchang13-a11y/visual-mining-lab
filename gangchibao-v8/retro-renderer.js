/* 《剛吃飽》第八版｜爛尾樓版｜共用回溯圖 renderer
   不負責解經，只把已確認的回溯圖接成穩定閱讀層。
   Marker:
   [[RETRO: figures/retro-30450-29-first.svg | 第二十九分回看第一分]]

   另兼任後段「本單元涉及經文」施工切片的最小接線層：
   若正文自身尚未含 [[SUTRA: ...]]，且 construction-sections/{unit}-sutra-entrance.md
   已存在，則只抽出其中既有 SUTRA 區塊接到正文最前方；不改正文、不猜經文範圍。

   既有原圖缺件只在 placement 已被施工檔鎖定時補 slot；不仿畫、不替代原圖。
   出版標誌亦只接既有 publication-mark.md 施工位；原圖未進 GitHub 前只顯示 slot。
*/
(function(){
  const MARKER=/^\s*\[\[RETRO:\s*([^|\]]+?)(?:\s*\|\s*([^\]]+?))?\s*\]\]\s*$/i;
  const SUTRA_BLOCK=/\[\[SUTRA(?::\s*([^\]]*?))?\]\]\s*([\s\S]*?)\s*\[\[\/SUTRA\]\]/i;
  const KNOWN_FIGURE_SLOTS={
    '30310B':{
      key:'sumeru-world-original',
      title:'須彌世界／佛教空間地理觀示意圖',
      note:'使用者原始圖待接回；不仿製、不重畫。',
      anchor:'從這裡開始，後面所有東西都不再是日常尺度了。'
    }
  };

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

  function parseSutraScaffold(text){
    const m=SUTRA_BLOCK.exec(text||'');
    return m?{label:(m[1]||'本單元涉及經文').trim(),body:m[2].trim()}:null;
  }

  function makeSutraBlock(scaffold){
    const section=document.createElement('section');
    section.className='sutra-block';
    section.dataset.gcbLayer='sutra-entrance';

    const label=document.createElement('span');
    label.className='sutra-label';
    label.textContent=scaffold.label||'本單元涉及經文';
    section.append(label,document.createTextNode('\n'+scaffold.body+'\n'));
    return section;
  }

  function makeFigureSlot(spec){
    const slot=document.createElement('div');
    slot.className='figure-slot';
    slot.dataset.gcbLayer='existing-figure-slot';
    slot.dataset.figureSlot=spec.key;

    const title=document.createElement('div');
    title.className='figure-slot-title';
    title.textContent=spec.title;

    const note=document.createElement('div');
    note.className='figure-slot-note';
    note.textContent=spec.note;
    slot.append(title,note);
    return slot;
  }

  function ensureKnownFigureSlot(root){
    if(!root) return false;
    const unit=new URLSearchParams(location.search).get('u');
    const spec=KNOWN_FIGURE_SLOTS[unit];
    if(!spec||root.querySelector(`[data-figure-slot="${spec.key}"]`)) return false;

    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
    while(walker.nextNode()){
      const node=walker.currentNode;
      const value=node.nodeValue||'';
      const at=value.indexOf(spec.anchor);
      if(at<0) continue;

      const end=at+spec.anchor.length;
      const tail=node.splitText(end);
      const slot=makeFigureSlot(spec);
      tail.parentNode.insertBefore(slot,tail);
      tail.parentNode.insertBefore(document.createTextNode('\n'),tail);
      return true;
    }
    return false;
  }

  let sutraLoading=false;
  let sutraCheckedFor='';
  async function ensureSutraEntrance(root){
    if(!root||root.querySelector('.sutra-block')) return false;
    const raw=(root.textContent||'').trim();
    if(!raw||raw==='讀取中……'||raw.startsWith('讀取失敗：')) return false;

    const unit=new URLSearchParams(location.search).get('u');
    if(!unit||sutraLoading||sutraCheckedFor===unit) return false;
    sutraLoading=true;
    sutraCheckedFor=unit;
    try{
      const r=await fetch(`construction-sections/${encodeURIComponent(unit)}-sutra-entrance.md?v=20260904-sutra-wire`);
      if(!r.ok) return false;
      const scaffold=parseSutraScaffold(await r.text());
      if(!scaffold||root.querySelector('.sutra-block')) return false;
      root.prepend(makeSutraBlock(scaffold),document.createTextNode('\n'));
      return true;
    }catch(_){
      return false;
    }finally{
      sutraLoading=false;
    }
  }

  let publicationLoading=false;
  let publicationChecked=false;
  async function ensurePublicationMark(){
    if(publicationChecked||publicationLoading) return false;
    const wrap=document.querySelector('main.wrap');
    if(!wrap||wrap.querySelector('[data-publication-mark]')) return false;
    publicationLoading=true;
    publicationChecked=true;
    try{
      const r=await fetch('publication-mark.md?v=20260904-publication-wire');
      if(!r.ok) return false;
      const text=await r.text();
      if(!text.includes('DIPLOMA／文憑工廠／MILL')) return false;

      const section=document.createElement('section');
      section.className='figure-slot';
      section.dataset.publicationMark='diploma-mill';
      section.dataset.gcbLayer='publication-mark-slot';

      const title=document.createElement('div');
      title.className='figure-slot-title';
      title.textContent='文憑工廠（Diploma Mill）出版標誌';

      const note=document.createElement('div');
      note.className='figure-slot-note';
      note.textContent='DIPLOMA／文憑工廠／MILL 圓形印章原圖待接回；不重畫、不清稿，保留原始粗糙印刷感。';
      section.append(title,note);

      const footer=wrap.querySelector('.footer');
      if(footer) footer.insertAdjacentElement('afterend',section);
      else wrap.append(section);
      return true;
    }catch(_){
      return false;
    }finally{
      publicationLoading=false;
    }
  }

  function observe(root){
    if(!root) return null;
    renderMarkers(root);
    ensureSutraEntrance(root);
    ensureKnownFigureSlot(root);
    ensurePublicationMark();
    let scheduled=false;
    const observer=new MutationObserver(()=>{
      renderMarkers(root);
      ensureKnownFigureSlot(root);
      if(!scheduled){
        scheduled=true;
        queueMicrotask(()=>{
          scheduled=false;
          ensureSutraEntrance(root);
          ensureKnownFigureSlot(root);
          ensurePublicationMark();
        });
      }
    });
    observer.observe(root,{subtree:true,childList:true,characterData:true});
    return observer;
  }

  window.GCBRetro={
    makeRetroFigure,
    parseRetroMarker,
    renderMarkers,
    parseSutraScaffold,
    makeSutraBlock,
    makeFigureSlot,
    ensureKnownFigureSlot,
    ensureSutraEntrance,
    ensurePublicationMark,
    observe
  };
})();
