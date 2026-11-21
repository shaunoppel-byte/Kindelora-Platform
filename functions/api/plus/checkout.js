// Safe production gate: no payment or entitlement can be created before merchant verification.
function disabled() {
  return new Response(JSON.stringify({error:"checkout_unavailable",message:"KINDELORA Plus checkout is not yet available. No payment was taken."}),{
    status:503,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store","x-content-type-options":"nosniff","retry-after":"86400"}});
}
export async function onRequestPost(){return disabled()}
export async function onRequestGet(){return disabled()}
