// Production checkout remains fail-closed unless explicitly enabled by a
// separate server-owned release gate AND the staged orchestrator's own gates.
// This route does not activate charging, migrate D1 or change registration.
import {onRequestPost as stagedCheckout} from '../../_lib/plus-live-checkout-orchestration-staged.js';
function disabled(){return new Response(JSON.stringify({error:'checkout_unavailable',message:'KINDELORA Plus checkout is not yet available. No payment was taken.'}),{status:503,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff','retry-after':'86400'}})}
export async function onRequestPost(context){
 if(context?.env?.KINDELORA_PLUS_CHECKOUT_RELEASE_APPROVED!=='true')return disabled();
 return stagedCheckout(context);
}
export async function onRequestGet(){return disabled()}
