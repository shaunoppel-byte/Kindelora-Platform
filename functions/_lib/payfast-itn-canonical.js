// PayFast ITN canonicalization helper. This module does NOT authenticate a payment.
// A verifier must additionally validate MD5 signature, trusted origin, provider-side
// confirmation, merchant/order/amount, and persist an idempotent event before entitlement.
// https://developers.payfast.co.za/docs/itn-instant-transaction-notification/
const allowedKey=/^[a-z][a-z0-9_]*$/;
export function canonicalItnPayload(form,passphrase){
 if(!(form instanceof URLSearchParams))throw Error('invalid_form');
 if(typeof passphrase!=='string'||!passphrase.trim())throw Error('missing_passphrase');
 const entries=[...form.entries()];
 if(entries.length===0||entries.length>80)throw Error('invalid_field_count');
 const seen=new Set(),pairs=[];
 for(const [key,value] of entries){
  if(!allowedKey.test(key)||seen.has(key))throw Error('invalid_or_duplicate_field');
  seen.add(key);
  if(key==='signature')continue;
  if(value.length>2048)throw Error('oversized_field');
  if(value!=='')pairs.push([key,value.trim()]);
 }
 if(!seen.has('signature'))throw Error('missing_signature');
 const encode=value=>encodeURIComponent(value).replace(/%20/g,'+');
 const body=pairs.map(([k,v])=>k+'='+encode(v)).join('&');
 return body+'&passphrase='+encode(passphrase.trim());
}
export function isMd5Hex(value){return typeof value==='string'&&/^[a-fA-F0-9]{32}$/.test(value);}
