// Issue #806: private, staging-only test endpoint for Wrangler remote preview.
// No PayFast calls, production routes, or customer data.
import {runStagingAtomicity} from './payfast-d1-worker-atomicity.js';
import {runInitialRecurringAtomicity} from './payfast-d1-initial-recurring-atomicity.js';
export default {
 async fetch(request,env){
  if(new URL(request.url).pathname!=='/__issue806_test'||request.method!=='POST')
   return new Response('Not found',{status:404});
  if(env.ISSUE806_STAGING_ONLY!=='STAGING_ONLY'||!env.DB)
   return Response.json({status:'BLOCKED',reason:'staging_binding_required'},{status:403});
  try{
   const renewal=await runStagingAtomicity(env.DB);
   const initial=await runInitialRecurringAtomicity(env.DB);
   return Response.json({...renewal,tests:[...renewal.tests,...initial]},{headers:{'cache-control':'no-store'}});
  }catch(e){
   return Response.json({status:'FAIL',reason:String(e?.message||e).slice(0,240)},{status:500});
  }
 }
};
