// Sandbox-only server-to-server ITN confirmation. No charge, writes or entitlements.
// PayFast official ITN spec: POST canonical notification params to sandbox
// /eng/query/validate; only exact VALID response confirms server receipt.
// Signature, merchant, source, amount, ledger and member checks are SEPARATE gates.
export async function confirmSandboxItnWithPayfast({parameterString,fetchImpl=fetch}={}){
 if(typeof parameterString!=='string'||parameterString.length<20||
  parameterString.length>16384||/[\r\n\0]/.test(parameterString)||
  typeof fetchImpl!=='function')return false;
 // Never send signatures, credentials, or arbitrary payloads to caller-selected hosts.
 let response;
 try{
  response=await fetchImpl('https://sandbox.payfast.co.za/eng/query/validate',{
   method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},
   body:parameterString,redirect:'error',signal:AbortSignal.timeout(8000)
  });
  if(!response.ok)return false;
  const responseText=await response.text();
  return responseText==='VALID';
 }catch{return false}
}
