#!/usr/bin/env node
// Read-only production smoke. Do not log secrets or trigger payments.
const base='https://kindelora.pages.dev';
const checks=[
 {path:'/',status:200,checkoutDisabled:true},
 {path:'/motivational-monday.html',status:200,bodyMustInclude:'currently withheld',bodyMustNotInclude:['The Difference You May Never See','heygen-speech-2.mp3']},
 {path:'/api/plus/status',status:200,bodyMustInclude:'"checkoutAvailable":false',bodyMustNotInclude:['"checkoutAvailable":true'],readinessContract:true},
 {path:'/assets/audio/heygen-speech-2.mp3',status:403},
 {path:'/api/plus/weekly',status:403},
 {path:'/plus/archive',status:403},
 {path:'/premium/downloads/reflection.pdf',status:403},
 {path:'/members/favourites',status:403},
 {path:'/assets/plus/private.mp3',status:403},
 {path:'/assets/premium/private.json',status:403},
 {path:'/api/premium/content',status:403},
 {path:'/api/members/profile',status:403},
 {path:'/members/favourites?view=all',status:403},
 {path:'/plus/archive?week=latest',status:403},
 {path:'/api/plus/weekly',status:403,headers:{'Cookie':'kindelora_plus=true; plan=plus; subscription=active'}},
 {path:'/members/favourites',status:403,headers:{'Authorization':'Bearer forged-test-token','X-User-Role':'plus'}},
 {path:'/plus/archive',status:403,headers:{'X-Membership-Status':'active','X-Subscription-Tier':'paid'}}
];
let failures=0;
for(const c of checks){
 try{
  const response=await fetch(base+c.path,{redirect:c.status===200?'follow':'manual',headers:{'Cache-Control':'no-cache',...(c.headers||{})},signal:AbortSignal.timeout(12000)});
  const body=await response.text();
  if(c.status===200&&new URL(response.url).origin!==new URL(base).origin)throw Error('Public preview redirected off origin');
  const errors=[];
  if(response.status!==c.status)errors.push('expected HTTP '+c.status+', got '+response.status);
  if(c.bodyMustInclude&&!body.includes(c.bodyMustInclude))errors.push('expected public preview text absent');
  for(const secret of c.bodyMustNotInclude||[])if(body.includes(secret))errors.push('premium content marker leaked');
  if(c.checkoutDisabled){
   const button=body.match(/<button\b[^>]*\bid=["']plus-checkout-button["'][^>]*>/i);
   if(!button)errors.push('PLUS checkout button missing from live homepage');
   else if(!/\sdisabled(?:\s|>|=)/i.test(button[0]))errors.push('PLUS checkout button enabled in live homepage HTML');
   if(!body.includes('Awaiting PayFast activation'))errors.push('Live homepage lacks pending PayFast activation notice');
  }
  if(c.readinessContract){
   let data;
   try{data=JSON.parse(body)}catch{errors.push('PLUS readiness response is not JSON')}
   if(data){
    if(data.checkoutAvailable!==false||data.membershipVerificationAvailable!==false)errors.push('PLUS readiness is not fail-closed');
    if(data.paymentProvider!=='PayFast'||data.status!=='pending_merchant_verification')errors.push('Unexpected readiness state');
    if(Object.keys(data).sort().join(',')!==['checkoutAvailable','membershipVerificationAvailable','paymentProvider','status'].sort().join(','))errors.push('Readiness exposes unexpected fields');
   }
   if(!response.headers.get('content-type')?.includes('application/json'))errors.push('Readiness missing JSON content type');
   if(!response.headers.get('cache-control')?.includes('no-store'))errors.push('Readiness missing no-store');
   if(response.headers.get('x-content-type-options')!=='nosniff')errors.push('Readiness missing nosniff');
  }
  if(c.status===403&&(!response.headers.get('cache-control')?.includes('no-store')))errors.push('protected response missing no-store');
  if(c.status===403&&body.includes('<!doctype html>'))errors.push('protected route returned HTML');
  if(errors.length)failures++;
  console.log(JSON.stringify({path:c.path,status:response.status,passed:!errors.length,errors}));
 }catch(error){failures++;console.log(JSON.stringify({path:c.path,passed:false,error:String(error)}));}
}
console.log(JSON.stringify({target:base,checks:checks.length,failures,passed:failures===0}));
if(failures)process.exitCode=1;
