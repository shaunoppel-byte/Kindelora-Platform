// Dormant PLUS server-side entitlement core. Not a route or a login provider.
// Caller MUST supply an identity subject verified by a trusted server-side auth provider.
// Never use browser-supplied customer IDs, cookies or membership claims as proof.
export async function verifyPlusEntitlement({db, verifiedIdentitySubject, now = new Date().toISOString()} = {}) {
  if (!db || typeof db.prepare !== 'function' || typeof verifiedIdentitySubject !== 'string' ||
      !verifiedIdentitySubject.trim() || typeof now !== 'string' ||
      !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?Z$/.test(now) ||
      !Number.isFinite(Date.parse(now))) {
    return {entitled:false, reason:'unavailable'};
  }
  try {
    // Identity and subscription status are read from server-side D1 only.
    // Strictly compare a verified identity subject, brand, active state and expiry.
    const row = await db.prepare(`
      SELECT EXISTS (
        SELECT 1 FROM plus_subscriptions s
        JOIN plus_customers c ON c.id = s.customer_id
        WHERE c.identity_subject = ?1 AND s.brand = 'KIN'
          AND s.status IN ('active','cancelled') AND s.current_period_end > ?2
      ) AS entitled
    `).bind(verifiedIdentitySubject, now).first();
    return row?.entitled === 1 ? {entitled:true, reason:'active'} :
      {entitled:false, reason:'not_entitled'};
  } catch {
    // Missing D1 binding, unavailable database or query errors must never grant access.
    return {entitled:false, reason:'unavailable'};
  }
}
