// Authenticated, read-only D1 payment schema readiness.
// No migrations, checkout, secrets, table names or entitlement changes.
import {reply,ready,member} from '../member/_auth.js';
import {inspectPaymentSchema} from '../../_lib/payfast-d1-schema-readiness.js';
import {verifyLivePlusD1Schema} from '../../_lib/payfast-live-d1-schema-preflight.js';
export async function onRequestGet({request,env}={}){
 if(!ready(env))return reply({ready:false,reason:'member_service_unavailable'},503);
 let user;
 try{user=await member(request,env)}catch{return reply({ready:false,reason:'member_service_unavailable'},503)}
 if(!user)return reply({ready:false,reason:'authentication_required'},401);
 const [status,live]=await Promise.all([inspectPaymentSchema(env.DB),verifyLivePlusD1Schema({db:env.DB,requireRecurring:true})]);
 // Separate sandbox/legacy readiness from the exact production live ledger contract.
 // Never claim that live charging is enabled merely because migrations are present.
 const flags=['KINDELORA_PLUS_CHECKOUT_RELEASE_APPROVED','PAYFAST_LIVE_CHECKOUT_ENABLED','PAYFAST_LIVE_ITN_ENABLED','PAYFAST_LIVE_RECURRING_VERIFIED','PAYFAST_LIVE_INITIAL_RECURRING_LINK_ENABLED','PAYFAST_LIVE_RENEWAL_ITN_ENABLED'];
 const releaseFlagsReady=flags.every(key=>env[key]==='true');
 const merchantConfigured=/^[0-9]{8,16}$/.test(env.PAYFAST_LIVE_MERCHANT_ID||'')&&typeof env.PAYFAST_LIVE_MERCHANT_KEY==='string'&&env.PAYFAST_LIVE_MERCHANT_KEY.length>=8&&typeof env.PAYFAST_LIVE_PASSPHRASE==='string'&&!!env.PAYFAST_LIVE_PASSPHRASE&&typeof env.PAYFAST_LIVE_ALLOWED_CIDRS==='string'&&!!env.PAYFAST_LIVE_ALLOWED_CIDRS.trim();
 let atomicSchemaReady=false;
 if(live.ready)try{
  const guard=await env.DB.prepare('PRAGMA table_info(plus_payfast_renewal_atomic_guard)').all();
  const events=await env.DB.prepare('PRAGMA table_info(plus_payfast_renewal_events)').all();
  const ddl=await env.DB.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='plus_payfast_renewal_atomic_guard'").first();
  const normalized=String(ddl?.sql||'').toLowerCase().replace(/[\s"'\x60\[\]]/g,'');
  atomicSchemaReady=normalized.includes('check(expected_changes=1)')&&normalized.includes('check(singleton=1)')&&guard.results.some(r=>r.name==='singleton'&&r.pk===1)&&guard.results.some(r=>r.name==='expected_changes'&&r.notnull===1)&&events.results.filter(r=>r.pk>0).length===1&&events.results.some(r=>r.name==='provider_transaction_id'&&r.pk===1);
 }catch{}
 const productionPrerequisitesReady=releaseFlagsReady&&merchantConfigured&&live.ready&&atomicSchemaReady;
 return reply({ready:status.ready,reason:status.ready?'schema_present':'schema_incomplete',
  liveSchemaReady:live.ready,liveSchemaReason:live.reason,checkoutReady:false,
  productionPrerequisitesReady,releaseFlagsReady,merchantConfigured,atomicSchemaReady},status.ready&&live.ready?200:503);
}
