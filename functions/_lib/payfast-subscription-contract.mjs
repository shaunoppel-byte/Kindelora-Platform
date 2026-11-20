// Offline, side-effect-free subscription entitlement decisions.
// Requires authenticated, independently verified provider events before persistence.
// No PayFast network integration or production checkout activation.
export function subscriptionEntitled(subscription, nowIso) {
  if (!subscription || typeof nowIso !== 'string' || !Number.isFinite(Date.parse(nowIso))) return false;
  if (!['active','cancelled'].includes(subscription.status)) return false;
  if (typeof subscription.current_period_end !== 'string' || !Number.isFinite(Date.parse(subscription.current_period_end))) return false;
  return Date.parse(subscription.current_period_end) > Date.parse(nowIso);
}
export function renewalDecision(subscription, event, processedIds = []) {
  if (!subscription || !event || !Array.isArray(processedIds)) throw new TypeError('invalid renewal context');
  if (event.signatureVerified !== true || event.sourceVerified !== true || event.serverVerified !== true)
    return {action:'reject',reason:'authentication_incomplete'};
  if (typeof event.id !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(event.id)) return {action:'reject',reason:'invalid_event'};
  if (processedIds.includes(event.id)) return {action:'ignore',reason:'duplicate'};
  if (event.subscriptionId !== subscription.id || event.customerId !== subscription.customer_id ||
      event.brand !== subscription.brand) return {action:'reject',reason:'subscription_mismatch'};
  if (subscription.status === 'expired' || subscription.status === 'cancelled') return {action:'reject',reason:'not_renewable'};
  if (event.paymentStatus !== 'COMPLETE') return {action:'reject',reason:'payment_not_complete'};
  if (!Number.isFinite(Date.parse(event.periodEnd)) || !Number.isFinite(Date.parse(subscription.current_period_end)) ||
      Date.parse(event.periodEnd) <= Date.parse(subscription.current_period_end))
    return {action:'reject',reason:'non_extending_period'};
  return {action:'record_renewal',newPeriodEnd:event.periodEnd};
}
