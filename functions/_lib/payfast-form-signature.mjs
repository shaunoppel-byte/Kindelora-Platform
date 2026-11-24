// PayFast hosted-payment signature helper for Cloudflare Workers.
// IMPORTANT: This is a form signature, NOT the alphabetical API signature.
// Build fields in PayFast's prescribed order, then append the passphrase last.
// This module does not initiate a payment or expose the passphrase to clients.
const ORDER=['merchant_id','merchant_key','return_url','cancel_url','notify_url','name_first','name_last','email_address','cell_number','m_payment_id','amount','item_name','item_description','custom_int1','custom_int2','custom_int3','custom_int4','custom_int5','custom_str1','custom_str2','custom_str3','custom_str4','custom_str5','email_confirmation','confirmation_address','payment_method','subscription_type','billing_date','recurring_amount','frequency','cycles'];
// Match PHP urlencode used in PayFast's official form-signature examples,
// including escaping punctuation that encodeURIComponent leaves unescaped.
const enc=value=>encodeURIComponent(String(value).trim()).replace(/%20/g,'+').replace(/[!'()*~]/g,ch=>'%'+ch.charCodeAt(0).toString(16).toUpperCase());
export function canonicalPayfastForm(fields,passphrase) {
  if (!fields||typeof fields!=='object'||Array.isArray(fields))throw new TypeError('invalid_fields');
  if(typeof passphrase!=='string'||!passphrase.trim())throw new TypeError('missing_passphrase');
  if(Object.keys(fields).some(key=>!ORDER.includes(key)&&key!=='signature'))throw new TypeError('unsupported_field');
  const values=ORDER.filter(key=>fields[key]!==undefined&&fields[key]!==null&&String(fields[key]).trim()!=='')
    .map(key=>key+'='+enc(fields[key]));
  if(!fields.merchant_id||!fields.merchant_key||!fields.m_payment_id||!fields.amount)throw new TypeError('missing_required_fields');
  values.push('passphrase='+enc(passphrase));
  return values.join('&');
}
// MD5 is specified by PayFast's legacy hosted-form protocol, not a general
// cryptographic choice. Pure JS implementation avoids Node crypto in Workers.
function md5(input){
  const bytes=new TextEncoder().encode(input);
  const length=bytes.length, padded=((length+8>>>6)+1)*64;
  const buf=new Uint8Array(padded);
  buf.set(bytes);buf[length]=128;
  const bits=BigInt(length)*8n;
  for(let i=0;i<8;i++)buf[padded-8+i]=Number((bits>>BigInt(8*i))&255n);
  const words=new DataView(buf.buffer);
  let a0=0x67452301,b0=0xefcdab89,c0=0x98badcfe,d0=0x10325476;
  const shift=[7,12,17,22,5,9,14,20,4,11,16,23,6,10,15,21,6,10,15,21];
  const K=Array.from({length:64},(_,i)=>Math.floor(Math.abs(Math.sin(i+1))*4294967296)>>>0);
  const rot=(x,s)=>(x<<s)|(x>>>(32-s));
  for(let off=0;off<padded;off+=64){
    let A=a0,B=b0,C=c0,D=d0;
    for(let i=0;i<64;i++){
      let f,g,s;
      if(i<16){f=(B&C)|(~B&D);g=i;s=shift[i%4];}
      else if(i<32){f=(D&B)|(~D&C);g=(5*i+1)%16;s=shift[4+i%4];}
      else if(i<48){f=B^C^D;g=(3*i+5)%16;s=shift[8+i%4];}
      else{f=C^(B|~D);g=(7*i)%16;s=shift[12+i%4];}
      const v=(A+f+K[i]+words.getUint32(off+g*4,true))>>>0;
      [A,B,C,D]=[D,(B+rot(v,s))>>>0,B,C];
    }
    a0=(a0+A)>>>0;b0=(b0+B)>>>0;c0=(c0+C)>>>0;d0=(d0+D)>>>0;
  }
  return [a0,b0,c0,d0].map(n=>[0,8,16,24].map(s=>((n>>>s)&255).toString(16).padStart(2,'0')).join('')).join('');
}
export function signPayfastForm(fields,passphrase){return md5(canonicalPayfastForm(fields,passphrase));}
