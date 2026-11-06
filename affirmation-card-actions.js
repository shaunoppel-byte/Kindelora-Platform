/* KINDELORA: accessible guest affirmation card actions; no membership bypass. */
(function(){
'use strict';
const section=document.getElementById('free-affirmations');
if(!section)return;
const cards=[...section.querySelectorAll('.free-affirmation-card')];
const heading=section.querySelector('#free-affirmations-title');
if(heading)heading.textContent='Affirmation Library';
const intro=section.querySelector('.free-intro');
if(intro)intro.textContent='Find a moment that speaks to you. Read it, listen, download your card or share kindness with someone. These three finished cards are free to explore; more are being prepared.';
const style=document.createElement('style');
style.textContent=`
.free-affirmations .free-affirmation-grid{grid-template-columns:repeat(3,minmax(0,1fr));gap:18px}
.free-affirmations .free-affirmation-card{display:flex;flex-direction:column}
.free-affirmations .free-affirmation-card .details{display:flex;flex-direction:column;flex:1}
.free-affirmations .kindelora-card-tools{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:12px}
.free-affirmations .kindelora-card-tools button{font:inherit;font-size:.9rem;font-weight:650;cursor:pointer;min-height:44px;padding:9px;border:1px solid #8e6586;border-radius:12px;background:#fff5eb;color:#39223d}
.free-affirmations .kindelora-card-tools button:focus-visible{outline:3px solid #d79a38;outline-offset:2px}
.free-affirmations .kindelora-card-status{font-size:.83rem;min-height:1.3em;margin:7px 0 0;color:#60445e}
.free-affirmations .free-affirmation-card img.art{aspect-ratio:16/10;object-fit:cover}
@media(max-width:860px){.free-affirmations .free-affirmation-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:560px){.free-affirmations .free-affirmation-grid{grid-template-columns:1fr}}
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
})();