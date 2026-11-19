// Consistent fail-closed fallback for /api/plus/status.
// The global middleware currently handles this path first. Merchant activation was confirmed on 2026-11-19; secure integration is still pending. Keep the fallback
// contract identical so future routing changes cannot advertise paid access.
export async function onRequestGet() {
  return new Response(JSON.stringify({
    checkoutAvailable: false,
    membershipVerificationAvailable: false,
    paymentProvider: 'PayFast',
    status: 'pending_secure_payment_integration'
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store, private',
      'X-Content-Type-Options': 'nosniff'
    }
  });
}
