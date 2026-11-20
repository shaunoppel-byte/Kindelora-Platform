// Pure, offline-only PayFast sandbox domain model. NOT a payment endpoint.
// A separately audited ITN verifier must authenticate notifications before passing them here.
// Never accept 'verified' flags from a client request.
export const USD_PRICES=Object.freeze({monthly:899,annual:8999});
const types=new Set(['COMPLETE','FAILED','CANCELLED','REFUNDED','RENEWED']);
export function quote({plan,zarMinor,rateReference}){
 if(!Object.hasOwn(USD_PRICES,plan))throw Error('invalid_plan');
 if(!Number.isSafeInteger(zarMinor)||zarMinor<=0)throw Error('verified_zar_quote_required');
 if(typeof rateReference!=='string'||!/^[-\w]{8,80}$/.test(rateReference))throw Error('verified_fx_reference_required');
 return Object.freeze({plan,displayCurrency:'USD',displayMinor:USD_PRICES[plan],settlementCurrency:'ZAR',settlementMinor:zarMinor,rateReference});
}
export function applyVerifiedEvent(state,event,{authenticated=false}={}){
 if(authenticated!==true)throw Error('unauthenticated_notification');
 if(!state||!Array.isArray(state.seen)||!['pending','active','past_due','cancelled','refunded'].includes(state.status))throw Error('invalid_state');
 if(!event||!types.has(event.type)||typeof event.id!=='string'||!/^[a-zA-Z0-9_-]{8,120}$/.test(event.id))throw Error('invalid_event');
 if(event.orderId!==state.orderId)throw Error('order_mismatch');
 if(event.currency!=='ZAR'||event.amountMinor!==state.amountMinor)throw Error('settlement_mismatch');
 if(state.seen.includes(event.id))return {...state,duplicate:true};
 if(state.seen.length>=500)throw Error('event_store_capacity_exceeded');
 let status=state.status,periodEnd=state.periodEnd??null;
 if(event.type==='COMPLETE'){
  if(status!=='pending')throw Error('invalid_transition');
  status='active';periodEnd=period(event.periodEnd);
 }else if(event.type==='RENEWED'){
  if(status!=='active'&&status!=='past_due')throw Error('invalid_transition');
  const next=period(event.periodEnd);
  if(periodEnd&&next<=periodEnd)throw Error('non_increasing_period');
  periodEnd=next;status='active';
 }else if(event.type==='FAILED'){
  if(status!=='pending'&&status!=='active')throw Error('invalid_transition');
  status=status==='active'?'past_due':'cancelled';
 }else if(event.type==='CANCELLED'){
  if(status!=='active'&&status!=='past_due')throw Error('invalid_transition');
  status='cancelled';
 }else if(event.type==='REFUNDED'){
  if(status!=='active'&&status!=='past_due'&&status!=='cancelled')throw Error('invalid_transition');
  status='refunded';periodEnd=null;
 }
 return {...state,status,periodEnd,seen:[...state.seen,event.id],duplicate:false};
}
function period(value){
 if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)||!Number.isFinite(Date.parse(value))||new Date(value).toISOString()!==value)throw Error('invalid_period');
 return value;
}
export function entitled(state,at){
 if(!state||state.status!=='active'||typeof state.periodEnd!=='string')return false;
 const now=Date.parse(at);
 return Number.isFinite(now)&&now<Date.parse(state.periodEnd);
}
