// Authenticated, read-only sandbox payment launch preflight.
// Never returns secrets or activates checkout.
import {reply,ready,member} from '../member/_auth.js';
const required=['payfast_sandbox_orders','payfast_sandbox_transactions','payfast_sandbox_fx_quotes','plus_customers','plus_subscriptions'];
export async function onRequestGet({request,env}={}){
 if(!request||!ready(env))return reply({ready:false,reason:'member_service_unavailable'},503);
 let user;try{user=await member(request,env)}catch{return reply({ready:false,reason:'member_service_unavailable'},503)}
 if(!user)return reply({ready:false,reason:'authentication_required'},401);
 let schema=false;
 try{
  const names=await env.DB.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name IN (?,?,?,?,?)").bind(...required).all();
  schema=Array.isArray(names?.results)&&required.every(name=>names.results.some(row=>row.name===name));
 }catch{return reply({ready:false,reason:'database_unavailable',checkoutReady:false},503)}
 const merchantConfigured=typeof env.PAYFAST_SANDBOX_MERCHANT_ID==='string'&&
  /^[0-9]{8,16}$/.test(env.PAYFAST_SANDBOX_MERCHANT_ID)&&
  typeof env.PAYFAST_SANDBOX_MERCHANT_KEY==='string'&&env.PAYFAST_SANDBOX_MERCHANT_KEY.length>=8&&
  typeof env.PAYFAST_SANDBOX_PASSPHRASE==='string'&&env.PAYFAST_SANDBOX_PASSPHRASE.length>0;
 const sourceConfigured=typeof env.PAYFAST_SANDBOX_ALLOWED_CIDRS==='string'&&env.PAYFAST_SANDBOX_ALLOWED_CIDRS.length>0;
 const fxEndpointConfigured=typeof env.PAYFAST_SANDBOX_FX_ENDPOINT==='string'&&(()=>{try{const u=new URL(env.PAYFAST_SANDBOX_FX_ENDPOINT);return u.protocol==='https:'&&!u.username&&!u.password&&!u.hash&&!u.search&&!u.port&&u.hostname!=='localhost'&&!u.hostname.endsWith('.local')}catch{return false}})();
 const itnEnabled=env.PAYFAST_SANDBOX_ITN_ENABLED==='true';
 const checkoutEnabled=env.PAYFAST_SANDBOX_CHECKOUT_ENABLED!=='false';
 const blockers=[...(!schema?['schema_incomplete']:[]),...(!merchantConfigured?['sandbox_merchant_configuration_missing']:[]),...(!sourceConfigured?['source_allowlist_missing']:[]),...(!fxEndpointConfigured?['trusted_fx_endpoint_missing']:[]),...(!itnEnabled?['sandbox_notification_receiver_disabled']:[]),...(!checkoutEnabled?['sandbox_checkout_disabled']:[]),'trusted_fx_issuance_not_verified','sandbox_end_to_end_not_verified','production_checkout_disabled'];
 return reply({ready:false,checkoutReady:false,sandboxConfigurationReady:schema&&merchantConfigured&&sourceConfigured&&fxEndpointConfigured&&itnEnabled&&checkoutEnabled,blockers},503);
}
