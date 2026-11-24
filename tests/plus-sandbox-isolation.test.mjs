import test from 'node:test';
import assert from 'node:assert/strict';
import {onRequestPost as checkout} from '../functions/api/plus/sandbox-checkout.js';
import {onRequestPost as itn} from '../functions/api/plus/payfast-itn.js';
const DB={prepare(){throw Error('unexpected production access')},batch(){throw Error('unexpected production access')}};
const base={DB,MEMBER_AUTH_ENABLED:'true',MEMBER_AUTH_PEPPER:'x'.repeat(32),PAYFAST_SANDBOX_CHECKOUT_ENABLED:'true',PAYFAST_SANDBOX_ITN_ENABLED:'true',PAYFAST_SANDBOX_ISOLATED_DB_ENABLED:'true'};
for(const binding of [undefined,DB])test('isolated mode rejects missing or shared binding',async()=>{
 const env={...base,PAYFAST_SANDBOX_DB:binding};
 const request=new Request('https://kindelora.pages.dev/api/plus/sandbox-checkout',{method:'POST'});
 for(const handler of [checkout,itn]){
 const result=await handler({request,env});assert.equal(result.status,503);
 const body=await result.json();assert.equal(body.checkoutReady??body.grantEntitlement,false);
 }
});
