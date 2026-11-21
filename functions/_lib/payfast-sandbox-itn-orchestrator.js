// Offline-only orchestration. No public endpoint, credentials, D1 writes or charges.
// Caller must provide independent trusted results from authenticated verification.
// NEVER treat a parsed envelope or a client-provided flag as proof of payment.
import {parseSandboxItnEnvelope} from './payfast-sandbox-itn-envelope.js';
import {validateSandboxItnMerchant} from './payfast-sandbox-merchant-gate.js';
import {evaluateSandboxPayment} from './payfast-sandbox-payment-decision.js';
import {classifySandboxPaymentReplay} from './payfast-sandbox-replay-state.js';
const deny=(stage)=>({stage,accepted:false,grantEntitlement:false});
export function evaluateSandboxItnOffline({raw,contentType,expectedMerchantId,expectedOrder,
 signatureVerified,serverVerified,sourceVerified,quoteVerified,memberVerified,
 storedTransaction,storedOrder}={}){
 const envelope=parseSandboxItnEnvelope(raw,contentType);
 if(!envelope.ok)return deny('envelope');
 const merchant=validateSandboxItnMerchant({envelope,expectedMerchantId,expectedOrder});
 if(!merchant.ok)return deny('merchant_order');
 // Fail closed unless ALL independent upstream verification steps are true.
 if(signatureVerified!==true||serverVerified!==true||sourceVerified!==true||
  quoteVerified!==true||memberVerified!==true)return deny('authentication');
 const decision=evaluateSandboxPayment({
  environment:'sandbox',signatureVerified,merchantVerified:merchant.merchantVerified,
  serverVerified,quoteVerified,memberVerified,
  transactionStatus:envelope.paymentStatus,alreadyProcessed:false,
  providerTransactionId:envelope.providerTransactionId,
  merchantReference:envelope.merchantReference,
  expectedMerchantReference:expectedOrder.reference,
  paidCurrency:'ZAR',paidMinor:envelope.amountZarMinor,
  expectedZarMinor:expectedOrder.zarMinor,plan:expectedOrder.plan
 });
 if(!decision.accepted)return deny('payment_decision');
 const replay=classifySandboxPaymentReplay({decision,storedTransaction,storedOrder});
 if(replay.action!=='new_pending_atomic_commit')return deny(replay.action);
 return {stage:'pending_atomic_commit',accepted:false,grantEntitlement:false,
  providerTransactionId:decision.providerTransactionId,
  merchantReference:decision.merchantReference,plan:decision.plan,
  paidMinor:decision.paidMinor};
}
