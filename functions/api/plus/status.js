// Public read-only capability endpoint. Never expose merchant credentials.
export async function onRequestGet({env}) {
  const configured = env?.PLUS_ENABLED === "true";
  // Fail closed: configuration alone never enables checkout without a deployed, verified integration.
  const data = { product:"KINDELORA Plus", checkoutAvailable:false, subscriptionsAvailable:false,
    merchantConfigured:false, status:configured?"integration_pending_verification":"merchant_verification_pending",
    displayCurrency:"USD", billingCurrency:null,
    plans:[{id:"plus-monthly",displayPrice:"$6.99 / month",period:"monthly"},
           {id:"plus-annual",displayPrice:"$69.99 / year",period:"annual"}],
    message:"PayFast merchant activation and secure checkout verification are pending. No payments are being accepted." };
  return new Response(JSON.stringify(data),{status:200,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store","x-content-type-options":"nosniff"}});
}
