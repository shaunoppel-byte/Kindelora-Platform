import assert from 'node:assert/strict';
import {processVerifiedSandboxItnOffline as process} from '../functions/_lib/payfast-sandbox-persisted-itn-pipeline.js';
const merchant='10000100',reference='order_12345678',tx='provider_12345678';
const raw=new URLSearchParams({m_payment_id:reference,pf_payment_id:tx,payment_status:'COMPLETE',amount_gross:'170.00',merchant_id:merchant,signature:'a'.repeat(32)}).toString();
const contentType='application/x-www-form-urlencoded';
const verification={signatureVerified:true,serverVerified:true,sourceVerified:true,quoteVerified:true};
const order={order_reference:reference,member_id:'member_12345678',plan:'monthly',usd_minor:899,zar_minor:17000,fx_reference:'quote_12345678',status:'pending'};
function fakeDb({storedTx=null,storedOrder=null,orderRow=order,memberRow={id:order.member_id,email_verified_at:'2026-11-21T00:00:00Z',disabled_at:null},changes=1}={}){
 let writes=0;
 const db={prepare(sql){return {bind(...args){return {async first(){
 if(sql.includes('FROM payfast_sandbox_orders WHERE'))return orderRow;
 if(sql.includes('FROM payfast_sandbox_fx_quotes WHERE'))return {quote_reference:'quote_12345678',order_reference:'order_12345678',plan:'monthly',usd_minor:899,zar_minor:17000,settlement_currency:'ZAR',environment:'sandbox',source:'server_verified',expires_at_ms:Date.now()+600000};
 if(sql.includes('FROM members WHERE id=?'))return memberRow;
 if(sql.includes('JOIN payfast_sandbox_orders'))return storedTx;
 if(sql.includes('FROM payfast_sandbox_transactions WHERE'))return storedOrder;
 throw Error('unexpected query')
 },sql,args}}}},async batch(statements){writes++;assert.equal(statements.length,2);return [{success:true,meta:{changes}},{success:true,meta:{changes}}]}};
 return {db,getWrites:()=>writes};
}
let state=fakeDb();
let r=await process({db:state.db,raw,contentType,expectedMerchantId:merchant,verification});
assert.deepEqual(r,{committed:true,grantEntitlement:false,reason:'ledger_committed'});assert.equal(state.getWrites(),1);
for(const [options,override] of [
 [{}, {verification:{...verification,serverVerified:false}}],
 [{}, {expectedMerchantId:'99999999'}],
 [{}, {raw:raw.replace('170.00','169.00')}],
 [{storedTx:{provider_transaction_id:tx,order_reference:reference,paid_zar_minor:17000,status:'COMPLETE',plan:'monthly'},storedOrder:{provider_transaction_id:tx,order_reference:reference,paid_zar_minor:17000,status:'COMPLETE'}},{}],
 [{orderRow:{...order,status:'paid'}},{}],
 [{memberRow:null},{}],
 [{memberRow:{id:order.member_id,email_verified_at:null,disabled_at:null}},{}],
 [{memberRow:{id:order.member_id,email_verified_at:'yes',disabled_at:'disabled'}},{}],
 [{changes:0},{}]
]){
 state=fakeDb(options);r=await process({db:state.db,raw,contentType,expectedMerchantId:merchant,verification,...override});
 assert.equal(r.committed,false);assert.equal(r.grantEntitlement,false);
}
state=fakeDb();r=await process({db:state.db,raw,contentType,expectedMerchantId:merchant,verification:{...verification,memberVerified:false}});
assert.equal(r.committed,true); // caller cannot override D1-derived member verification
state=fakeDb();
const wrongAmountRaw=new URLSearchParams({m_payment_id:reference,pf_payment_id:tx,
 payment_status:'COMPLETE',amount_gross:'169.00',merchant_id:merchant,signature:'a'.repeat(32)}).toString();
r=await process({db:state.db,raw:wrongAmountRaw,contentType,expectedMerchantId:merchant,verification});
assert.equal(r.committed,false);
assert.equal(r.reason,'itn_rejected_merchant_order','preserve the safe static denial stage for Cloudflare diagnostics');
assert.equal(state.getWrites(),0,'a rejected payment decision never writes the ledger');
console.log('PASS: persisted sandbox ITN verifies member from D1; fail closed; no entitlement granted');
