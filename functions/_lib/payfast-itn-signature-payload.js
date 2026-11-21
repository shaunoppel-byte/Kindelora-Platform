// Strict PayFast ITN signature input builder. This does NOT compute/verify MD5.
// Never treat this payload as authentication or activate a subscription.
// PayFast custom ITN signs ordered, non-empty form values, omitting signature,
// with optional merchant passphrase appended as &passphrase=... .
const encode=value=>encodeURIComponent(value).replace(/%20/g,'+').replace(/[!'()*~]/g,ch=>'%'+ch.charCodeAt(0).toString(16).toUpperCase();
export function buildPayFastItnSignaturePayload({raw,passphrase}={}){
 if(typeof raw!=='string'||raw.length===0||raw.length>16384)return {ok:false,reason:'invalid_body'};
 if(typeof passphrase!=='string'||passphrase.length>256)return {ok:false,reason:'invalid_passphrase'};
 const seen=new Set(),pairs=[];let signature=null,count=0;
 try{
  for(const [key,value] of new URLSearchParams(raw)){
   if(++count>64||!/^[A-Za-z][A-Za-z0-9_]{0,63}$/.test(key)||seen.has(key)||value.length>2048)
    return {ok:false,reason:'invalid_field'};
   seen.add(key);
   if(key==='signature'){signature=value;continue}
   if(key==='passphrase')return {ok:false,reason:'reserved_field'};
   if(value.trim()!=='')pairs.push(key+'='+encode(value.trim()));
  }
 }catch{return {ok:false,reason:'invalid_body'}}
 if(!signature||!/^[a-fA-F0-9]{32}$/.test(signature)||pairs.length===0)
  return {ok:false,reason:'invalid_signature'};
 if(passphrase!=='')pairs.push('passphrase='+encode(passphrase));
 return {ok:true,payload:pairs.join('&'),signature:signature.toLowerCase(),verified:false};
}
