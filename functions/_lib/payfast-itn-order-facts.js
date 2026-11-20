// Offline validation only. Never use this result to grant PLUS access.
// PayFast's official ITN guide requires signature, trusted source and server
// confirmation IN ADDITION to merchant, order and amount checks.
// https://developers.payfast.co.za/docs/itn-instant-transaction-notification/
const exactMoney=value=>typeof value==='string'&&/^(?:0|[1-9]\d{0,8})\.\d{2}$/.test(value);
export function validateItnOrderFacts(payload,expected){
 if(!payload||!expected)return {ok:false,reason:'missing_data'};
 if(typeof expected.merchantId!=='string'||!/^\d{6,12}$/.test(expected.merchantId))return {ok:false,reason:'invalid_expected_merchant'};
 if(typeof expected.orderId!=='string'||!expected.orderId||!Number.isSafeInteger(expected.amountMinor)||expected.amountMinor<=0)return {ok:false,reason:'invalid_expected_order'};
 if(payload.merchant_id!==expected.merchantId)return {ok:false,reason:'merchant_mismatch'};
 if(payload.m_payment_id!==expected.orderId)return {ok:false,reason:'order_mismatch'};
 if(!exactMoney(payload.amount_gross))return {ok:false,reason:'invalid_amount'};
 const [whole,fraction]=payload.amount_gross.split('.');
 const amountMinor=Number(whole)*100+Number(fraction);
 if(!Number.isSafeInteger(amountMinor)||amountMinor!==expected.amountMinor)return {ok:false,reason:'amount_mismatch'};
 if(payload.payment_status!=='COMPLETE')return {ok:false,reason:'not_complete'};
 if(typeof payload.pf_payment_id!=='string'||!/^\d{1,40}$/.test(payload.pf_payment_id))return {ok:false,reason:'invalid_payment_reference'};
 return {ok:true,reason:'order_facts_match_only',paymentReference:payload.pf_payment_id,authenticated:false};
}
