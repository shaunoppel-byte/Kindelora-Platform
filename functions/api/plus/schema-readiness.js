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
 const [status,live]=await Promise.all([inspectPaymentSchema(env.DB),verifyLivePlusD1Schema({db:env.DB})]);
 // Separate sandbox/legacy readiness from the exact production live ledger contract.
 // Never claim that live charging is enabled merely because migrations are present.
 return reply({ready:status.ready,reason:status.ready?'schema_present':'schema_incomplete',
  liveSchemaReady:live.ready,liveSchemaReason:live.reason,checkoutReady:false},status.ready&&live.ready?200:503);
}
