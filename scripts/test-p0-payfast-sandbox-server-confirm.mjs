import assert from 'node:assert/strict';
import {confirmSandboxItnWithPayfast as confirm} from '../functions/_lib/payfast-sandbox-server-confirm.js';
const payload='m_payment_id=order_12345678&pf_payment_id=provider_12345678&amount_gross=178.90';
let calls=0;
const mock=(text,status=200)=>async (url,options)=>{
 calls++;assert.equal(url,'https://sandbox.payfast.co.za/eng/query/validate');
 assert.equal(options.method,'POST');assert.equal(options.body,payload);
 assert.equal(options.redirect,'error');
 return {ok:status===200,text:async()=>text};
};
assert.equal(await confirm({parameterString:payload,fetchImpl:mock('VALID')}),true);
for(const value of ['INVALID','VALID\n','valid','','VALID ']){
 assert.equal(await confirm({parameterString:payload,fetchImpl:mock(value)}),false);
}
assert.equal(await confirm({parameterString:payload,fetchImpl:mock('VALID',503)}),false);
assert.equal(await confirm({parameterString:payload,fetchImpl:async()=>{throw Error('network')}}),false);
assert.equal(await confirm({parameterString:payload+'\n',fetchImpl:mock('VALID')}),false);
assert.equal(await confirm({parameterString:'short',fetchImpl:mock('VALID')}),false);
assert.equal(await confirm({parameterString:'x'.repeat(16385),fetchImpl:mock('VALID')}),false);
assert.ok(calls>=7);
console.log('PASS: sandbox server validation accepts only exact VALID from fixed HTTPS PayFast host');
