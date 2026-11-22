(()=>{'use strict';
const W=1080,H=1350,brand='KINDELORA',message=['You matter.','You are appreciated.','Someone is thinking','of you today.'];
function createCanvas(){const c=document.createElement('canvas');c.width=W;c.height=H;return c}
function rounded(ctx,x,y,w,h,r){ctx.beginPath();ctx.roundRect(x,y,w,h,r)}
function render(){const c=createCanvas(),g=c.getContext('2d');if(!g)throw Error('Canvas unavailable');
let bg=g.createLinearGradient(0,0,W,H);bg.addColorStop(0,'#1e1030');bg.addColorStop(.46,'#56365f');bg.addColorStop(.8,'#9b627d');bg.addColorStop(1,'#28192f');g.fillStyle=bg;g.fillRect(0,0,W,H);
const glow=g.createRadialGradient(855,345,12,855,345,600);glow.addColorStop(0,'rgba(255,220,153,.67)');glow.addColorStop(.35,'rgba(246,165,127,.22)');glow.addColorStop(1,'rgba(255,190,130,0)');g.fillStyle=glow;g.fillRect(0,0,W,H);
for(let i=0;i<85;i++){const x=(i*397+83)%W,y=(i*211+37)%H,r=1+(i%4)*.8;g.beginPath();g.arc(x,y,r,0,Math.PI*2);g.fillStyle='rgba(255,230,186,'+(.12+(i%5)*.075)+')';g.fill()}
g.strokeStyle='#e8c58d';g.lineWidth=3;rounded(g,48,48,W-96,H-96,44);g.stroke();
g.textAlign='center';g.fillStyle='#f9dfad';g.font='62px Georgia, serif';g.fillText('✦',W/2,169);g.font='bold 59px Georgia, serif';g.fillText(brand,W/2,253);
g.font='24px sans-serif';g.letterSpacing='5px';g.fillText('KINDNESS  ·  ENCOURAGEMENT  ·  POSITIVITY',W/2,310);g.letterSpacing='0px';
g.strokeStyle='rgba(246,213,163,.7)';g.lineWidth=2;g.beginPath();g.moveTo(160,366);g.lineTo(920,366);g.stroke();
g.fillStyle='#ffdfaa';g.font='italic 57px Georgia, serif';g.fillText('Just a little reminder…',W/2,474);
g.fillStyle='#fff7ed';g.font='60px Georgia, serif';message.forEach((line,i)=>g.fillText(line,W/2,595+i*87));
g.fillStyle='#f4d7a0';g.font='57px Georgia, serif';g.fillText('♡',W/2,969);
g.fillStyle='#fff5e8';g.font='italic 37px Georgia, serif';g.fillText('A little kindness can make',W/2,1052);g.fillText('a beautiful difference.',W/2,1104);
g.strokeStyle='rgba(246,213,163,.7)';g.beginPath();g.moveTo(250,1150);g.lineTo(830,1150);g.stroke();
g.fillStyle='#f6d69d';g.font='bold 31px Georgia, serif';g.fillText('KINDELORA',W/2,1201);
g.font='25px Georgia, serif';g.fillText('Kindness is at the heart of everything.',W/2,1240);
return c}
const PREMIUM_ASSET='/assets/file_00000000bbe8820eb12d4d9ba94ae770.png';
const CURATED_ASSETS=Object.freeze({strength:'/assets/kindelora-strength-card.png',gratitude:'/assets/kindelora-gratitude-card.png'});
async function file(){try{const response=await fetch(PREMIUM_ASSET,{cache:'no-store'});if(!response.ok)throw Error('Premium artwork unavailable');const blob=await response.blob();if(!blob.type.startsWith('image/')||!blob.size)throw Error('Invalid artwork');return new File([blob],'KINDELORA-premium-kindness-card.png',{type:blob.type||'image/png'});}catch{return new Promise((resolve,reject)=>{render().toBlob(b=>b?resolve(new File([b],'KINDELORA-a-little-kindness.png',{type:'image/png'})):reject(Error('Image creation failed')),'image/png')})}}
function download(f){const u=URL.createObjectURL(f),a=document.createElement('a');a.href=u;a.download=f.name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),2500)}
async function share(choice='signature'){const f=choice==='signature'?await file():await generated(choice);if(typeof navigator.share==='function'&&typeof navigator.canShare==='function'&&navigator.canShare({files:[f]})){try{await navigator.share({files:[f],title:'A little kindness from KINDELORA',text:captions[choice]+' https://kindelora.pages.dev/'});return 'shared'}catch(e){if(e?.name==='AbortError')return 'cancelled';}}
download(f);return 'downloaded'}
const captions=Object.freeze({signature:'Thinking of you today. ♡',strength:'A gentle reminder: you are stronger than you know. ♡',gratitude:'Your presence makes a difference. Thank you for being you. ♡'});
async function generated(choice){try{const response=await fetch(CURATED_ASSETS[choice],{cache:'no-store'});if(response.ok){const blob=await response.blob();if(blob.type.startsWith('image/')&&blob.size>10000)return new File([blob],'KINDELORA-'+choice+'-premium-card.png',{type:blob.type});}}catch{}return fallbackCard(choice)}
async function fallbackCard(choice){const canvas=createCanvas(),g=canvas.getContext('2d');if(!g)throw Error('Canvas unavailable');const bg=g.createLinearGradient(0,0,W,H);bg.addColorStop(0,'#24132f');bg.addColorStop(.6,'#633d64');bg.addColorStop(1,'#bb826b');g.fillStyle=bg;g.fillRect(0,0,W,H);const glow=g.createRadialGradient(790,930,30,790,930,720);glow.addColorStop(0,'rgba(255,211,133,.65)');glow.addColorStop(1,'rgba(255,211,133,0)');g.fillStyle=glow;g.fillRect(0,0,W,H);g.strokeStyle='#f1d49b';g.lineWidth=4;rounded(g,45,45,W-90,H-90,42);g.stroke();g.textAlign='center';g.fillStyle='#f5d99f';g.font='54px Georgia,serif';g.fillText('✦',540,177);g.font='bold 57px Georgia,serif';g.fillText('KINDELORA',540,258);g.font='26px Georgia,serif';g.fillText('KINDNESS  ·  ENCOURAGEMENT  ·  POSITIVITY',540,319);g.strokeStyle='rgba(246,213,163,.7)';g.beginPath();g.moveTo(170,367);g.lineTo(910,367);g.stroke();const strength=choice==='strength';g.font='italic 72px Georgia,serif';g.fillText(strength?'One step at a time':'Thank you',540,514);g.fillStyle='#fff7ed';g.font='58px Georgia,serif';const lines=strength?['You are stronger','than you know.','Just take the next step.']:['Your kindness has','made a difference.','You are appreciated.'];lines.forEach((line,i)=>g.fillText(line,540,673+i*108));g.fillStyle='#f5d99f';g.font='65px Georgia,serif';g.fillText('♡',540,1065);g.font='italic 34px Georgia,serif';g.fillText('A little kindness can make a beautiful difference.',540,1150);g.font='27px Georgia,serif';g.fillText('Kindness is at the heart of everything.',540,1245);const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw Error('Image creation failed');return new File([blob],'KINDELORA-'+choice+'-card.png',{type:'image/png'});}

window.KindeloraKindnessCard=Object.freeze({share,download:async()=>download(await file()),captions});
})();