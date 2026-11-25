// Pure defensive parser for PayFast-style form-encoded ITN envelopes.
// Parsing is NOT authentication. Never grant entitlement until independent signature,
// merchant, PayFast server validation, quote and atomic ledger checks have passed.
const deny=reason=>({ok:false,reason});
export function parseSandboxItnEnvelope(raw){
 // Validate the body shape rather than trusting Content-Type: PayFast delivery
 // endpoints may omit or mislabel it. JSON bodies still fail strict key/value parsing.
 if(typeof raw!=='string'||raw.length===0||new TextEncoder().encode(raw).byteLength>16384)return deny('invalid_body_size');
 const params=new URLSearchParams(raw),values=Object.create(null);
 let count=0;
 for(const [key,value] of params){
  if(++count>64)return deny('too_many_fields');
  if(!/^[A-Za-z][A-Za-z0-9_]{0,63}$/.test(key)||value.length>2048)return deny('invalid_field');
  if(Object.hasOwn(values,key))return deny('duplicate_field');
  values[key]=value;
 }
 for(const key of ['m_payment_id','pf_payment_id','payment_status','amount_gross','merchant_id','signature']){
  if(typeof values[key]!=='string'||!values[key])return deny('missing_required_field');
 }
 if(!/^[A-Za-z0-9_-]{8,128}$/.test(values.m_payment_id)||
    !/^[A-Za-z0-9_-]{8,128}$/.test(values.pf_payment_id))return deny('invalid_reference');
 // PayFast may report fractional minor units (e.g. 157.728). Round decimal
 // strings to the nearest ZAR cent without floating-point arithmetic; the rounded
 // integer must still match the exact order amount stored in the isolated ledger.
 if(!/^[0-9]+(?:\.[0-9]{1,3})?$/.test(values.amount_gross))return deny('invalid_amount');
 const [whole,fraction='']=values.amount_gross.split('.');
 const padded=fraction.padEnd(3,'0');
 const minor=Number(whole)*100+Number(padded.slice(0,2))+(Number(padded[2])>=5?1:0);
 if(!Number.isSafeInteger(minor)||minor<=0)return deny('invalid_amount');
 if(!/^[0-9]{4,32}$/.test(values.merchant_id))return deny('invalid_merchant');
 if(!/^[a-fA-F0-9]{32}$/.test(values.signature))return deny('invalid_signature_shape');
 return {ok:true,merchantReference:values.m_payment_id,providerTransactionId:values.pf_payment_id,
  paymentStatus:values.payment_status,amountZarMinor:minor,merchantId:values.merchant_id,
  // Preserve raw bytes for subsequent signature verification; do not reconstruct signed payload.
  raw,signature:values.signature,authenticated:false,grantEntitlement:false};
}
