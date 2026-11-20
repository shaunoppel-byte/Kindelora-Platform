// Offline PayFast ITN state contract. NOT an ITN authentication implementation.
// Caller MUST independently authenticate the PayFast signature, source and server validation
// before passing an event here. No network calls, D1 writes or entitlement side effects.
const terminal = new Set(['paid','refunded','cancelled']);
export function evaluateVerifiedPayfastEvent(order, event, priorEventIds = []) {
  if (!order || !event || !Array.isArray(priorEventIds)) throw new TypeError('invalid event context');
  // Explicit booleans can only be provided by a trusted server-side validation layer.
  if (event.signatureVerified !== true || event.sourceVerified !== true || event.serverVerified !== true)
    return {action:'reject',reason:'authentication_incomplete'};
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(event.id || '')) return {action:'reject',reason:'invalid_event_id'};
  if (priorEventIds.includes(event.id)) return {action:'ignore',reason:'duplicate'};
  if (event.orderId !== order.id || event.merchantId !== order.merchantId ||
      event.currency !== order.currency || !Number.isSafeInteger(event.amountMinor) ||
      event.amountMinor !== order.amountMinor)
    return {action:'reject',reason:'order_mismatch'};
  if (terminal.has(order.status)) return {action:'reject',reason:'terminal_order'};
  if (order.status !== 'pending') return {action:'reject',reason:'invalid_order_state'};
  if (event.paymentStatus === 'COMPLETE') return {action:'record_paid',reason:'verified_complete'};
  if (event.paymentStatus === 'FAILED') return {action:'record_failed',reason:'verified_failure'};
  if (event.paymentStatus === 'CANCELLED') return {action:'record_cancelled',reason:'verified_cancellation'};
  return {action:'reject',reason:'unknown_status'};
}
