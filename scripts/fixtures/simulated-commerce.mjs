// OFFLINE TEST HARNESS ONLY. Not a PayFast implementation or a production payment gateway.
// No network, secrets, bank accounts or actual customer data.
import {createHash} from 'node:crypto';
const prefixes=Object.freeze({OPE:'OPE',KIN:'KIN',VEL:'VEL',KDR:'KDR',SOL:'SOL'});
export class SimulatedCommerce {
 constructor(){this.orders=new Map();this.events=new Set();this.invoices=new Map();this.seq=new Map();this.entitlements=new Map();this.outbox=new Map();this.audit=[];}
 order({id,business,customer,amount_minor,currency='ZAR'}){
  if(!Object.hasOwn(prefixes,business)||!id||!customer||!Number.isSafeInteger(amount_minor)||amount_minor<=0||currency!=='ZAR'||this.orders.has(id))throw Error('invalid order');
  const o={id,business,customer,amount_minor,currency,status:'pending',paymentId:null};
  this.orders.set(id,o);return {...o};
 }
 event({eventId,orderId,paymentId,amount_minor,currency='ZAR',status,verified=false}){
  // verified is a synthetic *test fixture* flag; never a production proof of payment.
  if(!verified)return {result:'rejected_unverified'};
  if(this.events.has(eventId))return {result:'duplicate_event'};
  const o=this.orders.get(orderId);
  if(!o||!eventId||!paymentId||amount_minor!==o.amount_minor||currency!==o.currency)return {result:'rejected_mismatch'};
  if(!['complete','failed','cancelled','refunded'].includes(status))return {result:'rejected_status'};
  if(o.paymentId&&o.paymentId!==paymentId)return {result:'rejected_payment_reference'};
  this.events.add(eventId);
  if(status==='complete'){
   if(o.status==='paid')return {result:'already_paid',invoice:this.invoices.get(orderId).number};
   if(o.status!=='pending')return {result:'rejected_transition'};
   o.status='paid';o.paymentId=paymentId;
   const key=o.business+'-2026';const n=(this.seq.get(key)||0)+1;this.seq.set(key,n);
   const number=key+'-'+String(n).padStart(6,'0');
   if([...this.invoices.values()].some(i=>i.number===number))throw Error('invoice collision');
   const invoice={number,orderId,business:o.business,customer:o.customer,amount_minor:o.amount_minor,currency:o.currency,watermark:'SYNTHETIC TEST — NOT AN INVOICE'};
   this.invoices.set(orderId,invoice);this.entitlements.set(o.customer+'|'+o.business,true);
   this.outbox.set(number,{invoice:number,status:'queued',attempts:0});
   this.audit.push({action:'synthetic_paid',orderId,invoice:number});
   return {result:'paid',invoice:number};
  }
  if(status==='refunded'){
   if(o.status!=='paid')return {result:'rejected_transition'};
   o.status='refunded';this.entitlements.set(o.customer+'|'+o.business,[...this.orders.values()].some(other=>other.customer===o.customer&&other.business===o.business&&other.status==='paid'));
   this.audit.push({action:'synthetic_refund',orderId});return {result:'refunded'};
  }
  if(o.status!=='pending')return {result:'rejected_transition'};
  o.status=status;this.audit.push({action:'synthetic_'+status,orderId});return {result:status};
 }
 canAccess(customer,business){return this.entitlements.get(customer+'|'+business)===true;}
 getInvoice(orderId,customer){const o=this.orders.get(orderId);return o?.customer===customer?this.invoices.get(orderId)||null:null;}
 deliver(invoiceNumber,{success=false}={}){const item=this.outbox.get(invoiceNumber);if(!item)return {result:'missing'};if(item.status==='sent')return {result:'already_sent'};item.attempts++;item.status=success?'sent':'retry_pending';return {result:item.status,attempts:item.attempts};}
 snapshot(){return {orders:this.orders.size,invoices:this.invoices.size,outbox:[...this.outbox.values()],audit:[...this.audit],digest:createHash('sha256').update(JSON.stringify(this.audit)).digest('hex')};}
}
