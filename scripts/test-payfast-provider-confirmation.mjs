import test from 'node:test';
import assert from 'node:assert/strict';
import {parsePayfastValidationResponse,paymentAuthorizationGates} from '../functions/_lib/payfast-provider-confirmation.js';
test('provider confirmation only accepts exact VALID with HTTP 200',()=>{
 assert.deepEqual(parsePayfastValidationResponse(200,'VALID\n'),{ok:true,reason:'provider_confirmed'});
 for(const [code,body] of [[200,'INVALID'],[200,'valid'],[200,'VALID extra'],[503,'VALID'],[200,''],[200,'VALID\nINVALID']]){
  assert.equal(parsePayfastValidationResponse(code,body).ok,false);
 }
});
test('entitlement stays denied unless all five independently verified gates pass',()=>{
 const all={signatureValid:true,sourceTrusted:true,providerConfirmed:true,orderFactsValid:true,idempotentlyPersisted:true};
 assert.equal(paymentAuthorizationGates(all).authorized,true);
 for(const field of Object.keys(all)){
  const result=paymentAuthorizationGates({...all,[field]:false});
  assert.equal(result.authorized,false,field);
  assert.equal(result.missing.length,1,field);
 }
 assert.equal(paymentAuthorizationGates().authorized,false);
 assert.equal(paymentAuthorizationGates({...all,providerConfirmed:'true'}).authorized,false);
});
