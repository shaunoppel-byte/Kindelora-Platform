// Offline-only idempotency decision. This module performs no database writes.
// Real ITN handlers MUST enforce a UNIQUE provider transaction ID and order ID
// in one durable DB transaction before any subscription entitlement is granted.
export function classifySandboxPaymentReplay({decision,storedTransaction,storedOrder}={}){
 if(!decision||decision.accepted!==true||decision.grantEntitlement!==true||
  decision.environment!=='sandbox')return {action:'reject',grantEntitlement:false};
 const tx=decision.providerTransactionId,order=decision.merchantReference;
 if(typeof tx!=='string'||!tx||typeof order!=='string'||!order)return {action:'reject',grantEntitlement:false};
 if(storedTransaction===undefined||storedOrder===undefined)return {action:'reject',grantEntitlement:false};
 if(storedTransaction!==null){
  if(storedTransaction.providerTransactionId===tx&&storedTransaction.merchantReference===order&&
   storedTransaction.paidMinor===decision.paidMinor&&storedTransaction.plan===decision.plan&&
   storedTransaction.status==='COMPLETE')return {action:'duplicate',grantEntitlement:false};
  return {action:'conflict',grantEntitlement:false};
 }
 if(storedOrder!==null)return {action:'conflict',grantEntitlement:false};
 return {action:'new_pending_atomic_commit',grantEntitlement:false};
}
