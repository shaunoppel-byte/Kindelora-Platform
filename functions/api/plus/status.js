// Consistent fail-closed fallback for /api/plus/status.
// The global middleware currently handles this path first. Keep the fallback
// contract identical so future routing changes cannot advertise paid access.
export async function onRequestGet() {
  return new Response(JSON.stringify({
    checkoutAvailable: false,
    membershipVerificationAvailable: false,
    paymentProvider: 'PayFast',
    status: 'pending_merchant_verification'
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store, private',
      'X-Content-Type-Options': 'nosniff'
    }
  });
}
