// Sandbox-only ledger atomic execution; NEVER activates member entitlement.
// The caller must authenticate the ITN with PayFast, verify persisted order
// and obtain a server-only pending_atomic_commit decision before invoking.
// D1 batch executes transactionally. This helper deliberately does not
// expose any payment details or exception contents in its result.
import {sandboxLedgerAtomicStatements} from './payfast-sandbox-ledger-atomic.js';
export async function commitVerifiedSandboxLedger({db,decision,order}={}){
 const deny=(reason)=>({committed:false,grantEntitlement:false,reason});
 if(!db||typeof db.batch!=='function')return deny('db_unavailable');
 const statements=sandboxLedgerAtomicStatements({db,decision,order});
 if(!statements||statements.length!==2)return deny('invalid_payment');
 try{
  const result=await db.batch(statements);
  // D1 batch atomicity is required: if an UPDATE matched no pending order,
  // the INSERT may already have committed. Never claim success in that case.
  if(!Array.isArray(result)||result.length!==2||
   result[0]?.success!==true||result[1]?.success!==true||
   result[0]?.meta?.changes!==1||result[1]?.meta?.changes!==1)
   return deny('commit_unconfirmed');
  return {committed:true,grantEntitlement:false,reason:'ledger_committed'};
 }catch{return deny('db_failure')}
}
