/* 《剛吃飽》第八版｜爛尾樓版｜共用回溯圖 renderer
 * 不負責解經，只把已確認的回溯圖接成穩定閱讀層。
 * Marker: [[RETRO: figures/retro-30450-29-first.svg | 第二十九分回看第一分]]
 *
 * 另兼任兩個既有閱讀鷹架：
 * 1. 後段單元若正文尚無 SUTRA 區塊，只從 construction-sections/{unit}-sutra-entrance.md
 *    抽取已核定經文入口接到最前面；不改正文、不猜範圍。
 * 2. P／L／S／N／F 結構行只做閱讀層辨識；不改字、不重排、不清工作語。
 *
 * 三張使用者原圖與文憑工廠出版標誌已另由 original-figures.js／index.html 接回。
 * 本 renderer 不再生成「待接回原圖」或出版標誌 slot，避免已找回材料又被顯示成缺件。
 */
(function(){
  'use strict';

  const MARKER=/^\s*\[\[RETRO:\s*([^|\]]+?)(?:\s*\|\s*([^\]]+?))?\s*\]\]\s*$/i;
  const SUTRA_BLOCK=/\[\[SUTRA(?::\s*([^\]]*?))?\]\]\s*([\s\S]*?)\s*\[\[\/SUTRA\]\]/i;
  const STRUCTURE_LINE=/^\s*(?:PLS|P|L|S|N|F)\s*[：:]/;

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
    '30410A':[
      {
        key:'retro-30410A-space',
        src:'figures/retro-30410A-space.svg',
        caption:'第十八分把前面逐步放大的佛教空間尺度全部叫回來：18 → 13 → 12 → 11 → 8',
        anchor:'到了第十八分，這些線全部接上：五眼一開，空間直接穿到「諸恆河所有沙數佛世界」。'
      },
      {
        key:'retro-30410A-time',
        src:'figures/retro-30410A-time.svg',
        caption:'第十八分把前面被拉長、折回與推遠的時間線全部叫回來：18 → 16 → 15 → 14 → 6 → 1',
        anchor:'到第十八分，老師把這些時間線全部攤開，然後一刀切下去：過去心不可得，現在心不可得，未來心不可得。'
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

  function makeRetroFigure(src,caption){
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
      const parts=value.split(/(\r?\n)/);
      if(!parts.some(part=>parseRetroMarker(part))) return;

      const frag=document.createDocumentFragment();
      parts.forEach(part=>{
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
        if(active&&node.classList&&node.classList.contains('gcb-formula')){
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
        if(!active&&STRUCTURE_LINE.test(part)){
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
      const r=await fetch(`construction-sections/${encodeURIComponent(unit)}-sutra-entrance.md?v=20260906-sutra-wire`);
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

  function observe(root){
    if(!root) return null;
    renderMarkers(root);
    renderStructureLines(root);
    ensureSutraEntrance(root);
    ensureKnownRetroFigures(root);

    let scheduled=false;
    const observer=new MutationObserver(()=>{
      renderMarkers(root);
      renderStructureLines(root);
      ensureKnownRetroFigures(root);
      if(!scheduled){
        scheduled=true;
        queueMicrotask(()=>{
          scheduled=false;
          ensureSutraEntrance(root);
          ensureKnownRetroFigures(root);
          renderStructureLines(root);
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
    ensureKnownRetroFigures,
    renderStructureLines,
    ensureSutraEntrance,
    observe
  };
})();
