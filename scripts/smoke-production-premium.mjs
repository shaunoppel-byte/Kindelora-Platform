#!/usr/bin/env node
// Read-only production smoke. Do not log secrets or trigger payments.
const base='https://kindelora.pages.dev';
const checks=[
 {path:'/motivational-monday.html',status:200,bodyMustInclude:'currently withheld',bodyMustNotInclude:['The Difference You May Never See','heygen-speech-2.mp3']},
 {path:'/assets/audio/heygen-speech-2.mp3',status:403},
 {path:'/api/plus/weekly',status:403},
 {path:'/plus/archive',status:403},
 {path:'/premium/downloads/reflection.pdf',status:403},
 {path:'/members/favourites',status:403},
 {path:'/assets/plus/private.mp3',status:403}
];
let failures=0;
for(const c of checks){
 try{
  const response=await fetch(base+c.path,{redirect:c.status===200?'follow':'manual',headers:{'Cache-Control':'no-cache'},signal:AbortSignal.timeout(12000)});
  const body=await response.text();
  if(c.status===200&&new URL(response.url).origin!==new URL(base).origin)throw Error('Public preview redirected off origin');
  const errors=[];
  if(response.status!==c.status)errors.push('expected HTTP '+c.status+', got '+response.status);
  if(c.bodyMustInclude&&!body.includes(c.bodyMustInclude))errors.push('expected public preview text absent');
  for(const secret of c.bodyMustNotInclude||[])if(body.includes(secret))errors.push('premium content marker leaked');
  if(c.status===403&&(!response.headers.get('cache-control')?.includes('no-store')))errors.push('protected response missing no-store');
  if(c.status===403&&body.includes('<!doctype html>'))errors.push('protected route returned HTML');
  if(errors.length)failures++;
  console.log(JSON.stringify({path:c.path,status:response.status,passed:!errors.length,errors}));
 }catch(error){failures++;console.log(JSON.stringify({path:c.path,passed:false,error:String(error)}));}
}
console.log(JSON.stringify({target:base,checks:checks.length,failures,passed:failures===0}));
if(failures)process.exitCode=1;
