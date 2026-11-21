import assert from 'node:assert/strict';
import {onRequestGet} from '../functions/api/plus/sandbox-order-status.js';
import {hash} from '../functions/api/member/_auth.js';
const pepper='x'.repeat(40),token='a'.repeat(64),tokenHash=await hash(token+pepper);
const base='https://kindelora.pages.dev/api/plus/sandbox-order-status';
const req=reference=>new Request(base+'?reference='+encodeURIComponent(reference),{headers:{cookie:'kindelora_session='+token}});
let lookupCount=0,ownOrder=true;
const db={prepare(sql){
 return {bind(...args){return {async first(){
  if(sql.includes('FROM member_sessions')){assert.equal(args[0],tokenHash);return {id:'member_12345678',email_verified_at:'2026-11-20T00:00:00Z'}}
  if(sql.includes('FROM payfast_sandbox_orders')){lookupCount++;assert.deepEqual(args,['order_12345678','member_12345678']);return ownOrder?{status:'paid',plan:'monthly'}:null}
  throw Error('unexpected query');
 }}}};
}};
const env={MEMBER_AUTH_ENABLED:'true',MEMBER_AUTH_PEPPER:pepper,DB:db};
let r=await onRequestGet({request:req('order_12345678'),env});
assert.equal(r.status,200);assert.deepEqual(await r.json(),{ok:true,environment:'sandbox',status:'paid',plan:'monthly',plusActive:false});
ownOrder=false;r=await onRequestGet({request:req('order_12345678'),env});
assert.equal(r.status,404);assert.equal((await r.json()).plusActive,false);
r=await onRequestGet({request:req('bad'),env});assert.equal(r.status,400);
assert.equal(lookupCount,2);
r=await onRequestGet({request:new Request(base+'?reference=order_12345678'),env});assert.equal(r.status,401);
r=await onRequestGet({request:req('order_12345678'),env:{}});assert.equal(r.status,503);
console.log('PASS: own-order access, cross-member denial, invalid reference, missing session, missing configuration, no PLUS entitlement');
