// KINDELORA PLUS subscription lifecycle policy. Pure server-side helper.
// Not a webhook and never proof of payment. Caller must independently verify
// provider notifications, ownership, payment amount, currency and event identity.
const transitions=Object.freeze({
 pending:Object.freeze({verified_payment:'active',cancel:'cancelled'}),
 active:Object.freeze({verified_renewal:'active',payment_failed:'past_due',cancel:'cancelled',expire:'expired',verified_refund:'expired'}),
 past_due:Object.freeze({verified_renewal:'active',cancel:'cancelled',expire:'expired',verified_refund:'expired'}),
 cancelled:Object.freeze({expire:'expired',verified_refund:'expired'}),
 expired:Object.freeze({})
});
const providerEvents=new Set(['verified_payment','verified_renewal','verified_refund']);
export function subscriptionTransition({status,event,providerVerified=false}={}){
 if(typeof status!=='string'||!Object.hasOwn(transitions,status))return {allowed:false,reason:'unknown_state'};
 if(typeof event!=='string'||!Object.hasOwn(transitions[status],event))return {allowed:false,reason:'invalid_transition'};
 if(providerEvents.has(event)&&providerVerified!==true)return {allowed:false,reason:'payment_not_verified'};
 return {allowed:true,nextStatus:transitions[status][event]};
}
export function subscriptionAccess({status,currentPeriodEnd,now=new Date().toISOString()}={}){
 if(!['active','cancelled'].includes(status))return false;
 if(typeof currentPeriodEnd!=='string'||!/^\d{4}-\d\d-\d\dT/.test(currentPeriodEnd))return false;
 const expiry=Date.parse(currentPeriodEnd),instant=Date.parse(now);
 return Number.isFinite(expiry)&&Number.isFinite(instant)&&expiry>instant;
}
