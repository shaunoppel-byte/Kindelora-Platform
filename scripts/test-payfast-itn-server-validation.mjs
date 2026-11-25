import assert from 'node:assert/strict';
import {canonicalPayFastItnBody as canonical,verifyPayFastItnWithServer as verify} from '../functions/_lib/payfast-itn-server-validation.js';
const raw='m_payment_id=order_12345678&item_name=Hello+World%21&amount_gross=170.00&signature='+('a'.repeat(32));
assert.equal(canonical(raw),'m_payment_id=order_12345678&item_name=Hello+World%21&amount_gross=170.00');
assert.equal(canonical('m_payment_id=a&m_payment_id=b&signature=x'),null);
assert.equal(canonical('m_payment_id=a'),null);
let calls=0;
let result=await verify({raw,environment:'sandbox',fetchImpl:async(url,options)=>{
 calls++;assert.equal(url,'https://sandbox.payfast.co.za/eng/query/validate');assert.equal(options.method,'POST');
 assert.equal(options.redirect,'manual');assert.ok(!options.body.includes('signature'));return {status:200,ok:true,text:async()=> 'VALID'};
}});
assert.equal(result.verified,true);assert.equal(calls,1);
for(const reply of ['INVALID','VALID\\n','valid','']){
 result=await verify({raw,environment:'sandbox',fetchImpl:async()=>({status:200,ok:true,text:async()=>reply})});assert.equal(result.verified,false);
}
result=await verify({raw,environment:'sandbox',fetchImpl:async()=>({type:'opaqueredirect',status:0,ok:false})});assert.equal(result.verified,false);
result=await verify({raw,environment:'sandbox',fetchImpl:async()=>({type:'basic',status:302,ok:false})});assert.equal(result.verified,false);
result=await verify({raw,environment:'live',fetchImpl:async(url)=>{assert.equal(url,'https://www.payfast.co.za/eng/query/validate');return {status:403,ok:false}}});assert.equal(result.verified,false);
result=await verify({raw,environment:'bogus',fetchImpl:async()=>{throw Error('must not call')}});assert.equal(result.verified,false);
result=await verify({raw,environment:'sandbox',fetchImpl:async()=>{throw Error('network')}});assert.equal(result.verified,false);
for(const response of [{status:302,ok:false,type:'basic'},{status:403,ok:false},{status:500,ok:false},{status:200,ok:true,type:'opaqueredirect'},{status:200,ok:false}]){
 result=await verify({raw,environment:'sandbox',fetchImpl:async()=>({...response,text:async()=> 'VALID'})});
 assert.deepEqual(result,{verified:false,reason:'provider_rejected'});
}
console.log('PASS: PayFast server ITN confirmation uses fixed HTTPS endpoints and exact VALID response');
