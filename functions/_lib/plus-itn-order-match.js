// Offline-testable PayFast ITN order matching policy.
// NOT sufficient proof of payment: caller MUST verify PayFast signature,
// merchant origin, provider confirmation and event replay protection first.
const money=/^(?:0|[1-9]\d{0,9})\.\d{2}$/;
export function verifyPaidOrderMatch({order,notification,signatureVerified=false,providerConfirmed=false}={}){
 if(signatureVerified!==true||providerConfirmed!==true)return {accepted:false,reason:'provider_unverified'};
 if(!order||!notification||typeof order!=='object'||typeof notification!=='object')return {accepted:false,reason:'missing_order'};
 if(order.status!=='pending')return {accepted:false,reason:'order_not_pending'};
 for(const key of ['m_payment_id','merchant_id','amount_gross','payment_status']){
  if(typeof notification[key]!=='string'||!notification[key].trim())return {accepted:false,reason:'invalid_notification'};
 }
 if(notification.payment_status!=='COMPLETE')return {accepted:false,reason:'not_paid'};
 if(notification.m_payment_id!==order.id||notification.merchant_id!==order.merchantId)return {accepted:false,reason:'order_mismatch'};
 if(typeof order.amount!=='string'||!money.test(order.amount)||!money.test(notification.amount_gross)||order.amount!==notification.amount_gross)return {accepted:false,reason:'amount_mismatch'};
 if(!['ZAR','USD'].includes(order.currency)||order.currency!==notification.currency)return {accepted:false,reason:'currency_mismatch'};
 if(typeof notification.pf_payment_id!=='string'||!/^[a-zA-Z0-9_-]{1,128}$/.test(notification.pf_payment_id))return {accepted:false,reason:'invalid_event'};
 return {accepted:true,providerPaymentId:notification.pf_payment_id};
}
