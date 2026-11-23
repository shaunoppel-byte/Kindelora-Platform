// Issue #806: private, staging-only test endpoint for Wrangler remote preview.
// No PayFast calls, production routes, or customer data.
import {runStagingAtomicity} from './payfast-d1-worker-atomicity.js';
export default {
 async fetch(request,env){
  if(new URL(request.url).pathname!=='/__issue806_test'||request.method!=='POST')
   return new Response('Not found',{status:404});
  if(env.ISSUE806_STAGING_ONLY!=='STAGING_ONLY'||!env.DB)
   return Response.json({status:'BLOCKED',reason:'staging_binding_required'},{status:403});
  try{
   return Response.json(await runStagingAtomicity(env.DB),{headers:{'cache-control':'no-store'}});
  }catch(e){
   return Response.json({status:'FAIL',reason:String(e?.message||e).slice(0,240)},{status:500});
  }
 }
};
