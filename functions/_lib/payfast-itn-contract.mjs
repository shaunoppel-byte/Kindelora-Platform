// PayFast ITN data validation contract. Does not grant membership.
// Cryptographic signature, PayFast source and server-to-server VALID confirmation
// MUST be performed by the caller before invoking this function.
const validAmount = value => typeof value === 'string' && /^(?:0|[1-9]\d*)\.\d{2}$/.test(value);
export function validatePayfastItnData(data, order, evidence) {
  if (!data || !order || !evidence ||
      evidence.signatureValid !== true ||
      evidence.sourceValid !== true ||
      evidence.serverConfirmed !== true) throw new Error('unverified_notification');
  if (typeof data.pf_payment_id !== 'string' || !/^\d{1,30}$/.test(data.pf_payment_id)) throw new Error('invalid_payment_reference');
  if (data.payment_status !== 'COMPLETE') throw new Error('payment_not_complete');
  if (data.merchant_id !== order.merchantId || data.m_payment_id !== order.id) throw new Error('payment_identity_mismatch');
  if (order.currency !== 'ZAR' || !Number.isSafeInteger(order.amountMinor) || order.amountMinor < 500 ||
      !validAmount(data.amount_gross)) throw new Error('invalid_payment_amount');
  const [whole, fractional] = data.amount_gross.split('.');
  const actualMinor = Number(whole) * 100 + Number(fractional);
  if (!Number.isSafeInteger(actualMinor) || actualMinor !== order.amountMinor) throw new Error('payment_amount_mismatch');
  return Object.freeze({orderId:order.id,paymentReference:data.pf_payment_id,amountMinor:actualMinor,status:'verified'});
}
