// Strict PayFast ITN signature input builder. This does NOT compute/verify MD5.
// Never treat this payload as authentication or activate a subscription.
// PayFast custom ITN signs all ordered form values, including empty values, omitting signature,
// with optional merchant passphrase appended as &passphrase=... .
const encode=value=>encodeURIComponent(value).replace(/%20/g,'+').replace(/[!'()*~]/g,ch=>'%'+ch.charCodeAt(0).toString(16).toUpperCase());
export function buildPayFastItnSignaturePayload({raw,passphrase}={}){
 if(typeof raw!=='string'||raw.length===0||raw.length>16384)return {ok:false,reason:'invalid_body'};
 if(typeof passphrase!=='string'||passphrase.length>256)return {ok:false,reason:'invalid_passphrase'};
 const seen=new Set(),pairs=[];let signature=null,count=0;
 try{
  for(const [key,value] of new URLSearchParams(raw)){
   if(++count>64||!/^[A-Za-z][A-Za-z0-9_]{0,63}$/.test(key)||seen.has(key)||value.length>2048)
    return {ok:false,reason:'invalid_field'};
   if(signature!==null)return {ok:false,reason:'unsigned_trailing_field'};
   seen.add(key);
   if(key==='signature'){signature=value;continue}
   if(key==='passphrase')return {ok:false,reason:'reserved_field'};
   pairs.push(key+'='+encode(value));
  }
 }catch{return {ok:false,reason:'invalid_body'}}
 if(!signature||!/^[a-fA-F0-9]{32}$/.test(signature)||pairs.length===0)
  return {ok:false,reason:'invalid_signature'};
 // PayFast's custom ITN recipe uses urlencode(trim($passPhrase)); trim the
 // configured value as well so harmless copy/paste whitespace cannot cause
 // every provider signature check to fail.
 const normalizedPassphrase=passphrase.trim();
 if(normalizedPassphrase!=='')pairs.push('passphrase='+encode(normalizedPassphrase));
 return {ok:true,payload:pairs.join('&'),signature:signature.toLowerCase(),verified:false};
}
