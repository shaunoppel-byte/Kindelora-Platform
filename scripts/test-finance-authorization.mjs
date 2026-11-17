import assert from 'node:assert/strict';
import {canAccess,authorisedBusinesses} from '../lib/finance/authorization.mjs';
const grants=[
 {subject:'owner-1',business_id:'kindelora',role:'owner',revoked_at:null},
 {subject:'owner-1',business_id:'velora',role:'owner',revoked_at:null},
 {subject:'book-1',business_id:'kindelora',role:'bookkeeper',revoked_at:null},
 {subject:'support-1',business_id:'velora',role:'support',revoked_at:null},
 {subject:'auditor-1',business_id:'kindra',role:'auditor',expires_at:'2026-11-16T00:00:00Z',revoked_at:null},
 {subject:'revoked',business_id:'kindelora',role:'owner',revoked_at:'2026-11-17T00:00:00Z'}
];
const now=new Date('2026-11-17T12:00:00Z');
const check=(subject,businessId,permission)=>canAccess({subject,businessId,permission,grants,now});
assert.equal(check('owner-1','kindelora','staff.invite'),true);
assert.equal(check('owner-1','kindra','staff.invite'),false);
assert.equal(check('book-1','kindelora','reconcile.write'),true);
assert.equal(check('book-1','kindelora','staff.invite'),false);
assert.equal(check('support-1','velora','payment.status.read'),true);
assert.equal(check('support-1','velora','invoice.read'),false);
assert.equal(check('auditor-1','kindra','audit.read'),false);
assert.equal(check('revoked','kindelora','staff.invite'),false);
assert.equal(check('owner-1','kindelora','bank.details.change'),false);
assert.equal(canAccess({subject:'owner-1',businessId:'kindelora',permission:'staff.invite',grants:[{subject:'owner-1',business_id:'kindelora',role:'superadmin'}],now}),false);
assert.equal(canAccess({subject:'owner-1',businessId:'kindelora',permission:'staff.invite',grants:null,now}),false);
assert.deepEqual(authorisedBusinesses({subject:'owner-1',permission:'dashboard.read',grants,now}),['kindelora','velora']);
console.log('PASS: default-deny, role isolation, business scope, expiry, revocation, no privilege escalation');
