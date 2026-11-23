import assert from 'node:assert/strict';
import {reconcileAuthenticatedLivePayFastItn as reconcile} from '../functions/_lib/payfast-live-authenticated-reconciliation.js';
const request={headers:{get(key){return key==='content-type'?'application/x-www-form-urlencoded':'192.0.2.12'}}};
const base={request,merchantId:'10000100',passphrase:'server-only-passphrase',allowedCidrs:'192.0.2.0/24',raw:'m_payment_id=order_12345678&pf_payment_id=provider_12345678&payment_status=COMPLETE&amount_gross=165.00&merchant_id=10000100&signature=00000000000000000000000000000000',fetchImpl:async()=>{throw Error('must not call')}};
let reads=0;const db={prepare(){reads++;return {bind(){return {async first(){throw Error('should never read before authentication')}}}}}};
let result=await reconcile({...base,db});assert.equal(result.ready,false);assert.equal(result.grantEntitlement,false);assert.equal(reads,0);
result=await reconcile({...base,db:null});assert.equal(result.reason,'db_unavailable');
result=await reconcile({...base,db,raw:base.raw.replace('COMPLETE','FAILED')});assert.equal(result.ready,false);assert.equal(reads,0);
console.log('PASS: live reconciliation rejects unauthenticated ITN before database access');

// The reconciliation boundary must preserve the independently authenticated
// provider token, while continuing to deny all unauthenticated input.
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../functions/_lib/payfast-live-authenticated-reconciliation.js',import.meta.url),'utf8');
assert.match(source,/providerSubscriptionToken:payment\.providerSubscriptionToken\?\?null/);
assert.match(source,/if\(!authentication\.authenticated\)return deny\('authentication_failed'\)/);
console.log('PASS: authenticated recurring token forwarding contract');
