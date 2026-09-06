/* 《剛吃飽》第八版｜爛尾樓版｜回溯圖增補層
 * 用途：在不改動既有正文與主 renderer 的前提下，接入後續核定的高信心回溯圖。
 * 原則：只認明確 anchor；找不到就不插，不猜位置。
 */
(function(){
  'use strict';

  const SPECS={
    '30270B':[
      {
        key:'retro-30270B-9-3',
        src:'figures/retro-30270B-9-3.svg',
        caption:'第九分以果位位置回看第三分的菩薩位置：9 → 3',
        anchor:'前面第三分測的是菩薩這個位置：菩薩能不能把發心與度眾生收成「我在做好事」「我在幫助別人」「我在度眾生」？到了第九分，經文換到果位這個位置：須陀洹、斯陀含、阿那含、阿羅漢，這些修行階段能不能被收成「這是我得到的成就」？'
      }
    ],
    '30280B':[
      {
        key:'retro-30280B-10-9',
        src:'figures/retro-30280B-10-9.svg',
        caption:'第十分把第九分的「得／我得」推到如來得法與菩薩莊嚴佛土：10 → 9',
        anchor:'第九分剛剛把「我得」放到果位上檢查。須陀洹、斯陀含、阿那含、阿羅漢，當然都是修果有所成就之輩；可是這個「得」，不能被收成「我得」。到了第十分，這個「得／我得」的區別沒有停下來，而是被推到如來自己的過去：如來昔在然燈佛所，於法有所得不？'
      }
    ],
    '30310B':[
      {
        key:'retro-30310B-11-8',
        src:'figures/retro-30310B-11-8.svg',
        caption:'第十一分把第八分的福德比較公式放大重演：11 → 8',
        anchor:'這裡其實是第八分福德比較公式的升級版。第八分已經比過一次：有人以三千大千世界七寶布施，福德很多；但若有人於此經中，受持乃至四句偈等，為他人說，其福勝彼。到了第十一分，公式沒有變，數量升級了。第八分是一個三千大千世界七寶布施；第十一分變成恆河沙數三千大千世界七寶布施。'
      }
    ],
    '30340':[
      {
        key:'retro-30340-13-5',
        src:'figures/retro-30340-13-5.svg',
        caption:'第十三分以三十二相問題回收第五分的身相見如來問題：13 → 5',
        anchor:'可是它不是單純重複。它確實回收第五分，但焦點已經換了。'
      }
    ],
    '30350A':[
      {
        key:'retro-30350A-14-6',
        src:'figures/retro-30350A-14-6.svg',
        caption:'第十四分以「信心清淨」回接第六分的「一念生淨信」：14 → 6',
        anchor:'這裡的「信心清淨」，接的是第六分的「一念生淨信」；所謂淨信，就是能夠對「諸相非相」生信。也因此，第六分說這樣的人得「如是無量福德」，第十四分才說這樣的人「成就第一希有功德」。'
      }
    ],
    '30360':[
      {
        key:'retro-30360-14-10-4-3',
        src:'figures/retro-30360-14-10-4-3.svg',
        caption:'第十四分忍辱／身命布施段落重新叫回第十、第四、第三分：14 → 10 → 4 → 3',
        anchor:'這裡也把前面幾分的問題簡單叫回來。第三分已經講過，菩薩度眾生，不能站在「我在度眾生」的位置上。第四分講過，菩薩布施，不能住色聲香味觸法而布施。第十分講過，應無所住而生其心。這些不是舊話重講。第十四分現在把這個老問題放進忍辱波羅蜜、身命布施的脈絡裡，重新講一次。'
      }
    ],
    '30370':[
      {
        key:'retro-30370-15-14-13',
        src:'figures/retro-30370-15-14-13.svg',
        caption:'第十五分把身布施／受持此經的比較線回收第十四、第十三分：15 → 14 → 13',
        anchor:'第十三分尾巴先把兩邊並列起來：一邊是恆河沙等身命布施，一邊是於此經中受持四句偈等、為人說；但那裡只說「其福甚多」，還沒有真正判勝負。到第十四分，此經這邊接到第一波羅蜜即非第一波羅蜜；到第十五分，身布施這邊接到忍辱波羅蜜非忍辱波羅蜜，又被恆河沙等身、一天三時、無量百千萬億劫撐開。比較到這裡，才落下那一句：聞此經典，信心不逆，其福勝彼。'
      }
    ],
    '30380':[
      {
        key:'retro-30380-16-15',
        src:'figures/retro-30380-16-15.svg',
        caption:'第十六分把第十五分「其福勝彼」的功德比較線拉進更長的因果時間重新計算：16 → 15',
        anchor:'第十五分剛說「其福勝彼」，第十六分馬上把時間線拉長。'
      }
    ],
    '30390':[
      {
        key:'retro-30390-17-2',
        src:'figures/retro-30390-17-2.svg',
        caption:'第十七分重新提出第二分的發心、應住與降伏其心問題：17 → 2',
        anchor:'第十七分一開頭，須菩提把第二分已經問過的問題重新提出來：「世尊，善男子、善女人，發阿耨多羅三藐三菩提心，云何應住？云何降伏其心？」這一次，佛回答時有點不一樣：「善男子、善女人，發阿耨多羅三藐三菩提心者，當生如是心。」'
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
        key:'retro-30430-19-15-13-11-8-4',
        src:'figures/retro-30430-19-15-13-11-8-4.svg',
        caption:'第十九分回收前面整條布施與福德力線：19 → 15 → 13 → 11 → 8 → 4',
        anchor:'第十九分是在回收前面整條布施與福德的力線。'
      }
    ],
    '30440':[
      {
        key:'retro-30440-25-21-17-3',
        src:'figures/retro-30440-25-21-17-3.svg',
        caption:'第二十五分把「我當度眾生」回接第二十一、第十七與第三分的主體位置問題：25 → 21 → 17 → 3',
        anchor:'這句要跟第二十一分一起看。第二十一分說：'
      }
    ]
  };

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

  function insert(root,spec){
    if(!root||root.querySelector('[data-retro-key="'+spec.key+'"]')) return true;
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
    let node;
    while((node=walker.nextNode())){
      const at=(node.nodeValue||'').indexOf(spec.anchor);
      if(at<0) continue;
      const tail=node.splitText(at+spec.anchor.length);
      tail.parentNode.insertBefore(document.createTextNode('\n'),tail);
      tail.parentNode.insertBefore(makeFigure(spec),tail);
      tail.parentNode.insertBefore(document.createTextNode('\n'),tail);
      return true;
    }
    return false;
  }

  function apply(){
    const unit=new URLSearchParams(location.search).get('u');
    const specs=SPECS[unit]||[];
    const article=document.getElementById('article');
    if(!article||!specs.length) return !specs.length;
    return specs.every(spec=>insert(article,spec));
  }

  const article=document.getElementById('article');
  if(!article) return;
  if(apply()) return;
  const observer=new MutationObserver(()=>{if(apply())observer.disconnect()});
  observer.observe(article,{childList:true,subtree:true,characterData:true});
  setTimeout(()=>observer.disconnect(),15000);
})();