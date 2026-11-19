// PayFast hosted checkout signing foundation. Not a payment endpoint.
// All values MUST be selected server-side after authenticated order creation.
// Never accept a browser-provided price or merchant credentials.
import {createHash} from 'node:crypto';
const encode=value=>encodeURIComponent(String(value).trim()).replace(/%20/g,'+');
export function payfastParameterString(fields,passphrase=''){
 if(!fields||typeof fields!=='object'||Array.isArray(fields))throw Error('Invalid payment fields');
 if(typeof passphrase!=='string')throw Error('Invalid passphrase');
 const pairs=[];
 for(const [key,value] of Object.entries(fields)){
  if(key==='signature'||!(/^[a-z][a-z0-9_]*$/i).test(key))throw Error('Invalid field');
  if(value===null||value===undefined||String(value).trim()==='')continue;
  pairs.push(encode(key)+'='+encode(value));
 }
 if(passphrase.trim())pairs.push('passphrase='+encode(passphrase));
 return pairs.join('&');
}
export function signPayfastCheckout(fields,passphrase){
 if(!passphrase||typeof passphrase!=='string')throw Error('Passphrase required');
 return createHash('md5').update(payfastParameterString(fields,passphrase),'utf8').digest('hex');
}
export function requirePayfastServerConfig(env){
 if(!env||env.PAYFAST_CHECKOUT_ENABLED!=='true'||env.PAYFAST_RECURRING_VERIFIED!=='true')return {ready:false,reason:'release_disabled'};
 for(const key of ['PAYFAST_MERCHANT_ID','PAYFAST_MERCHANT_KEY','PAYFAST_PASSPHRASE'])if(typeof env[key]!=='string'||!env[key].trim())return {ready:false,reason:'merchant_configuration_missing'};
 if(!env.DB||typeof env.DB.prepare!=='function')return {ready:false,reason:'database_unavailable'};
 return {ready:true};
}
