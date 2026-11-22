import assert from 'node:assert/strict';
import {onRequestGet,onRequestPost} from '../functions/api/plus/subscription.js';
import {onRequest} from '../functions/_middleware.js';
const url='https://kindelora.pages.dev/api/plus/subscription';
const req=new Request(url,{headers:{cookie:'kindelora_session='+'a'.repeat(64)}});
const env={MEMBER_AUTH_ENABLED:'true',MEMBER_AUTH_PEPPER:'p'.repeat(40),DB:{prepare(sql){
 if(sql.includes('FROM member_sessions'))return {bind(){return {async first(){return {id:'member_12345678'}}}}};
 if(sql.includes('FROM plus_subscriptions'))return {bind(){return {async first(){return {entitled:1}}}}};
 throw Error('unexpected query');
}}};
let r=await onRequestGet({request:new Request(url),env});assert.equal(r.status,401);
r=await onRequestGet({request:req,env});assert.equal(r.status,200);assert.equal((await r.json()).active,true);
r=await onRequestPost();assert.equal(r.status,503);
r=await onRequest({request:req,next:async()=>new Response('routed')});assert.equal(r.status,200);
r=await onRequest({request:new Request(url,{method:'POST'}),next:async()=>new Response('bypassed')});assert.equal(r.status,403);
console.log('PASS: PLUS subscription GET is authenticated and POST stays denied');
