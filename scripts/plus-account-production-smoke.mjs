#!/usr/bin/env node
// Read-only production probe. No registration, password submission, checkout or charges.
import assert from 'node:assert/strict';
const origin=(process.env.KINDELORA_ORIGIN||'https://kindelora.pages.dev').replace(/\/$/,'');
const results=[];
async function check(path,verify){
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);
 try{const r=await fetch(origin+path,{redirect:'follow',signal:controller.signal,headers:{'accept':'text/html,application/json'}});const body=await r.text();assert.equal(new URL(r.url).origin,new URL(origin).origin,'unexpected cross-origin redirect');verify(r,body);results.push({path,status:r.status,pass:true});}
 catch(e){results.push({path,pass:false,error:String(e.message||e)});}finally{clearTimeout(timer);}
}
await check('/plus-account.html',(r,s)=>{assert.equal(r.status,200);for(const v of ['id="login"','id="register"','$8.99 USD','$89.99 USD','Public registration coming soon','Payment processing is currently disabled until the final verification checks pass.','href="/plus-checkout.html"'])assert.ok(s.includes(v),'missing '+v)});
await check('/plus-account.js',(r,s)=>{assert.equal(r.status,200);for(const v of ['/api/member/login','/api/member/entitlement'])assert.ok(s.includes(v),'missing '+v)});
await check('/api/plus/status',(r,s)=>{assert.equal(r.status,200);const j=JSON.parse(s);assert.equal(j.checkoutAvailable,false);assert.equal(j.membershipVerificationAvailable,false)});
await check('/api/plus/checkout',(r,s)=>{assert.ok([403,503].includes(r.status),'checkout GET must be denied');assert.doesNotMatch(s,/payment_url|checkout_url|payfast\.co\.za\/eng\/process/i)});
await check('/api/member/me',(r,s)=>{assert.ok([401,403,503].includes(r.status),'guest must not be authenticated');assert.doesNotMatch(s,/"authenticated"\s*:\s*true/)});
await check('/api/member/entitlement',(r,s)=>{assert.ok([401,403,503].includes(r.status),'guest must not have PLUS access');assert.doesNotMatch(s,/"plus"\s*:\s*true/)});
for(const x of results)console.log(JSON.stringify(x));
if(results.some(x=>!x.pass))process.exitCode=1;
