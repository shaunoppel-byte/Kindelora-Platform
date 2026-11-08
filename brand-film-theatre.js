/* KINDELORA brand film: no autoplay, no external tracking, no broken play button. */
(()=>{'use strict';
const section=document.getElementById('brand-film');if(!section)return;
const play=section.querySelector('[data-film-play]'),status=section.querySelector('[data-film-status]'),dialog=section.querySelector('[data-film-dialog]'),video=section.querySelector('video'),close=section.querySelector('[data-film-close]');
const source='/kindelora-brand-film.mp4';
function setStatus(message){status.textContent=message;}
function showReady(){play.hidden=false;play.disabled=false;play.setAttribute('aria-label','Play the KINDELORA brand film');setStatus('Press play to experience our story. Sound is always your choice.');}
function showPending(){play.hidden=true;setStatus('Our signature brand film will premiere here soon. Discover the story behind KINDELORA below.');}
async function checkFilm(){try{const response=await fetch(source,{method:'HEAD',cache:'no-store'});if(response.ok&&/video\//i.test(response.headers.get('content-type')||'')){showReady();return;}}catch(e){}showPending();}
play.addEventListener('click',()=>{if(!dialog||!video)return;video.src=source;video.load();if(typeof dialog.showModal==='function'){dialog.showModal();}else{dialog.setAttribute('open','');}video.play().catch(()=>{setStatus('Press play in the video player to begin.');});});
function closeFilm(){video.pause();video.removeAttribute('src');video.load();if(dialog.open&&typeof dialog.close==='function')dialog.close();else dialog.removeAttribute('open');play.focus();}
close.addEventListener('click',closeFilm);dialog.addEventListener('cancel',e=>{e.preventDefault();closeFilm();});dialog.addEventListener('click',e=>{if(e.target===dialog)closeFilm();});video.addEventListener('error',()=>{setStatus('The film is temporarily unavailable. Please try again later.');});
checkFilm();
})();