/* 30450｜第二十九分註釋中的明確回讀位置；不改正文、不重畫既有 SVG。 */
(function(){
'use strict';
if(new URLSearchParams(location.search).get('u')!=='30450')return;
const specs=[
 {key:'retro-30450-29-1-note-repeat',src:'figures/retro-30450-29-first.svg',caption:'第二十九分在註釋再次明說「必須回讀第一分」的位置重現回溯：29 → 1',anchor:'第二十九分必須回讀第一分。第一分的「入舍衛大城乞食」「還至本處」「飯食訖」「洗足已」「敷座而坐」正是來、去、坐的具體場景。第二十九分不是否定這些事件，而是防止讀者以事件、路線、姿勢定位如來。'},
 {key:'retro-30450-29-26-note-repeat',src:'figures/retro-30450-29-26.svg',caption:'第二十九分在註釋再次明說回扣第二十六分色／聲辨認的位置重現回溯：29 → 26',anchor:'此分也可回扣第二十六分「若以色見我，以音聲求我」。第二十六分拆色與聲，第二十九分拆行動與位置。色、聲、來、去、坐、臥，都是凡夫辨認一個人的方式；如來不能被這些方式封住。'}
];
function make(s){const f=document.createElement('figure');f.className='retro-figure';f.dataset.gcbLayer='retrospective';f.dataset.retroKey=s.key;f.dataset.gcbRepeatReason='same-relation-new-reading-position';const i=document.createElement('img');i.className='retro-figure__img';i.src=s.src;i.alt=s.caption;i.loading='lazy';i.decoding='async';const c=document.createElement('figcaption');c.className='retro-figure__caption';c.textContent=s.caption;f.append(i,c);return f;}
function insert(root,s){if(root.querySelector('[data-retro-key="'+s.key+'"]'))return true;const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let n;while((n=w.nextNode())){if(n.parentElement?.closest('.sutra-block'))continue;const at=(n.nodeValue||'').indexOf(s.anchor);if(at<0)continue;const tail=n.splitText(at+s.anchor.length);tail.parentNode.insertBefore(document.createTextNode('\n'),tail);tail.parentNode.insertBefore(make(s),tail);tail.parentNode.insertBefore(document.createTextNode('\n'),tail);return true;}return false;}
function apply(){const root=document.getElementById('article');return !!root&&specs.map(s=>insert(root,s)).every(Boolean);}
const article=document.getElementById('article');if(!article)return;if(apply())return;const o=new MutationObserver(()=>{if(apply())o.disconnect()});o.observe(article,{childList:true,subtree:true,characterData:true});setTimeout(()=>o.disconnect(),15000);
})();
