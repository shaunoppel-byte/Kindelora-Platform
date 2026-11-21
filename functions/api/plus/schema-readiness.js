// Authenticated, read-only D1 payment schema readiness.
// No migrations, checkout, secrets, table names or entitlement changes.
import {reply,ready,member} from '../member/_auth.js';
import {inspectPaymentSchema} from '../../_lib/payfast-d1-schema-readiness.js';
export async function onRequestGet({request,env}={}){
 if(!ready(env))return reply({ready:false,reason:'member_service_unavailable'},503);
 let user;
 try{user=await member(request,env)}catch{return reply({ready:false,reason:'member_service_unavailable'},503)}
 if(!user)return reply({ready:false,reason:'authentication_required'},401);
 const status=await inspectPaymentSchema(env.DB);
 return reply({ready:status.ready,reason:status.ready?'schema_present':'schema_incomplete',checkoutReady:false},status.ready?200:503);
}
