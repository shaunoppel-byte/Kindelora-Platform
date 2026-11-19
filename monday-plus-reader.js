// Website and installed PWA share this same-origin reader. No premium content in static HTML.
(()=>{
 const target=document.getElementById('message-text');
 const status=document.getElementById('status');
 const player=document.getElementById('monday-player');
 const audio=document.getElementById('narration-audio');
 if(!target||!status||!player||!audio)return;
 const edition='mm-2026-11-16'; // Only edition currently documented as founder-approved; release still gated server-side.
 const endpoint='/api/member/monday/'+edition;
 const clear=()=>{target.replaceChildren();audio.pause();audio.removeAttribute('src');audio.load();player.hidden=true;};
 const message=(value)=>{clear();const p=document.createElement('p');p.textContent=value;target.append(p);};
 const fetchPrivate=async(url)=>fetch(url,{credentials:'same-origin',cache:'no-store',headers:{Accept:'application/json'}});
 async function load(){
  try{
   const r=await fetchPrivate(endpoint);
   if(r.status===401){message('Sign in to your verified KINDELORA PLUS account to access the full reflection.');status.textContent='Sign-in required.';return;}
   if(r.status===403){message('This reflection is reserved for active KINDELORA PLUS members. Explore membership to learn more.');status.textContent='PLUS membership required.';return;}
   if(r.status===404){message('This week’s reflection has not been published yet. Please check back soon.');status.textContent='Edition awaiting release.';return;}
   if(!r.ok){message('The reflection is temporarily unavailable. Please try again later.');status.textContent='Secure access unavailable.';return;}
   const data=await r.json();
   const paragraphs=Array.isArray(data?.content?.paragraphs)?data.content.paragraphs:Array.isArray(data?.paragraphs)?data.paragraphs:null;
   if(!paragraphs||!paragraphs.length||!paragraphs.every(p=>typeof p==='string'))throw Error('Invalid edition');
   clear();
   for(const value of paragraphs){const p=document.createElement('p');p.textContent=value;target.append(p);}
   audio.src=endpoint+'?format=audio';
   player.hidden=false;
   status.textContent='Verified PLUS reflection loaded. Audio playback requires secure access.';
  }catch{message('The reflection could not be loaded securely. Please try again later.');status.textContent='Secure access unavailable.';}
 }
 load();
})();
