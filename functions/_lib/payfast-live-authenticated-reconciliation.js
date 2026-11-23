// Server-only live PayFast authenticated reconciliation, fail-closed.
// This does not execute a payment ledger transaction or grant PLUS access.
import {authenticateLivePayFastItn} from './payfast-live-authenticated-itn.js';
import {verifyPersistedLivePaymentFacts} from './payfast-live-persisted-payment-facts.js';
const deny=reason=>({ready:false,reason,grantEntitlement:false});
export async function reconcileAuthenticatedLivePayFastItn({db,request,raw,merchantId,passphrase,allowedCidrs,fetchImpl,nowMs=Date.now()}={}){
 if(!db||typeof db.prepare!=='function')return deny('db_unavailable');
 const authentication=await authenticateLivePayFastItn({request,raw,merchantId,passphrase,allowedCidrs,fetchImpl});
 if(!authentication.authenticated)return deny('authentication_failed');
 const payment=authentication.payment;
 const persisted=await verifyPersistedLivePaymentFacts({db,
  merchantReference:payment.merchantReference,merchantId:payment.merchantId,
  expectedMerchantId:merchantId,paidZarMinor:payment.amountMinor,
  providerTransactionId:payment.providerTransactionId,
  paymentStatus:payment.paymentStatus,nowMs});
 if(!persisted.verified)return deny('persisted_order_mismatch');
 return {ready:true,reason:'authenticated_live_payment_matches_pending_order',grantEntitlement:false,
  payment:Object.freeze({environment:'live',paymentStatus:'COMPLETE',verified:true,
   orderId:persisted.order.id,customerId:persisted.order.customerId,
   providerTransactionId:payment.providerTransactionId,amountMinor:persisted.order.amountMinor,
   plan:persisted.order.plan,
   // Only the source-, signature- and provider-verified ITN token may flow
   // into a future atomic recurring-link persistence step. Never use browser input.
   providerSubscriptionToken:payment.providerSubscriptionToken??null})};
}
