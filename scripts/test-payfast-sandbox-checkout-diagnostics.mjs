import assert from 'node:assert/strict';
import {onRequestPost} from '../functions/api/plus/sandbox-checkout.js';
import {hash} from '../functions/api/member/_auth.js';
const url='https://kindelora.pages.dev/api/plus/sandbox-checkout';
const token='a'.repeat(64);
const pepper='p'.repeat(40);
const tokenHash=await hash(token+pepper);
const request=new Request(url,{method:'POST',headers:{origin:'https://kindelora.pages.dev','content-type':'application/json',cookie:'kindelora_session='+token},body:JSON.stringify({plan:'monthly'})});
let response=await onRequestPost({request,env:{}});
assert.equal(response.status,503);
assert.equal((await response.json()).reason,'sandbox_checkout_disabled');
const db={prepare(sql){assert.match(sql,/member_sessions/);return {bind(value){assert.equal(value,tokenHash);return {first:async()=>({id:'member_12345678'})}}}}};
const env={DB:db,MEMBER_AUTH_ENABLED:'true',MEMBER_AUTH_PEPPER:pepper,PAYFAST_SANDBOX_CHECKOUT_ENABLED:'true'};
response=await onRequestPost({request,env});
assert.equal(response.status,503);
assert.equal((await response.json()).reason,'fx_configuration_missing');
console.log('PASS: missing auth config and missing trusted FX source return distinct safe failure codes');

// Verify fixed internal codes while preserving the generic public response.
const originalWarn=console.warn;
const logs=[];
try {
 console.warn=(...args)=>logs.push(args);
 for(const [overrides,expected] of [
  [{PAYFAST_SANDBOX_CHECKOUT_ENABLED:undefined},['sandbox_opt_in_missing']],
  [{PAYFAST_SANDBOX_CHECKOUT_ENABLED:'false'},['sandbox_opt_in_missing']],
  [{MEMBER_AUTH_ENABLED:'false'},['member_auth_not_ready']],
  [{DB:undefined},['member_auth_not_ready']],
  [{MEMBER_AUTH_PEPPER:'short'},['member_auth_not_ready']],
  [{DB:undefined,PAYFAST_SANDBOX_CHECKOUT_ENABLED:undefined},['member_auth_not_ready','sandbox_opt_in_missing']]
 ]){
  logs.length=0;
  const result=await onRequestPost({request,env:{...env,...overrides}});
  assert.equal(result.status,503);
  assert.deepEqual(await result.json(),{ok:false,reason:'sandbox_checkout_disabled',checkoutReady:false});
  assert.deepEqual(logs,expected.map(code=>['sandbox_checkout_preflight '+code]));
 }
} finally {console.warn=originalWarn;}
console.log('PASS: fixed internal readiness diagnostics preserve public fail-closed contract');
