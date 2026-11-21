import assert from 'node:assert/strict';
import {onRequestGet} from '../functions/api/plus/entitlement.js';
const req=new Request('https://kindelora.pages.dev/api/plus/entitlement',{headers:{cookie:'kindelora_session='+'a'.repeat(64)}});
const env={MEMBER_AUTH_ENABLED:'true',MEMBER_AUTH_PEPPER:'p'.repeat(40),DB:{prepare(sql){
 if(sql.includes('FROM member_sessions'))return {bind(){return {async first(){return {id:'member_12345678'}}}}};
 if(sql.includes('FROM plus_subscriptions'))return {bind(subject){assert.equal(subject,'member_12345678');return {async first(){return {entitled:1}}}}};
 throw Error('unexpected query');
}}};
let r=await onRequestGet({request:req,env});assert.equal(r.status,200);assert.equal((await r.json()).entitled,true);
r=await onRequestGet({request:new Request(req.url),env});assert.equal(r.status,401);assert.equal((await r.json()).entitled,false);
r=await onRequestGet({request:req,env:{...env,MEMBER_AUTH_ENABLED:'false'}});assert.equal(r.status,503);
const bad={...env,DB:{prepare(sql){if(sql.includes('FROM member_sessions'))return env.DB.prepare(sql);throw Error('D1 unavailable')}}};
r=await onRequestGet({request:req,env:bad});assert.equal(r.status,503);assert.equal((await r.json()).entitled,false);
console.log('PASS: read-only PLUS status uses authenticated session identity, denies anonymous/unavailable');
