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
  const run=async(stage,fn)=>{
   try{return {ok:true,result:await fn(env.DB)};}
   catch(e){return {ok:false,response:Response.json({status:'FAIL',stage,reason:String(e?.message||e).slice(0,240)},{status:500})};}
  };
  const renewal=await run('renewal_atomicity',runStagingAtomicity);
  if(!renewal.ok)return renewal.response;
  const initial=await run('initial_recurring_atomicity',runInitialRecurringAtomicity);
  if(!initial.ok)return initial.response;
  return Response.json({...renewal.result,tests:[...renewal.result.tests,...initial.result]},{headers:{'cache-control':'no-store'}});
 }
};
