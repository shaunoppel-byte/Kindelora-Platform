/* KINDELORA: accessible guest affirmation card actions; no membership bypass. */
(function(){
'use strict';
const section=document.getElementById('free-affirmations');
if(!section)return;
const cards=[...section.querySelectorAll('.free-affirmation-card')];
const heading=section.querySelector('#free-affirmations-title');
if(heading)heading.textContent='Affirmation Library';
const intro=section.querySelector('.free-intro');
if(intro)intro.textContent='Find a moment that speaks to you. Read it, listen, download your card or share kindness with someone. These four finished cards are free to explore; more are being prepared.';
const style=document.createElement('style');
style.textContent=`
.free-affirmations .free-affirmation-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}
.free-affirmations .free-affirmation-card{display:flex;flex-direction:column}
.free-affirmations .free-affirmation-card .details{display:flex;flex-direction:column;flex:1}
.free-affirmations .kindelora-card-tools{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:12px}
.free-affirmations .kindelora-card-tools button{font:inherit;font-size:.9rem;font-weight:650;cursor:pointer;min-height:44px;padding:9px;border:1px solid #8e6586;border-radius:12px;background:#fff5eb;color:#39223d}
.free-affirmations .kindelora-card-tools button:focus-visible{outline:3px solid #d79a38;outline-offset:2px}
.free-affirmations .kindelora-card-status{font-size:.83rem;min-height:1.3em;margin:7px 0 0;color:#60445e}
.free-affirmations .free-affirmation-card img.art{aspect-ratio:16/10;object-fit:cover}
@media(max-width:860px){.free-affirmations .free-affirmation-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:560px){.free-affirmations .free-affirmation-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}}
`;
document.head.appendChild(style);
let current=null;
function stop(){if('speechSynthesis' in window)window.speechSynthesis.cancel();if(current){current.button.textContent='▶ Listen';current.button.setAttribute('aria-pressed','false');current=null;}}
cards.forEach((card)=>{
const title=card.querySelector('h3')?.textContent.trim()||'An affirmation';
const quote=card.querySelector('.affirmation-quote')?.textContent.trim().replace(/^[“"]|[”"]$/g,'')||'';
const details=card.querySelector('.details');
if(!details||!quote)return;
const tools=document.createElement('div');tools.className='kindelora-card-tools';
const status=document.createElement('p');status.className='kindelora-card-status';status.setAttribute('role','status');status.setAttribute('aria-live','polite');
const listen=document.createElement('button');listen.type='button';listen.textContent='▶ Listen';listen.setAttribute('aria-label','Listen to '+title);listen.setAttribute('aria-pressed','false');
listen.addEventListener('click',()=>{
 if(current?.button===listen){stop();status.textContent='Audio stopped.';return;}
 stop();
 if(!('speechSynthesis' in window)){status.textContent='Audio is not supported in this browser.';return;}
 const utterance=new SpeechSynthesisUtterance(quote);utterance.lang='en';utterance.rate=.9;
 utterance.onend=()=>{if(current?.button===listen){current=null;listen.textContent='▶ Listen';listen.setAttribute('aria-pressed','false');}};
 utterance.onerror=()=>{if(current?.button===listen){current=null;listen.textContent='▶ Listen';listen.setAttribute('aria-pressed','false');status.textContent='Audio unavailable. Please read the affirmation instead.';}};
 current={button:listen};listen.textContent='■ Stop';listen.setAttribute('aria-pressed','true');status.textContent='Reading aloud using your device voice.';
 window.speechSynthesis.speak(utterance);
});
const share=document.createElement('button');share.type='button';share.textContent='↗ Share';share.setAttribute('aria-label','Share '+title);
share.addEventListener('click',async()=>{
 const message=title+' — '+quote+'\n\nFrom KINDELORA: '+location.origin+location.pathname+'#free-affirmations';
 try{
  if(navigator.share){await navigator.share({title:'KINDELORA — '+title,text:message});status.textContent='Share options opened.';}
  else if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(message);status.textContent='Affirmation copied. Paste it into a message to share.';}
  else{const mail='mailto:?subject='+encodeURIComponent('A little kindness: '+title)+'&body='+encodeURIComponent(message);location.href=mail;status.textContent='Your email app should open.';}
 }catch(err){if(err?.name!=='AbortError')status.textContent='Sharing unavailable. You can copy the affirmation text above.';}
});
tools.append(listen,share);details.append(tools,status);
});
document.addEventListener('visibilitychange',()=>{if(document.hidden)stop()});
window.addEventListener('pagehide',stop);

/* Option 2: calm cream reading surfaces, premium plum/gold accents and focus reading. */
const refined=document.createElement('style');
refined.textContent=`
.free-affirmations{background:linear-gradient(150deg,#1b1030,#3d2048 70%,#513252);color:#fff}
.free-affirmations .free-affirmation-card{background:#fffaf4;color:#291b38;border:1px solid #e9d8c8;box-shadow:0 12px 30px #100b1e55}
.free-affirmations .free-affirmation-card h3{color:#30163b;font-size:clamp(1.25rem,1.6vw,1.55rem);line-height:1.25}
.free-affirmations .free-affirmation-card .affirmation-quote{color:#30263a;font-size:1.15rem;line-height:1.65;max-width:50ch}
.free-affirmations .free-affirmation-card .details{padding:22px;gap:7px}
.free-affirmations .free-affirmation-card .gallery-download{background:#eecb75;color:#27182d;border:1px solid #b48a37;font-weight:700;min-height:44px}
.free-affirmations .kindelora-card-tools button{background:#fff;border-color:#d7c8d5;color:#36233c;font-size:1rem;min-height:48px}
.free-affirmations .kindelora-card-tools button:hover{background:#f6e9f3}
.free-affirmations .free-affirmation-card img.art{aspect-ratio:16/10;object-fit:cover}
.free-affirmations .kindelora-focus-button{width:100%;margin-top:8px;background:#43234c;color:#fff;border:0;border-radius:12px;min-height:46px;font:inherit;font-weight:700;cursor:pointer}
.free-affirmations .kindelora-focus-button:focus-visible,.kindelora-focus-dialog button:focus-visible{outline:3px solid #e2b85b;outline-offset:3px}
.kindelora-focus-dialog{width:min(92vw,700px);max-height:90vh;overflow:auto;padding:0;border:1px solid #e9d8c8;border-radius:20px;background:#fffaf4;color:#2a1c35;box-shadow:0 25px 90px #0008}
.kindelora-focus-dialog::backdrop{background:#150b23cc}
.kindelora-focus-dialog img{width:100%;height:clamp(180px,35vh,330px);object-fit:cover}\n.kindelora-focus-dialog .focus-scenic-art{aspect-ratio:16/10;max-height:45vh}\n.kindelora-focus-dialog .focus-scenic-art img.art{height:100%;width:100%;object-fit:cover}\n.kindelora-focus-dialog .focus-scenic-art .kindelora-scenic-overlay strong{font-size:clamp(1.7rem,5vw,3.2rem)}\n.kindelora-focus-dialog .focus-scenic-art .kindelora-scenic-overlay>span:not(.kindelora-scenic-brand){font-size:clamp(.85rem,2.5vw,1.15rem)}
.kindelora-focus-dialog .focus-inner{padding:clamp(20px,4vw,38px)}
.kindelora-focus-dialog h2{font-family:Georgia,serif;font-size:clamp(1.6rem,3vw,2.3rem);margin:0 0 18px;color:#32183b}
.kindelora-focus-dialog .focus-quote{font-size:clamp(1.25rem,2.5vw,1.6rem);line-height:1.7}
.kindelora-focus-dialog .focus-inner{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:start;column-gap:12px;row-gap:14px}
.kindelora-focus-dialog .focus-inner h2{grid-column:1;min-width:0;overflow-wrap:anywhere;margin:0}
.kindelora-focus-dialog .focus-close{grid-column:2;grid-row:1;border:1px solid #806080;border-radius:9px;background:#fff;padding:10px 15px;font:inherit;cursor:pointer;white-space:nowrap}
.kindelora-focus-dialog .focus-quote{grid-column:1/-1;margin:0}
@media(max-width:420px){.kindelora-focus-dialog .focus-inner{grid-template-columns:1fr}.kindelora-focus-dialog .focus-close{grid-column:1;grid-row:1;justify-self:end}.kindelora-focus-dialog .focus-inner h2{grid-row:2}}
@media(prefers-reduced-motion:reduce){.free-affirmations *{scroll-behavior:auto!important;animation:none!important}}
`;
document.head.appendChild(refined);
const dialog=document.createElement('dialog');
dialog.className='kindelora-focus-dialog';dialog.setAttribute('aria-label','Affirmation focus view');
document.body.appendChild(dialog);
cards.forEach(card=>{
 const details=card.querySelector('.details'),title=card.querySelector('h3')?.textContent.trim(),quote=card.querySelector('.affirmation-quote')?.textContent.trim(),img=card.querySelector('img.art');
 if(!details||!title||!quote)return;
 const button=document.createElement('button');button.type='button';button.className='kindelora-focus-button';button.textContent='Read in focus view';
 button.addEventListener('click',()=>{
  stop();dialog.replaceChildren();
  if(img){const scenic=card.querySelector('.kindelora-scenic-art');if(scenic){const visual=scenic.cloneNode(true);visual.classList.add('focus-scenic-art');dialog.appendChild(visual);}else{const photo=document.createElement('img');photo.src=img.src;photo.alt=img.alt||'';dialog.appendChild(photo);}}
  const inner=document.createElement('div');inner.className='focus-inner';
  const close=document.createElement('button');close.type='button';close.className='focus-close';close.textContent='Close';close.addEventListener('click',()=>dialog.close());
  const h=document.createElement('h2');h.textContent=title;
  const p=document.createElement('p');p.className='focus-quote';p.textContent=quote;
  inner.append(h,close,p);dialog.appendChild(inner);
  if(typeof dialog.showModal==='function'){dialog.showModal();close.focus();}else{dialog.setAttribute('open','');close.focus();}
 });
 details.appendChild(button);
});
dialog.addEventListener('close',stop);

})();