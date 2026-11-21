import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {onRequestGet} from '../functions/api/member/login-readiness.js';
globalThis.crypto ??= webcrypto;
const db={prepare(sql){assert.match(sql,/^SELECT /);assert.match(sql,/ LIMIT 0$/);return {sql}},async batch(q){assert.equal(q.length,3)}};
const env={MEMBER_AUTH_ENABLED:'true',MEMBER_AUTH_PEPPER:'p'.repeat(40),DB:db};
const good=await onRequestGet({env});assert.equal(good.status,200);
assert.deepEqual(await good.json(),{available:true,stage:'ready'});
const missing=await onRequestGet({env:{...env,MEMBER_AUTH_PEPPER:''}});
assert.deepEqual(await missing.json(),{available:false,stage:'configuration'});
const broken=await onRequestGet({env:{...env,DB:{...db,async batch(){throw Error('private database detail')}}}});
assert.deepEqual(await broken.json(),{available:false,stage:'schema'});
const original=globalThis.crypto;
try{
 globalThis.crypto={subtle:{importKey:async()=>{throw Error('private crypto detail')}}};
 const failure=await onRequestGet({env});
 assert.deepEqual(await failure.json(),{available:false,stage:'crypto'});
}finally{globalThis.crypto=original}
console.log('PASS: read-only login preflight stages and no secret/account data exposure (synthetic offline only)');
