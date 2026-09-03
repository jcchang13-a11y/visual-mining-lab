/* 《剛吃飽》第八版｜爛尾樓版｜共用回溯圖 renderer
   不負責解經，只把已確認的回溯圖接成穩定閱讀層。
   Marker:
   [[RETRO: figures/retro-30450-29-first.svg | 第二十九分回看第一分]]

   另兼任後段「本單元涉及經文」施工切片的最小接線層：
   若正文自身尚未含 [[SUTRA: ...]]，且 construction-sections/{unit}-sutra-entrance.md
   已存在，則只抽出其中既有 SUTRA 區塊接到正文最前方；不改正文、不猜經文範圍。
*/
(function(){
  const MARKER=/^\s*\[\[RETRO:\s*([^|\]]+?)(?:\s*\|\s*([^\]]+?))?\s*\]\]\s*$/i;
  const SUTRA_BLOCK=/\[\[SUTRA(?::\s*([^\]]*?))?\]\]\s*([\s\S]*?)\s*\[\[\/SUTRA\]\]/i;

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

  function observe(root){
    if(!root) return null;
    renderMarkers(root);
    ensureSutraEntrance(root);
    let scheduled=false;
    const observer=new MutationObserver(()=>{
      renderMarkers(root);
      if(!scheduled){
        scheduled=true;
        queueMicrotask(()=>{
          scheduled=false;
          ensureSutraEntrance(root);
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
    ensureSutraEntrance,
    observe
  };
})();
