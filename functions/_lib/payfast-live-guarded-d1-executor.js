// Server-only guarded D1 batch executor. Never exposes payment activation to
// browser requests. Caller MUST independently authenticate live PayFast ITN,
// reconcile the pending order and load authoritative subscription state.
import {prepareGuardedLivePlusBatch} from './payfast-live-guarded-batch-preflight.js';
import {evaluateGuardedLivePlusBatch} from './payfast-live-atomic-rollback-guard.js';
const deny=reason=>({committed:false,reason,grantEntitlement:false});
export async function executeGuardedLivePlusBatch({db,preflight,verifiedAt}={}){
 if(!db||typeof db.batch!=='function'||typeof db.prepare!=='function')return deny('d1_batch_unavailable');
 const guarded=prepareGuardedLivePlusBatch({db,preflight,verifiedAt});
 if(!guarded.ready||!guarded.requiresAtomicBatch||guarded.statements?.length!==4)return deny('guarded_preflight_failed');
 try{
  // D1 batch is transactional; the fourth SQL statement forces a constraint
  // violation when the expected subscription update did not occur.
  const results=await db.batch(guarded.statements);
  const outcome=evaluateGuardedLivePlusBatch(results);
  return {committed:outcome.committed,reason:outcome.reason,grantEntitlement:false};
 }catch{return deny('transaction_failed')}
}
