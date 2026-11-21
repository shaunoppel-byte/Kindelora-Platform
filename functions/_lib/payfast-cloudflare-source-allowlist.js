// Server-side PayFast ITN source gate for Cloudflare Pages Functions.
// Only CF-Connecting-IP from Cloudflare's trusted edge may be used.
// Allowlist must be explicitly configured by operator from verified PayFast IPs.
// Never accept X-Forwarded-For, query parameters or client JSON as identity.
const deny=reason=>({verified:false,reason});
function ip4(input){
 if(typeof input!=='string'||!/^(?:\d{1,3}\.){3}\d{1,3}$/.test(input))return null;
 const parts=input.split('.').map(Number);
 if(parts.some(x=>x>255)||parts.some((x,i)=>String(x)!==input.split('.')[i]))return null;
 return parts.reduce((v,x)=>((v<<8)|x)>>>0,0);
}
function cidr(entry){
 if(typeof entry!=='string')return null;
 const [ip,prefix]=entry.split('/');
 if(entry.split('/').length>2)return null;
 const n=prefix===undefined?32:Number(prefix);
 if(!Number.isInteger(n)||n<0||n>32||prefix!==undefined&&String(n)!==prefix)return null;
 const value=ip4(ip);if(value===null)return null;
 const mask=n===0?0:(0xffffffff<<(32-n))>>>0;
 if((value&mask)!==(value>>>0))return null; // require canonical network address
 return {value,mask};
}
export function verifyPayFastCloudflareSource({request,allowedCidrs}={}){
 if(!request||!request.headers||typeof request.headers.get!=='function')return deny('invalid_request');
 if(typeof allowedCidrs!=='string'||!allowedCidrs.trim())return deny('allowlist_unavailable');
 const entries=allowedCidrs.split(',').map(x=>x.trim());
 if(entries.length>64||entries.some(x=>!x))return deny('invalid_allowlist');
 const networks=entries.map(cidr);
 if(networks.some(x=>!x))return deny('invalid_allowlist');
 const source=request.headers.get('cf-connecting-ip');
 const ip=ip4(source);
 if(ip===null)return deny('untrusted_source');
 return networks.some(x=>(ip&x.mask)===x.value)?
  {verified:true,reason:'source_allowlisted'}:deny('source_not_allowlisted');
}
