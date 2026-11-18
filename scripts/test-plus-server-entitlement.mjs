import assert from 'node:assert/strict';
import {verifyPlusEntitlement} from '../functions/_lib/plus-entitlement.js';

let calls=0;
function database(result, fail=false) {
  return {prepare(sql) {
    assert.match(sql,/JOIN plus_customers c ON c.id = s.customer_id/);
    assert.match(sql,/c.identity_subject = \?1/);
    assert.match(sql,/s.brand = 'KIN'/);
    assert.match(sql,/s.status = 'active'/);
    assert.match(sql,/s.current_period_end > \?2/);
    return {bind(subject,now) {
      assert.equal(subject,'trusted-server-subject');
      assert.equal(now,'2026-11-18T12:00:00.000Z');
      return {async first(){calls++;if(fail)throw Error('db unavailable');return {entitled:result};}};
    }};
  }};
}
const base={verifiedIdentitySubject:'trusted-server-subject',now:'2026-11-18T12:00:00.000Z'};
assert.deepEqual(await verifyPlusEntitlement({...base,db:database(1)}),{entitled:true,reason:'active'});
assert.deepEqual(await verifyPlusEntitlement({...base,db:database(0)}),{entitled:false,reason:'not_entitled'});
assert.deepEqual(await verifyPlusEntitlement({...base,db:database('1')}),{entitled:false,reason:'not_entitled'});
assert.deepEqual(await verifyPlusEntitlement({...base,db:database(1,true)}),{entitled:false,reason:'unavailable'});
const before=calls;
for(const bad of [
  {...base,db:null}, {...base,db:database(1),verifiedIdentitySubject:''},
  {...base,db:database(1),verifiedIdentitySubject:null},
  {...base,db:database(1),now:'not-a-time'},
  {...base,db:database(1),now:'2026-11-18T12:00:00+02:00'}
]) assert.deepEqual(await verifyPlusEntitlement(bad),{entitled:false,reason:'unavailable'});
assert.equal(calls,before,'invalid identity/time must never query database');
console.log('PASS: dormant server-side entitlement verifies trusted identity only and fails closed');
