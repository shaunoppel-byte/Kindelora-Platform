import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {createPendingPlusOrder} from '../functions/_lib/plus-orders.mjs';
const input=()=>({
  orderId:'11111111-1111-4111-8111-111111111111',
  customerId:'22222222-2222-4222-8222-222222222222',
  identitySubject:'member_123',
  planId:'monthly',
  fxSource:'approved_quote_provider',
  fxReference:'quote_123',
  quote:{approved:true,sourceCurrency:'USD',settlementCurrency:'ZAR',usdMinor:899,zarMinor:16500,expiresAtMs:Date.now()+60000}
});
function fakeDB(results){
  const statements=[];
  return {
    statements,
    prepare(sql){return {bind(...params){const item={sql,params};statements.push(item);return item;}}},
    async batch(items){assert.equal(items.length,3);return results;}
  };
}
test('creates customer, pending order and accepted quote in one D1 batch',async()=>{
  const db=fakeDB([{success:true},{success:true},{success:true}]);
  const result=await createPendingPlusOrder(db,input());
  assert.equal(result.status,'pending');assert.equal(result.settlementZarMinor,16500);
  assert.equal(db.statements.length,3);
  assert.match(db.statements[1].sql,/plus_orders/);
  assert.match(db.statements[2].sql,/plus_order_quotes/);
  assert.equal(db.statements[2].params[3],16500);
});
test('rejects stale quote without touching database',async()=>{
  const db=fakeDB([]);
  await assert.rejects(createPendingPlusOrder(db,{...input(),quote:{...input().quote,expiresAtMs:0}}),/verified_zar_quote_required/);
  assert.equal(db.statements.length,0);
});
test('rejects any failed batch result',async()=>{
  const db=fakeDB([{success:true},{success:false},{success:true}]);
  await assert.rejects(createPendingPlusOrder(db,input()),/order_not_persisted/);
});
test('rejects unknown plan and invalid identifiers',async()=>{
  const db=fakeDB([]);
  await assert.rejects(createPendingPlusOrder(db,{...input(),planId:'free'}));
  await assert.rejects(createPendingPlusOrder(db,{...input(),orderId:'not-a-uuid'}));
});
