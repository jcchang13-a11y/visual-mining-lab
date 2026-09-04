/* 《剛吃飽》第八版｜爛尾樓版｜共用回溯圖 renderer
   不負責解經，只把已確認的回溯圖接成穩定閱讀層。
   Marker:
   [[RETRO: figures/retro-30450-29-first.svg | 第二十九分回看第一分]]

   另兼任後段「本單元涉及經文」施工切片的最小接線層：
   若正文自身尚未含 [[SUTRA: ...]]，且 construction-sections/{unit}-sutra-entrance.md
   已存在，則只抽出其中既有 SUTRA 區塊接到正文最前方；不改正文、不猜經文範圍。

   既有原圖缺件只在 placement 已被施工檔鎖定時補 slot；不仿畫、不替代原圖。
   出版標誌亦只接既有 publication-mark.md 施工位；原圖未進 GitHub 前只顯示 slot。

   P／L／S／N／F 結構行只做閱讀層辨識：不改字、不重排、不清理工作語。
*/
(function(){
  const MARKER=/^\s*\[\[RETRO:\s*([^|\]]+?)(?:\s*\|\s*([^\]]+?))?\s*\]\]\s*$/i;
  const SUTRA_BLOCK=/\[\[SUTRA(?::\s*([^\]]*?))?\]\]\s*([\s\S]*?)\s*\[\[\/SUTRA\]\]/i;
  const STRUCTURE_LINE=/^\s*(?:PLS|P|L|S|N|F)\s*[：:]/;
  const KNOWN_FIGURE_SLOTS={
    '30310B':{
      key:'sumeru-world-original',
      title:'須彌世界／佛教空間地理觀示意圖',
      note:'使用者原始圖待接回；不仿製、不重畫。',
      anchor:'從這裡開始，後面所有東西都不再是日常尺度了。'
    },
    '30340':{
      key:'buddha-tathagata-original',
      title:'佛／如來相對關係圖',
      note:'使用者原始圖待接回；不仿製、不重畫。',
      anchor:'這裡也要注意「佛」和「如來」的稱呼切換。'
    },
    '30390':{
      key:'pls-three-circles-original',
      title:'P／L／S 三圓圖',
      note:'使用者原始圖待接回；不仿製、不重畫。',
      anchor:'N：第十七分不是重複第二分，而是回頭清算誰在發心、誰在得法、誰在當菩薩。'
    }
  };
  const KNOWN_RETRO_FIGURES={
    '30340':[
      {
        key:'retro-30340-13-5',
        src:'figures/retro-30340.svg',
        caption:'第十三分回收第五分的身相／見如來問題：13 → 5',
        anchor:'可是它不是單純重複。它確實回收第五分，但焦點已經換了。'
      }
    ],
    '30350A':[
      {
        key:'retro-30350A-14-6',
        src:'figures/retro-30350A.svg',
        caption:'第十四分把信心清淨重新接回第六分的一念生淨信：14 → 6',
        anchor:'這裡的「信心清淨」，接的是第六分的「一念生淨信」；所謂淨信，就是能夠對「諸相非相」生信。也因此，第六分說這樣的人得「如是無量福德」，第十四分才說這樣的人「成就第一希有功德」。'
      }
    ],
    '30360':[
      {
        key:'retro-30360-14-10-4-3',
        src:'figures/retro-30360-14-10-4-3.svg',
        caption:'第十四分把無所住、布施與度眾生問題重新叫回來：14 → 10 → 4 → 3',
        anchor:'第十四分現在把這個老問題放進忍辱波羅蜜、身命布施的脈絡裡，重新講一次。'
      }
    ],
    '30370':[
      {
        key:'retro-30370-15-14-13',
        src:'figures/retro-30370.svg',
        caption:'第十五分把福德比較線往前拉回第十四、十三分：15 → 14 → 13',
        anchor:'比較到這裡，才落下那一句：聞此經典，信心不逆，其福勝彼。'
      }
    ],
    '30390':[
      {
        key:'retro-30390-17-2',
        src:'figures/retro-30390-17-2.svg',
        caption:'第十七分重新提出第二分的發心、應住與降伏其心問題：17 → 2',
        anchor:'第十七分一開頭，須菩提把第二分已經問過的問題重新提出來：「世尊，善男子、善女人，發阿耨多羅三藐三菩提心，云何應住？云何降伏其心？」'
      }
    ],
    '30430':[
      {
        key:'retro-30430-19',
        src:'figures/retro-30430-19.svg',
        caption:'第十九分回溯布施與福德線：19 → 15 → 13 → 11 → 8 → 4',
        anchor:'第十九分是在回收前面整條布施與福德的力線。'
      },
      {
        key:'retro-30430-21-faith',
        src:'figures/retro-30430-21-faith.svg',
        caption:'第二十一分把未來眾生的信心問題重新叫回來：21 → 14 → 6',
        anchor:'第六分已經問過，如來滅後後五百歲，有沒有眾生得聞如是言說章句，生實信。第十四分又講信心清淨，則生實相。'
      },
      {
        key:'retro-30430-21-beings',
        src:'figures/retro-30430-21-beings.svg',
        caption:'第二十一分由未來聽法者回溯眾生位置線：21 → 17 → 3',
        anchor:'第三分已經說，實無眾生得滅度者。第十七分又說，若菩薩作是言「我當滅度無量眾生」，即不名菩薩。'
      }
    ],
    '30440':[
      {
        key:'retro-30440-25',
        src:'figures/retro-30440-25.svg',
        caption:'第二十五分回溯度眾生／如來任務主體線：25 → 21 → 17 → 3',
        anchor:'第二十五分不是單純重複第三分。'
      }
    ],
    '30450':[
      {
        key:'retro-30450-29-1',
        src:'figures/retro-30450-29-1.svg',
        caption:'第二十九分從如來的來去坐臥回看第一分飯後現場：29 → 1',
        anchor:'第二十九分很短，可是它一出現，整部經就忽然轉身回看第一分。'
      },
      {
        key:'retro-30450-31-four-views',
        src:'figures/retro-30450-31-four-views.svg',
        caption:'第三十一分由四見回看第二十五、十七、十四、六、三分的四相施工線：31 → 25 → 17 → 14 → 6 → 3',
        anchor:'我相、人相、眾生相、壽者相，前面講太多次了。第三分講過，第六分講過，第十四分講過，第十七分講過，第二十五分又講過。'
      },
      {
        key:'retro-30450-32-merit',
        src:'figures/retro-30450-32-merit.svg',
        caption:'第三十二分把全經福德比較線再叫回來：32 → 24 → 19 → 16 → 15 → 11 → 8',
        anchor:'它從第八分、第十一分、第十五分、第十六分、第十九分、第二十四分一路回來，到最後第三十二分還在。'
      }
    ]
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

  function ensureKnownRetroFigures(root){
    if(!root) return 0;
    const unit=new URLSearchParams(location.search).get('u');
    const specs=KNOWN_RETRO_FIGURES[unit]||[];
    let count=0;

    specs.forEach(spec=>{
      if(root.querySelector(`[data-retro-key="${spec.key}"]`)) return;
      const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
      while(walker.nextNode()){
        const node=walker.currentNode;
        const value=node.nodeValue||'';
        const at=value.indexOf(spec.anchor);
        if(at<0) continue;

        const end=at+spec.anchor.length;
        const tail=node.splitText(end);
        const figure=makeRetroFigure(spec.src,spec.caption);
        figure.dataset.retroKey=spec.key;
        tail.parentNode.insertBefore(figure,tail);
        tail.parentNode.insertBefore(document.createTextNode('\n'),tail);
        count++;
        break;
      }
    });
    return count;
  }

  function renderStructureLines(root){
    if(!root) return 0;
    let active=false;
    let count=0;
    const children=Array.from(root.childNodes);

    children.forEach(node=>{
      if(node.nodeType===Node.ELEMENT_NODE){
        if(active && node.classList && node.classList.contains('gcb-formula')){
          node.classList.add('structure-code');
          node.dataset.gcbLayer='structure-code';
        }
        return;
      }
      if(node.nodeType!==Node.TEXT_NODE) return;

      const value=node.nodeValue||'';
      if(!value) return;
      const parts=value.split(/(\r?\n)/);
      const frag=document.createDocumentFragment();

      parts.forEach(part=>{
        if(/^\r?\n$/.test(part)){
          frag.append(document.createTextNode(part));
          active=false;
          return;
        }
        if(!part) return;
        if(!active && STRUCTURE_LINE.test(part)){
          active=true;
          count++;
        }
        if(active){
          const span=document.createElement('span');
          span.className='structure-code';
          span.dataset.gcbLayer='structure-code';
          span.textContent=part;
          frag.append(span);
        }else{
          frag.append(document.createTextNode(part));
        }
      });
      node.replaceWith(frag);
    });
    return count;
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
    renderStructureLines(root);
    ensureSutraEntrance(root);
    ensureKnownFigureSlot(root);
    ensureKnownRetroFigures(root);
    ensurePublicationMark();
    let scheduled=false;
    const observer=new MutationObserver(()=>{
      renderMarkers(root);
      renderStructureLines(root);
      ensureKnownFigureSlot(root);
      ensureKnownRetroFigures(root);
      if(!scheduled){
        scheduled=true;
        queueMicrotask(()=>{
          scheduled=false;
          ensureSutraEntrance(root);
          ensureKnownFigureSlot(root);
          ensureKnownRetroFigures(root);
          renderStructureLines(root);
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
    ensureKnownRetroFigures,
    renderStructureLines,
    ensureSutraEntrance,
    ensurePublicationMark,
    observe
  };
})();