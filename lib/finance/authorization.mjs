// Pure, default-deny finance authorization policy.
// Caller MUST obtain subject and grants from verified server-side session + private DB.
// Never trust headers, browser localStorage, URL params or caller-supplied role names.
export const ROLES = Object.freeze(['owner','finance_admin','bookkeeper','support','auditor']);
const RIGHTS = Object.freeze({
  owner:['dashboard.read','invoice.read','invoice.export','payment.read','reconcile.read','reconcile.write','staff.invite','staff.revoke','audit.read','refund.request'],
  finance_admin:['dashboard.read','invoice.read','invoice.export','payment.read','reconcile.read','reconcile.write','audit.read','refund.request'],
  bookkeeper:['dashboard.read','invoice.read','invoice.export','payment.read','reconcile.read','reconcile.write'],
  support:['payment.status.read','invoice.resend'],
  auditor:['dashboard.read','invoice.read','invoice.export','payment.read','reconcile.read','audit.read']
});
export function canAccess({subject,businessId,permission,grants,now=new Date()}={}) {
  if(typeof subject!=='string'||!subject||typeof businessId!=='string'||!businessId||typeof permission!=='string'||!permission||!Array.isArray(grants))return false;
  if(!(now instanceof Date)||!Number.isFinite(now.getTime()))return false;
  return grants.some(g=>{
    if(!g||g.subject!==subject||g.business_id!==businessId||!ROLES.includes(g.role)||g.revoked_at)return false;
    if(g.expires_at&&(!Number.isFinite(Date.parse(g.expires_at))||Date.parse(g.expires_at)<=now.getTime()))return false;
    return RIGHTS[g.role].includes(permission);
  });
}
export function authorisedBusinesses({subject,permission,grants,now=new Date()}={}) {
  if(!Array.isArray(grants))return [];
  return [...new Set(grants.filter(g=>g&&typeof g.business_id==='string'&&canAccess({subject,businessId:g.business_id,permission,grants,now})).map(g=>g.business_id))].sort();
}
