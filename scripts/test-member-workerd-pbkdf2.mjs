import test from 'node:test';
import assert from 'node:assert/strict';
import {pbkdf2Sync} from 'node:crypto';
import {Miniflare} from 'miniflare';
// Execute the exact PBKDF2 contract inside a local Cloudflare workerd, not Node's WebCrypto.
// This is an offline runtime compatibility test, NOT a production CPU budget or deployment test.
const password='offline-test-password-only';
const salt='f'.repeat(64);
const expected=pbkdf2Sync(password,Buffer.from(salt,'utf8'),310000,32,'sha256').toString('hex');
const worker=`export default {async fetch(request){
 const {password,salt}=await request.json();
 try{
  const encoder=new TextEncoder();
  const key=await crypto.subtle.importKey('raw',encoder.encode(password),'PBKDF2',false,['deriveBits']);
  const bits=await crypto.subtle.deriveBits({name:'PBKDF2',salt:encoder.encode(salt),iterations:310000,hash:'SHA-256'},key,256);
  return new Response(Array.from(new Uint8Array(bits),b=>b.toString(16).padStart(2,'0')).join(''));
 }catch{return new Response('derivation-failed',{status:503})}
}};`;
test('Cloudflare workerd can derive existing 310k PBKDF2 SHA256 vector',async()=>{
 const mf=new Miniflare({modules:true,script:worker,compatibilityDate:'2026-11-20'});
 try{
  const response=await mf.dispatchFetch('https://offline.invalid/',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({password,salt})});
  assert.equal(response.status,200,'workerd rejected current KDF contract');
  assert.equal(await response.text(),expected);
 }finally{await mf.dispose()}
});
