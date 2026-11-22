(()=>{'use strict';
const W=1080,H=1350,brand='KINDELORA',message=['You matter.','You are appreciated.','Someone is thinking','of you today.'];
function createCanvas(){const c=document.createElement('canvas');c.width=W;c.height=H;return c}
function rounded(ctx,x,y,w,h,r){ctx.beginPath();ctx.roundRect(x,y,w,h,r)}
const themes=Object.freeze({strength:{heading:'One step at a time',lines:['You do not have to','do it all today.','Take the next step.','You are stronger','than you know.'],closing:['Your journey matters.','Keep going.']},gratitude:{heading:'A heartfelt thank you',lines:['Your presence matters.','Your kindness is seen.','Your support means','more than words','can express.'],closing:['The world is brighter','because you are in it.']}});
function render(choice='signature'){const c=createCanvas(),g=c.getContext('2d');if(!g)throw Error('Canvas unavailable');
let bg=g.createLinearGradient(0,0,W,H);bg.addColorStop(0,'#1e1030');bg.addColorStop(.46,'#56365f');bg.addColorStop(.8,'#9b627d');bg.addColorStop(1,'#28192f');g.fillStyle=bg;g.fillRect(0,0,W,H);
const glow=g.createRadialGradient(855,345,12,855,345,600);glow.addColorStop(0,'rgba(255,220,153,.67)');glow.addColorStop(.35,'rgba(246,165,127,.22)');glow.addColorStop(1,'rgba(255,190,130,0)');g.fillStyle=glow;g.fillRect(0,0,W,H);
for(let i=0;i<85;i++){const x=(i*397+83)%W,y=(i*211+37)%H,r=1+(i%4)*.8;g.beginPath();g.arc(x,y,r,0,Math.PI*2);g.fillStyle='rgba(255,230,186,'+(.12+(i%5)*.075)+')';g.fill()}
g.strokeStyle='#e8c58d';g.lineWidth=3;rounded(g,48,48,W-96,H-96,44);g.stroke();
g.textAlign='center';g.fillStyle='#f9dfad';g.font='62px Georgia, serif';g.fillText('✦',W/2,169);g.font='bold 59px Georgia, serif';g.fillText(brand,W/2,253);
g.font='24px sans-serif';g.letterSpacing='5px';g.fillText('KINDNESS  ·  ENCOURAGEMENT  ·  POSITIVITY',W/2,310);g.letterSpacing='0px';
g.strokeStyle='rgba(246,213,163,.7)';g.lineWidth=2;g.beginPath();g.moveTo(160,366);g.lineTo(920,366);g.stroke();
g.fillStyle='#ffdfaa';g.font='italic 57px Georgia, serif';g.fillText(themes[choice]?.heading||'Just a little reminder…',W/2,474);
g.fillStyle='#fff7ed';g.font='60px Georgia, serif';const lines=themes[choice]?.lines||message;g.font=(lines.length>4?'51':'60')+'px Georgia, serif';const lineHeight=lines.length>4?72:87;lines.forEach((line,i)=>g.fillText(line,W/2,575+i*lineHeight));
g.fillStyle='#f4d7a0';g.font='57px Georgia, serif';g.fillText('♡',W/2,969);
g.fillStyle='#fff5e8';g.font='italic 37px Georgia, serif';const closing=themes[choice]?.closing||['A little kindness can make','a beautiful difference.'];g.fillText(closing[0],W/2,1052);g.fillText(closing[1],W/2,1104);
g.strokeStyle='rgba(246,213,163,.7)';g.beginPath();g.moveTo(250,1150);g.lineTo(830,1150);g.stroke();
g.fillStyle='#f6d69d';g.font='bold 31px Georgia, serif';g.fillText('KINDELORA',W/2,1201);
g.font='25px Georgia, serif';g.fillText('Kindness is at the heart of everything.',W/2,1240);
return c}
const PREMIUM_ASSET='/assets/file_00000000bbe8820eb12d4d9ba94ae770.png';
async function file(){try{const response=await fetch(PREMIUM_ASSET,{cache:'no-store'});if(!response.ok)throw Error('Premium artwork unavailable');const blob=await response.blob();if(!blob.type.startsWith('image/')||!blob.size)throw Error('Invalid artwork');return new File([blob],'KINDELORA-premium-kindness-card.png',{type:blob.type||'image/png'});}catch{return new Promise((resolve,reject)=>{render().toBlob(b=>b?resolve(new File([b],'KINDELORA-a-little-kindness.png',{type:'image/png'})):reject(Error('Image creation failed')),'image/png')})}}
function download(f){const u=URL.createObjectURL(f),a=document.createElement('a');a.href=u;a.download=f.name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),2500)}
const prepared=new Map();
function prepare(choice='signature'){if(!['signature','strength','gratitude'].includes(choice))return Promise.reject(Error('Unknown card'));if(!prepared.has(choice)){const task=(choice==='signature'?file():generated(choice)).then(f=>{prepared.set(choice,{file:f});return f}).catch(e=>{prepared.delete(choice);throw e});prepared.set(choice,{task});}const entry=prepared.get(choice);return entry.file?Promise.resolve(entry.file):entry.task;}
function share(choice='signature'){
 const ready=prepared.get(choice);
 if(ready?.file)return send(ready.file,choice);
 return prepare(choice).then(f=>send(f,choice));
}
function send(f,choice){
 if(typeof navigator.share==='function'&&typeof navigator.canShare==='function'&&navigator.canShare({files:[f]})){
  try{return navigator.share({files:[f],title:'A little kindness from KINDELORA',text:(captions[choice]||captions.signature)+' https://kindelora.pages.dev/'}).then(()=> 'shared').catch(e=>e?.name==='AbortError'?'cancelled':(download(f),'downloaded'));}
  catch{download(f);return Promise.resolve('downloaded')}
 }
 download(f);return Promise.resolve('downloaded');
}
const captions=Object.freeze({signature:'Thinking of you today. ♡',strength:'A gentle reminder: you are stronger than you know. ♡',gratitude:'Your presence makes a difference. Thank you for being you. ♡'});
async function preview(choice='signature'){const f=await prepare(choice);return URL.createObjectURL(f)}
async function generated(choice){if(!themes[choice])throw Error('Unknown card');const canvas=render(choice);const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw Error('Image creation failed');return new File([blob],'KINDELORA-'+choice+'-card.png',{type:'image/png'});}

window.KindeloraKindnessCard=Object.freeze({share,preview,prepare,download:async()=>download(await file()),captions});
})();