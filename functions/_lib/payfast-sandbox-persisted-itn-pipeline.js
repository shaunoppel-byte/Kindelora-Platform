// Offline/sandbox integration only. No public route and NO PayFast authentication.
// Trusted verification booleans MUST come from independent server-only verification,
// never request JSON or query parameters. This module never grants PLUS.
import {parseSandboxItnEnvelope} from './payfast-sandbox-itn-envelope.js';
import {loadPendingSandboxOrder} from './payfast-sandbox-persisted-order.js';
import {loadSandboxReplayState} from './payfast-sandbox-replay-db-state.js';
import {evaluateSandboxItnOffline} from './payfast-sandbox-itn-orchestrator.js';
import {commitVerifiedSandboxLedger} from './payfast-sandbox-ledger-commit.js';
const deny=reason=>({committed:false,grantEntitlement:false,reason});
export async function processVerifiedSandboxItnOffline({db,raw,contentType,expectedMerchantId,
 verification}={}){
 if(!verification||verification.signatureVerified!==true||verification.serverVerified!==true||
  verification.sourceVerified!==true||verification.quoteVerified!==true||
  verification.memberVerified!==true)return deny('independent_verification_required');
 const envelope=parseSandboxItnEnvelope(raw,contentType);
 if(!envelope.ok)return deny('invalid_envelope');
 const pending=await loadPendingSandboxOrder({db,reference:envelope.merchantReference});
 if(!pending.ok)return deny('pending_order_unavailable');
 const replay=await loadSandboxReplayState({db,providerTransactionId:envelope.providerTransactionId,
  orderReference:envelope.merchantReference});
 if(!replay.ok)return deny('replay_state_unavailable');
 const decision=evaluateSandboxItnOffline({raw,contentType,expectedMerchantId,
  expectedOrder:pending.order,...verification,
  storedTransaction:replay.storedTransaction,storedOrder:replay.storedOrder});
 if(decision.stage!=='pending_atomic_commit')return deny('itn_rejected');
 return commitVerifiedSandboxLedger({db,decision,order:pending.order});
}
