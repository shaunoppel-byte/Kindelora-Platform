// PayFast custom-integration ITN server-to-server validation.
// Uses fixed trusted PayFast endpoints; no caller-provided URL, no redirects.
// This check is necessary but NOT sufficient: signature, source, amount,
// merchant, persisted order and replay must also be verified independently.
const HOSTS=Object.freeze({
 sandbox:'https://sandbox.payfast.co.za/eng/query/validate',
 live:'https://www.payfast.co.za/eng/query/validate'
});
const deny=reason=>({verified:false,reason});
const encode=value=>encodeURIComponent(value).replace(/%20/g,'+').replace(/[!'()*~]/g,ch=>'%'+ch.charCodeAt(0).toString(16).toUpperCase());
export function canonicalPayFastItnBody(raw){
 if(typeof raw!=='string'||!raw||raw.length>16384)return null;
 const seen=new Set(),pairs=[];
 try{
  for(const [key,value] of new URLSearchParams(raw)){
   if(!/^[A-Za-z][A-Za-z0-9_]{0,63}$/.test(key)||seen.has(key)||value.length>2048)return null;
   seen.add(key);
   if(key==='signature')continue;
   // PayFast's custom integration uses PHP urlencode (spaces -> +) and original field order.
   pairs.push(key+'='+encode(value));
  }
 }catch{return null}
 return seen.has('signature')&&pairs.length>0?pairs.join('&'):null;
}
export async function verifyPayFastItnWithServer({raw,environment,fetchImpl=fetch}={}){
 const url=Object.hasOwn(HOSTS,environment)?HOSTS[environment]:null;
 const body=canonicalPayFastItnBody(raw);
 if(!url||!body||typeof fetchImpl!=='function')return deny('invalid_request');
 try{
  const response=await fetchImpl(url,{
   method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},
   body,redirect:'manual',cache:'no-store',signal:AbortSignal.timeout(8000)
  });
  // Cloudflare Workers supports manual redirects, not redirect:error.
  // Reject every redirect (including opaque redirects) and accept only HTTP 200.
  if(!response||response.type==='opaqueredirect'||response.status!==200||!response.ok)return deny('provider_rejected');
  const result=await response.text();
  return result==='VALID'?{verified:true,reason:'provider_valid'}:deny('provider_rejected');
 }catch{return deny('provider_unavailable')}
}
