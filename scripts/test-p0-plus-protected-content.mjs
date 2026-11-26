import assert from 'node:assert/strict';
import {onRequestGet} from '../functions/api/plus/content/motivational-monday.js';
const request=new Request('https://example.test/api/plus/content/motivational-monday',{headers:{cookie:'kindelora_session='+ 'a'.repeat(64)}});
let reads=0;
const env=(user,entitled)=>({PLUS_PROTECTED_CONTENT_ENABLED:'true',MEMBER_AUTH_ENABLED:'true',MEMBER_AUTH_PEPPER:'x'.repeat(32),DB:{prepare(sql){return {bind(...args){return {async first(){if(sql.includes('member_sessions'))return user;if(sql.includes('plus_subscriptions')){assert.equal(args[0],user.id);return {entitled}}throw Error('unexpected query')}}}}}},ASSETS:{async fetch(req){reads++;assert.equal(new URL(req.url).pathname,'/content/motivational-monday-2026-11-16-approved.json');return Response.json({test:'premium'})}}});
const user={id:'verified-member'};
for(const [name,e,status] of [['disabled',{...env(user,1),PLUS_PROTECTED_CONTENT_ENABLED:'false'},503],['guest',env(null,0),401],['unpaid or expired',env(user,0),403],['paid',env(user,1),200],['missing assets',{...env(user,1),ASSETS:undefined},503]]){
 const before=reads;const response=await onRequestGet({request,env:e});assert.equal(response.status,status,name);if(status===200){assert.equal((await response.json()).test,'premium');assert.match(response.headers.get('cache-control'),/no-store/);assert.equal(response.headers.get('vary'),'Cookie')}else assert.equal(reads,before,name);console.log('PASS',name);
}
