// Public-safe PayFast launch diagnostics. This endpoint never reveals secret values.
// Merchant activation alone does not establish that KINDELORA can process payments.
// Fail closed until signed checkout, authenticated ITN and entitlements are wired.
const required = ['PAYFAST_MERCHANT_ID','PAYFAST_MERCHANT_KEY','PAYFAST_PASSPHRASE','DB'];
export async function onRequestGet({env}) {
  const missing = required.filter(key => !env?.[key]);
  const configured = missing.length === 0;
  return new Response(JSON.stringify({
    paymentProvider: 'PayFast',
    merchantConfigurationPresent: configured,
    checkoutAvailable: false,
    livePaymentsEnabled: false,
    reason: configured ? 'payment_workflow_not_verified' : 'merchant_configuration_incomplete',
    requiredConfiguration: required.map(key => ({name:key,present:!missing.includes(key)}))
  }),{status:200,headers:{
    'Content-Type':'application/json; charset=utf-8',
    'Cache-Control':'no-store, private',
    'X-Content-Type-Options':'nosniff'
  }});
}
