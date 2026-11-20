// Authenticated, non-charging PayFast preflight.
// Does not modify the existing registration/login flows or enable payments.
import {member,ready,originOK,reply} from './member/_auth.js';
import {selectPlusPlan} from '../_lib/plus-pricing.mjs';
export async function onRequestPost({request,env}) {
  if (!ready(env)) return reply({error:'member_auth_unavailable'},503);
  if (!originOK(request)) return reply({error:'invalid_origin'},403);
  if (!(request.headers.get('content-type')||'').startsWith('application/json')) return reply({error:'json_required'},415);
  const session = await member(request,env);
  if (!session) return reply({error:'sign_in_required'},401);
  let payload;
  try { payload=await request.json(); } catch {return reply({error:'invalid_json'},400);}
  let plan;
  try {plan=selectPlusPlan(payload?.plan);} catch {return reply({error:'invalid_plan'},400);}
  return reply({
    authenticated:true,
    plan:payload.plan,
    displayCurrency:'USD',
    displayAmount:(plan.usdMinor/100).toFixed(2),
    settlementCurrency:'ZAR',
    settlementQuoteAvailable:false,
    checkoutAvailable:false,
    paymentTaken:false,
    nextStep:'verified_zar_quote_and_signed_payfast_order_required'
  },200);
}
export async function onRequestGet(){return reply({error:'method_not_allowed'},405,{Allow:'POST'});}
