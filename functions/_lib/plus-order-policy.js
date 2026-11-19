import {resolvePayfastCharge} from './plus-price-gate.js';
// Pure server-side checkout order policy. NOT a checkout route.
// The authenticated identity must come from trusted server session verification.
export function preparePlusOrder({planId,verifiedIdentitySubject,env,orderId}={}){
 if(typeof verifiedIdentitySubject!=='string'||!/^[a-zA-Z0-9:_-]{1,128}$/.test(verifiedIdentitySubject))return {ready:false,reason:'identity_unverified'};
 if(typeof orderId!=='string'||!/^ord_[a-f0-9]{32}$/.test(orderId))return {ready:false,reason:'invalid_order_id'};
 const charge=resolvePayfastCharge({planId,env});
 if(!charge.ready)return charge;
 if(!env?.DB||typeof env.DB.prepare!=='function')return {ready:false,reason:'database_unavailable'};
 return {ready:true,order:{id:orderId,identitySubject:verifiedIdentitySubject,brand:'KIN',planId:charge.planId,amountMinor:charge.amountMinor,currency:charge.currency,status:'pending'}};
}
export function createOrderId(){
 const bytes=crypto.getRandomValues(new Uint8Array(16));
 return 'ord_'+Array.from(bytes,x=>x.toString(16).padStart(2,'0')).join('');
}
