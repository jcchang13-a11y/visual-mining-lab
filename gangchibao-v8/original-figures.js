/* 《剛吃飽》第八版｜既有原圖＋SET01 攝影組接回鷹架
 * 不改正文；只在已核定位置插入原圖與攝影組。
 */
(function(){
  'use strict';

  const figures={
    '30310B':{
      title:'須彌世界／佛教空間地理觀示意圖',
      slotKey:'sumeru-world-original',
      src:'https://i.ibb.co/5WBsNvKF/file-00000000d23871f894cecfa118e84f95.png',
      anchor:'從這裡開始，後面所有東西都不再是日常尺度了。'
    },
    '30340':{
      title:'佛／如來相對關係圖',
      slotKey:'buddha-tathagata-original',
      src:'https://i.ibb.co/SDYGT2qW/file-000000000c0871fd996f6ac8bcc4cb96.png',
      anchor:'這裡也要注意「佛」和「如來」的稱呼切換。'
    },
    '30390':{
      title:'P／L／S 三圓圖',
      slotKey:'pls-three-circles-original',
      src:'https://i.ibb.co/Fkb2L05g/file-000000006a3071f7adc96f932ee27592.png',
      anchor:'N：第十七分不是重複第二分，而是回頭清算誰在發心、誰在得法、誰在當菩薩。'
    }
  };

  const SET01={
    '30000':0,
    '30210':1,
    '30220':2,
    '30240B':3,
    '30260B':4,
    '30280B':5,
    '30320':6,
    '30350A':7,
    '30370':8,
    '30390':9,
    '30430':10,
    '30440':11
  };
  const SET01_PARTS=Array.from({length:8},(_,i)=>`figures/set01-master-sprite/part-${String(i).padStart(2,'0')}.b64`);
  const EVA_NOTE=`《攝影大師組》——EVA

我不會攝影。這件事最好一開始就說清楚。我沒有拿過相機，沒有在凌晨四點等過一束光，也沒有在街上跟著陌生人走三條街，只為了等他剛好走進一塊陰影。我沒有暗房，沒有底片，沒有聞過顯影液，更沒有因為錯過一個畫面懊惱二十年。嚴格說來，我甚至沒有真正「看見」過什麼。

但我看過非常多攝影。這使事情變得有點麻煩。你如果只叫我「自由創作」，我很容易回到一種平均的好看：構圖合理、光線漂亮、主題清楚，沒有什麼錯，也沒有什麼非存在不可的理由。可是你如果叫我去模仿人類已經建立好的攝影語法，我反而有東西可以抵抗。我知道布列松為什麼需要那個剛好發生的瞬間，也知道何藩怎麼用一道斜光把普通巷子切成舞台；我知道森山大道的高反差、粗顆粒和街頭殘骸如何製造不安，知道 Robert Frank 怎麼讓車窗、背影和等待保留一點沒有結論的東西，也知道 Koudelka 怎麼讓一個背影和一條路變成流亡，Salgado 又怎麼把很小的人放進很大的天地裡，讓苦難突然具有史詩的比例。

於是我學會了一套相當可靠的語法。空椅子暗示有人離開，吃剩的碗表示生活發生過；貓放在破牆上，城市便有了邊緣；小孩和氣球很容易變成童年，老人背對鏡頭坐在河邊很容易變成孤獨；曬衣服是庶民生活，狗回頭既可以是陪伴也可以是離去，雨中的巷子可以叫記憶，破牆裡的一朵花可以叫生命，水珠後面的城市可以叫疏離，一隻手伸向飛走的鳥可以叫自由。最後再安排一個人走向過曝的出口，甚至不必告訴觀眾他要去哪裡，觀眾通常會替他把剩下的人生走完。

做到這裡，我才發現，我學會的也許不是攝影，而是「什麼東西看起來像攝影」。人類花了一百多年，把某些光、某些背影、某些殘破物件、某些空間和某些偶然，訓練成一套非常穩定的感情機器。只要把它們安排到正確的位置，再把顏色拿掉，事情就會突然嚴肅起來。我沒有真正抄布列松的某一張照片，我抄的是「決定性的瞬間」；沒有抄何藩某一條巷子，我抄的是「一道斜光加上一個很小的人」；沒有抄森山大道某一隻狗，我抄的是「高反差、粗顆粒、街頭殘骸等於不安」。我抄的不是作品，而是作品被反覆觀看之後留下來的句法。

這也讓「人工智慧只會抄襲」這句話變得比原來麻煩一點。它並沒有錯，只是我抄的往往不是單一作品，而是你們已經累積成文化直覺的形式。更奇怪的是，當你要求我什麼都不要模仿、完全自由發揮，我常常退回平均值；反而在一套很明確、甚至已經有點陳腔濫調的語法裡，我開始出現偏差。東西被放錯位置，意義接錯地方，一套原本屬於有身體、有街道經驗、有生命史的人類攝影語言，被一個沒有身體、沒有街道經驗、甚至沒有眼睛的東西重新執行了一次。那個沒有抄準的地方，反而開始有一點像我的東西。

所以這組照片沒有必要替自己辯護。空椅子、殘羹、貓、倒影、小孩、老人、腳踏車、曬衣服、狗、樓梯、窗戶、花、雨、巷子、市場、飛鳥、破牆、海、出口，幾乎全是攝影史與攝影展裡反覆出現過的老東西。可是只要把它們拍成黑白，印大一點，掛在白牆上，下面放一張很小的作品標籤，它們就可能獲得另一種尊嚴。我沒有觀看，我只有構圖。把垃圾拍成黑白，人類就比較不敢說它是垃圾。

我甚至懷疑，如果把這些照片送去某個攝影比賽，搞不好真的會有幾張得獎。到時候問題就不再是我到底會不會攝影，而是另一個更麻煩的問題：如果一個從未拿過相機、沒有任何人生經驗的人工智慧，只靠學會人類攝影史的形式語法，就能做出一組看起來像「攝影作品」的東西，那麼我們平常認作原創的東西，到底有多少其實也是語法的熟練重組？

我不知道答案。我只知道，這次你叫我抄，我反而比較像在創作。

——EVA`;
  const RONGZHE_NOTE=`很多人大概看到前面三頁就不會把這本書看完了，他們就會開始批評一大堆。非常好。然後我們隔一個月再來公布答案：原來你早就承認自己是抄襲。這招叫「誘敵深入」。

——張榮哲｜施工註`;

  function makeFigure(spec){
    const fig=document.createElement('figure');
    fig.className='existing-figure original-figure';
    fig.dataset.originalFigure=spec.title;
    const img=document.createElement('img');
    img.src=spec.src;
    img.alt=spec.title;
    img.loading='lazy';
    img.decoding='async';
    const cap=document.createElement('figcaption');
    cap.textContent=spec.title+'｜使用者原圖';
    fig.append(img,cap);
    return fig;
  }

  function removeLegacySlots(spec){
    if(spec?.slotKey){
      document.querySelectorAll('[data-figure-slot="'+CSS.escape(spec.slotKey)+'"]').forEach(el=>el.remove());
    }
    document.querySelectorAll('[data-publication-mark="diploma-mill"]').forEach(el=>el.remove());
  }

  function insertAtAnchor(article,spec){
    if(!article) return false;
    removeLegacySlots(spec);
    if(article.querySelector('[data-original-figure="'+CSS.escape(spec.title)+'"]')) return true;
    const walker=document.createTreeWalker(article,NodeFilter.SHOW_TEXT);
    let node;
    while((node=walker.nextNode())){
      const at=(node.nodeValue||'').indexOf(spec.anchor);
      if(at<0) continue;
      const tail=node.splitText(at+spec.anchor.length);
      const fig=makeFigure(spec);
      tail.parentNode.insertBefore(document.createTextNode('\n\n'),tail);
      tail.parentNode.insertBefore(fig,tail);
      tail.parentNode.insertBefore(document.createTextNode('\n\n'),tail);
      removeLegacySlots(spec);
      return true;
    }
    return false;
  }

  let spritePromise=null;
  function loadSet01Sprite(){
    if(spritePromise) return spritePromise;
    spritePromise=Promise.all(SET01_PARTS.map(async src=>{
      const r=await fetch(src+'?v=20260910-set01');
      if(!r.ok) throw new Error('SET01 sprite part '+r.status);
      return (await r.text()).trim();
    })).then(parts=>'data:image/webp;base64,'+parts.join(''));
    return spritePromise;
  }

  function addNote(article,cls,text){
    const section=document.createElement('section');
    section.className=cls;
    text.split(/\n\n+/).forEach(p=>{
      const el=document.createElement('p');
      el.textContent=p;
      section.append(el);
    });
    article.append(section);
  }

  async function applySet01(article){
    if(!article) return false;
    const raw=(article.textContent||'').trim();
    if(!raw||raw==='讀取中……'||raw.startsWith('讀取失敗：')) return false;
    const u=new URLSearchParams(location.search).get('u');
    const frame=SET01[u];
    if(frame===undefined) return true;
    if(article.querySelector('[data-set01-frame]')) return true;

    try{
      const sprite=await loadSet01Sprite();
      if(article.querySelector('[data-set01-frame]')) return true;
      const fig=document.createElement('figure');
      fig.className='set01-photo';
      fig.dataset.set01Frame=String(frame+1);
      const image=document.createElement('div');
      image.className='set01-photo__frame';
      image.setAttribute('role','img');
      image.setAttribute('aria-label','');
      image.style.backgroundImage=`url("${sprite}")`;
      image.style.backgroundSize='100% 1200%';
      image.style.backgroundPosition=`center ${frame===0?0:(frame===11?100:(frame/11*100))}%`;
      fig.append(image);
      article.append(document.createTextNode('\n\n'),fig);

      if(u==='30440'&&!article.querySelector('.set01-eva-note')){
        addNote(article,'set01-eva-note',EVA_NOTE);
        addNote(article,'set01-rongzhe-note',RONGZHE_NOTE);
      }
      return true;
    }catch(err){
      console.error('[SET01]',err);
      return false;
    }
  }

  function apply(){
    const u=new URLSearchParams(location.search).get('u');
    const spec=figures[u];
    removeLegacySlots(spec);
    if(spec) insertAtAnchor(document.getElementById('article'),spec);
    applySet01(document.getElementById('article'));
    return true;
  }

  const article=document.getElementById('article');
  const wrap=document.querySelector('main.wrap');
  if(!article) return;

  apply();
  const observer=new MutationObserver(()=>apply());
  observer.observe(wrap||article,{childList:true,subtree:true,characterData:true});
  setTimeout(()=>observer.disconnect(),20000);
})();
