import assert from 'node:assert/strict';
import {onRequestGet} from '../functions/api/member/recovery-readiness.js';
const env={MEMBER_PASSWORD_RECOVERY_ENABLED:'true',MEMBER_AUTH_ENABLED:'true',MEMBER_AUTH_PEPPER:'synthetic-pepper-for-tests-only-32-characters',RESEND_API_KEY:'re_synthetic',REGISTRATION_FROM_EMAIL:'KINDELORA <noreply@example.org>',DB:{prepare:(sql)=>({sql}),batch:async(stmts)=>{assert.equal(stmts.length,2);assert.ok(stmts.every(stmt=>stmt.sql.includes('LIMIT 0')));}}};
const check=async e=>{const response=await onRequestGet({env:e});assert.equal(response.status,200);assert.equal(response.headers.get('cache-control'),'no-store');const data=await response.json();assert.deepEqual(Object.keys(data).sort(),['available','stage']);return data;};
assert.deepEqual(await check({...env,MEMBER_PASSWORD_RECOVERY_ENABLED:'false'}),{available:false,stage:'disabled'});
assert.deepEqual(await check({...env,RESEND_API_KEY:undefined}),{available:false,stage:'configuration'});
assert.deepEqual(await check({...env,DB:{batch:async()=>{throw Error('synthetic db failure')}}}),{available:false,stage:'schema'});
const enabled=await check(env);assert.equal(enabled.available,true);assert.equal(enabled.stage,'ready');
console.log('PASS: recovery readiness safely identifies disabled/configuration/schema/ready');
